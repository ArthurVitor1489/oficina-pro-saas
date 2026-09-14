"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { purchases, purchaseItems, NewPurchase, NewPurchaseItem } from "@/db/schema/purchases";
import { suppliers, NewSupplier } from "@/db/schema/suppliers";
import { products, NewProduct } from "@/db/schema/products";
import { stockMovements, NewStockMovement } from "@/db/schema/stock_movements";
import { financialTransactions, NewFinancialTransaction } from "@/db/schema/finance";
import { attachments, NewAttachment } from "@/db/schema/attachments";
import { requireTenantPermission } from "@/lib/server/tenant-context";
import { generateUUID } from "@/lib/server/crypto";
import { logAudit } from "@/lib/server/audit";
import { parseNFeXml } from "./nfe-parser";
import { eq, and, sql } from "drizzle-orm";

export async function importNFeXmlAction(xmlContent: string) {
  try {
    const { companyId, user } = await requireTenantPermission("manage:purchases");

    if (!xmlContent || !xmlContent.trim()) {
      return { error: "Conteúdo do arquivo XML não foi fornecido." };
    }

    // 1. Parsing do XML
    const parsed = parseNFeXml(xmlContent);

    // 2. Resolução / Cadastro automático do Fornecedor por CNPJ
    let supplier = await db
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.companyId, companyId), eq(suppliers.document, parsed.supplier.cnpj)))
      .limit(1)
      .then((rows) => rows[0]);

    if (!supplier) {
      const newSupplierId = generateUUID();
      const newSupplier: NewSupplier = {
        id: newSupplierId,
        companyId,
        tradeName: parsed.supplier.tradeName || null,
        legalName: parsed.supplier.legalName,
        document: parsed.supplier.cnpj,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.insert(suppliers).values(newSupplier);
      supplier = {
        id: newSupplierId,
        companyId,
        tradeName: parsed.supplier.tradeName || null,
        legalName: parsed.supplier.legalName,
        document: parsed.supplier.cnpj,
        phone: null,
        whatsapp: null,
        email: null,
        address: null,
        city: null,
        state: null,
        zipCode: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await logAudit({
        companyId,
        userId: user.id,
        action: "CREATE",
        entity: "suppliers",
        entityId: newSupplierId,
        newData: { name: parsed.supplier.tradeName, cnpj: parsed.supplier.cnpj, autoImported: true },
      });
    }

    // 3. Obter próximo número sequencial de compra
    const lastPurchase = await db
      .select({ maxNumber: sql<number>`MAX(${purchases.purchaseNumber})` })
      .from(purchases)
      .where(eq(purchases.companyId, companyId));

    const nextNumber = ((lastPurchase[0]?.maxNumber) || 0) + 1;
    const purchaseId = generateUUID();

    // 4. Criação do cabeçalho da Compra (status CONFIRMED)
    const newPurchase: NewPurchase = {
      id: purchaseId,
      companyId,
      purchaseNumber: nextNumber,
      supplierId: supplier.id,
      invoiceNumber: parsed.invoiceNumber,
      status: "CONFIRMED",
      purchaseDate: parsed.issuedAt,
      subtotalCents: parsed.totalCents,
      freightCents: 0,
      discountCents: 0,
      totalCents: parsed.totalCents,
      paymentTerms: "NF-e Faturada (30 dias)",
      notes: `Importado automaticamente via XML NF-e. Chave: ${parsed.accessKey}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(purchases).values(newPurchase);

    // 5. Processamento dos Itens da NF-e
    for (const item of parsed.items) {
      // Procura produto existente por SKU (cProd) ou Nome
      let existingProduct = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.companyId, companyId),
            item.code ? eq(products.skuCode, item.code) : eq(products.name, item.name)
          )
        )
        .limit(1)
        .then((rows) => rows[0]);

      let productId: string;
      let currentStock = 0;

      if (!existingProduct) {
        // Cadastra novo produto automaticamente
        productId = generateUUID();
        const costCents = item.unitCostCents;
        // Margem padrão de 50%
        const saleCents = Math.round(costCents * 1.5);

        const newProd: NewProduct = {
          id: productId,
          companyId,
          skuCode: item.code || null,
          name: item.name,
          category: "Autopeças",
          manufacturer: parsed.supplier.tradeName,
          costPriceCents: costCents,
          salePriceCents: saleCents,
          stockQuantity: 0,
          minStock: 1,
          unit: item.unit || "UN",
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await db.insert(products).values(newProd);
        currentStock = 0;
      } else {
        productId = existingProduct.id;
        currentStock = existingProduct.stockQuantity;
        // Atualiza preço de custo atual
        await db
          .update(products)
          .set({
            costPriceCents: item.unitCostCents,
            updatedAt: new Date(),
          })
          .where(and(eq(products.id, productId), eq(products.companyId, companyId)));
      }

      // Adiciona o item da compra
      const purchaseItemId = generateUUID();
      const pItem: NewPurchaseItem = {
        id: purchaseItemId,
        companyId,
        purchaseId,
        productId,
        quantity: Math.max(1, Math.round(item.quantity)),
        unitCostCents: item.unitCostCents,
        totalCostCents: item.totalCostCents,
      };
      await db.insert(purchaseItems).values(pItem);

      // Atualiza estoque
      const addedQty = Math.max(1, Math.round(item.quantity));
      const newStock = currentStock + addedQty;
      await db
        .update(products)
        .set({
          stockQuantity: newStock,
          updatedAt: new Date(),
        })
        .where(and(eq(products.id, productId), eq(products.companyId, companyId)));

      // Registro estrito de movimentação de estoque
      await db.insert(stockMovements).values({
        id: generateUUID(),
        companyId,
        productId,
        type: "PURCHASE",
        quantity: addedQty,
        unitCostCents: item.unitCostCents,
        referenceType: "PURCHASE",
        referenceId: purchaseId,
        userId: user.id,
        notes: `Entrada automática NF-e nº ${parsed.invoiceNumber} (${supplier.tradeName})`,
        createdAt: new Date(),
      });
    }

    // 6. Geração de Conta a Pagar no Financeiro
    const transactionId = generateUUID();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // Vencimento padrão em 30 dias

    const financialTx: NewFinancialTransaction = {
      id: transactionId,
      companyId,
      type: "PAYABLE",
      status: "PENDING",
      category: "Fornecedores / Peças",
      description: `NF-e ${parsed.invoiceNumber} - ${supplier.tradeName}`,
      amountCents: parsed.totalCents,
      paidAmountCents: 0,
      dueDate,
      paidAt: null,
      referenceType: "PURCHASE",
      referenceId: purchaseId,
      customerId: null,
      supplierId: supplier.id,
      paymentMethod: "BOLETO",
      notes: `Gerado automaticamente da NF-e nº ${parsed.invoiceNumber}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.insert(financialTransactions).values(financialTx);

    // 7. Salva o XML como anexo da compra
    const xmlBuffer = Buffer.from(xmlContent, "utf-8");
    const base64Xml = xmlBuffer.toString("base64");
    const attachmentId = generateUUID();

    const newAttach: NewAttachment = {
      id: attachmentId,
      companyId,
      entityType: "PURCHASE",
      entityId: purchaseId,
      fileName: `NFe-${parsed.invoiceNumber}.xml`,
      fileType: "application/xml",
      fileSize: xmlBuffer.length,
      storageKey: `data:application/xml;base64,${base64Xml}`,
      uploadedBy: user.id,
      createdAt: new Date(),
    };
    await db.insert(attachments).values(newAttach);

    // 8. Log de Auditoria
    await logAudit({
      companyId,
      userId: user.id,
      action: "NFE_IMPORT",
      entity: "purchases",
      entityId: purchaseId,
      newData: {
        invoiceNumber: parsed.invoiceNumber,
        accessKey: parsed.accessKey,
        supplier: supplier.tradeName,
        totalCents: parsed.totalCents,
        itemsCount: parsed.items.length,
      },
    });

    revalidatePath("/dashboard/purchases");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/finance");
    revalidatePath("/dashboard");

    return {
      success: true,
      purchaseId,
      invoiceNumber: parsed.invoiceNumber,
      itemsCount: parsed.items.length,
      supplierName: supplier.tradeName,
      totalCents: parsed.totalCents,
    };
  } catch (err: any) {
    return { error: err.message || "Erro ao processar importação da NF-e." };
  }
}
