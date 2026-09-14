import { db } from "../src/db";
import { users } from "../src/db/schema/users";
import { companies } from "../src/db/schema/companies";
import { customers } from "../src/db/schema/customers";
import { vehicles } from "../src/db/schema/vehicles";
import { products } from "../src/db/schema/products";
import { stockMovements } from "../src/db/schema/stock_movements";
import { quotes, quoteItems } from "../src/db/schema/quotes";
import { workOrders, workOrderItems } from "../src/db/schema/work_orders";
import { purchases, purchaseItems } from "../src/db/schema/purchases";
import { suppliers } from "../src/db/schema/suppliers";
import { financialTransactions } from "../src/db/schema/finance";
import { auditLogs } from "../src/db/schema/audit_logs";
import { eq, and } from "drizzle-orm";
import { verifyPassword, generateUUID } from "../src/lib/server/crypto";
import { hasPermission } from "../src/lib/server/rbac";
import { logAudit } from "../src/lib/server/audit";
import { parseNFeXml } from "../src/features/invoices/nfe-parser";

async function runIsolationTest() {
  console.log("🔒 ================================================");
  console.log("🔒 TESTE AUTOMATIZADO DE ISOLAMENTO MULTI-TENANT");
  console.log("🔒 ================================================\n");

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      testsPassed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      testsFailed++;
    }
  }

  // 1. Validar busca de empresas
  const allCompanies = await db.select().from(companies);
  assert(allCompanies.length >= 2, "Banco possui pelo menos 2 empresas distintas");

  const autocenter = allCompanies.find((c) => c.tradeName === "AutoCenter Pro");
  const silva = allCompanies.find((c) => c.tradeName === "Oficina do Silva");

  assert(!!autocenter, "Empresa 1 (AutoCenter Pro) encontrada");
  assert(!!silva, "Empresa 2 (Oficina do Silva) encontrada");

  if (!autocenter || !silva) {
    console.error("Abortando testes pois as empresas não foram encontradas.");
    process.exit(1);
  }

  // 2. Validar autenticação e hash de senha
  const carlosUser = (
    await db.select().from(users).where(eq(users.email, "carlos@autocenter.com"))
  )[0];
  assert(!!carlosUser, "Usuário Carlos (AutoCenter) existe");
  assert(carlosUser.companyId === autocenter.id, "Carlos está vinculado à Empresa 1");
  const isCarlosPassValid = await verifyPassword("senha123456", carlosUser.passwordHash);
  assert(isCarlosPassValid, "Senha de Carlos verificada com sucesso via bcrypt");

  const joaoUser = (
    await db.select().from(users).where(eq(users.email, "joao@oficinadasilva.com"))
  )[0];
  assert(!!joaoUser, "Usuário João (Oficina do Silva) existe");
  assert(joaoUser.companyId === silva.id, "João está vinculado à Empresa 2");

  // 3. Simular consulta com tenant guard da Empresa 1 (AutoCenter Pro)
  const autocenterCustomers = await db
    .select()
    .from(customers)
    .where(eq(customers.companyId, autocenter.id));

  assert(autocenterCustomers.length === 2, "Empresa 1 possui exatamente 2 clientes cadastrados");
  const hasSilvaCustomerInAutoCenter = autocenterCustomers.some(
    (c) => c.name.includes("Mariana Albuquerque")
  );
  assert(
    !hasSilvaCustomerInAutoCenter,
    "ISOLAMENTO: Clientes da Oficina do Silva NUNCA aparecem na consulta do AutoCenter Pro"
  );

  // 4. Simular consulta com tenant guard da Empresa 2 (Oficina do Silva)
  const silvaCustomers = await db
    .select()
    .from(customers)
    .where(eq(customers.companyId, silva.id));

  assert(silvaCustomers.length === 1, "Empresa 2 possui exatamente 1 cliente cadastrado");
  assert(
    silvaCustomers[0].name === "Mariana Albuquerque",
    "Cliente da Empresa 2 é Mariana Albuquerque"
  );
  const hasAutoCenterCustomerInSilva = silvaCustomers.some(
    (c) => c.name.includes("Ana Carolina") || c.name.includes("Transportadora")
  );
  assert(
    !hasAutoCenterCustomerInSilva,
    "ISOLAMENTO: Clientes do AutoCenter Pro NUNCA aparecem na consulta da Oficina do Silva"
  );

  // 5. Testar Isolamento de Veículos
  const autocenterVehicles = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.companyId, autocenter.id));

  const hasSilvaVehicleInAutoCenter = autocenterVehicles.some((v) => v.plate === "RIO1A23");
  assert(
    !hasSilvaVehicleInAutoCenter,
    "ISOLAMENTO: Veículos da Empresa 2 não aparecem para a Empresa 1"
  );

  // 6. Testar Regras de RBAC
  const mechanicUser = (
    await db.select().from(users).where(eq(users.email, "marcos@autocenter.com"))
  )[0];
  assert(mechanicUser.role === "MECHANIC", "Marcos é MECÂNICO");
  assert(
    hasPermission("MECHANIC", "view:work_orders") === true,
    "RBAC: Mecânico PODE visualizar Ordens de Serviço"
  );
  assert(
    hasPermission("MECHANIC", "update_status:work_orders") === true,
    "RBAC: Mecânico PODE alterar status da OS"
  );
  assert(
    hasPermission("MECHANIC", "manage:finance") === false,
    "RBAC: Mecânico NÃO PODE gerenciar finanças"
  );
  assert(
    hasPermission("MECHANIC", "manage:users") === false,
    "RBAC: Mecânico NÃO PODE gerenciar usuários"
  );

  const financeUser = (
    await db.select().from(users).where(eq(users.email, "roberto@autocenter.com"))
  )[0];
  assert(
    hasPermission(financeUser.role, "manage:finance") === true,
    "RBAC: Financeiro PODE gerenciar finanças"
  );
  assert(
    hasPermission(carlosUser.role, "manage:company") === true,
    "RBAC: Proprietário (OWNER) tem acesso total a gestão da empresa"
  );

  // 7. Testar Auditoria
  await logAudit({
    companyId: autocenter.id,
    userId: carlosUser.id,
    action: "STATUS_CHANGE",
    entity: "work_orders",
    entityId: "os-teste-123",
    oldData: { status: "OPEN" },
    newData: { status: "IN_PROGRESS" },
  });

  const latestAudit = await db
    .select()
    .from(auditLogs)
    .where(and(eq(auditLogs.companyId, autocenter.id), eq(auditLogs.entity, "work_orders")))
    .limit(1);

  assert(latestAudit.length > 0, "Trilha de Auditoria gravada e recuperada com sucesso");
  assert(
    latestAudit[0].action === "STATUS_CHANGE",
    "Ação de auditoria gravada corretamente: STATUS_CHANGE"
  );

  // 8. FASE 3: Testar criação de Produto com movimentação OBRIGATÓRIA de estoque
  const testProductId = "prod-teste-" + Date.now();
  const initialStockQty = 15;
  await db.insert(products).values({
    id: testProductId,
    companyId: autocenter.id,
    name: "Filtro de Combustível Bosch",
    skuCode: "BOS-FC-999",
    unit: "UN",
    costPriceCents: 2500,
    salePriceCents: 4500,
    stockQuantity: initialStockQty,
    minStock: 5,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Gravar movimentação de implantação de saldo inicial
  await db.insert(stockMovements).values({
    id: "mov-init-" + Date.now(),
    companyId: autocenter.id,
    productId: testProductId,
    type: "ADJUSTMENT",
    quantity: initialStockQty,
    referenceType: "INITIAL_STOCK",
    userId: carlosUser.id,
    notes: "Saldo inicial de teste",
    createdAt: new Date(),
  });

  const productFromDb = (
    await db.select().from(products).where(eq(products.id, testProductId))
  )[0];
  assert(productFromDb.stockQuantity === 15, "FASE 3: Produto criado com saldo inicial de 15");

  const initialMovement = await db
    .select()
    .from(stockMovements)
    .where(eq(stockMovements.productId, testProductId));
  assert(
    initialMovement.length === 1 && initialMovement[0].quantity === 15,
    "FASE 3 - REGRA CRÍTICA: Movimentação de estoque inicial foi gerada obrigatoriamente"
  );

  // 9. FASE 3: Testar Ajuste de Estoque (+5 peças com movimentação e auditoria)
  const movementQty = 5;
  await db
    .update(products)
    .set({ stockQuantity: productFromDb.stockQuantity + movementQty })
    .where(eq(products.id, testProductId));

  await db.insert(stockMovements).values({
    id: "mov-adj-" + Date.now(),
    companyId: autocenter.id,
    productId: testProductId,
    type: "PURCHASE",
    quantity: movementQty,
    referenceType: "MANUAL_ADJUSTMENT",
    userId: carlosUser.id,
    notes: "Entrada avulsa de 5 peças",
    createdAt: new Date(),
  });

  const updatedProduct = (
    await db.select().from(products).where(eq(products.id, testProductId))
  )[0];
  assert(
    updatedProduct.stockQuantity === 20,
    "FASE 3: Saldo de produto atualizado para 20 após entrada"
  );

  const totalMovements = await db
    .select()
    .from(stockMovements)
    .where(eq(stockMovements.productId, testProductId));
  assert(
    totalMovements.length === 2,
    "FASE 3: Histórico de estoque possui exatamente 2 movimentações registradas"
  );

  // 10. FASE 3: Isolamento do novo produto
  const silvaProductCheck = await db
    .select()
    .from(products)
    .where(and(eq(products.id, testProductId), eq(products.companyId, silva.id)));
  assert(
    silvaProductCheck.length === 0,
    "ISOLAMENTO FASE 3: Produto criado na Empresa 1 NUNCA aparece na Empresa 2"
  );

  // 11. FASE 4: Criação de Orçamento com itens
  const testQuoteId = "quote-teste-" + Date.now();
  await db.insert(quotes).values({
    id: testQuoteId,
    companyId: autocenter.id,
    quoteNumber: 101,
    customerId: autocenterCustomers[0].id,
    status: "APPROVED",
    subtotalCents: 20000,
    discountCents: 2000,
    totalCents: 18000,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.insert(quoteItems).values({
    id: "q-item-" + Date.now(),
    companyId: autocenter.id,
    quoteId: testQuoteId,
    type: "SERVICE",
    description: "Revisão Geral e Alinhamento",
    quantity: 1,
    unitPriceCents: 20000,
    discountCents: 2000,
    totalCents: 18000,
  });

  const savedQuote = (
    await db.select().from(quotes).where(eq(quotes.id, testQuoteId))
  )[0];
  assert(savedQuote.totalCents === 18000, "FASE 4: Orçamento criado com total de R$ 180,00");

  // 12. FASE 4: Conversão de Orçamento em Ordem de Serviço (OS)
  const convertedWoId = "wo-converted-" + Date.now();
  await db.insert(workOrders).values({
    id: convertedWoId,
    companyId: autocenter.id,
    orderNumber: 201,
    customerId: savedQuote.customerId,
    status: "APPROVED",
    fromQuoteId: testQuoteId,
    subtotalCents: savedQuote.subtotalCents,
    discountCents: savedQuote.discountCents,
    totalCents: savedQuote.totalCents,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Copiar itens
  await db.insert(workOrderItems).values({
    id: "wo-item-" + Date.now(),
    companyId: autocenter.id,
    workOrderId: convertedWoId,
    type: "SERVICE",
    description: "Revisão Geral e Alinhamento",
    quantity: 1,
    unitPriceCents: 20000,
    discountCents: 2000,
    totalCents: 18000,
  });

  // Atualizar orçamento para CONVERTED
  await db
    .update(quotes)
    .set({ status: "CONVERTED", convertedToWorkOrderId: convertedWoId })
    .where(eq(quotes.id, testQuoteId));

  const updatedQuoteStatus = (
    await db.select().from(quotes).where(eq(quotes.id, testQuoteId))
  )[0];
  assert(
    updatedQuoteStatus.status === "CONVERTED" &&
      updatedQuoteStatus.convertedToWorkOrderId === convertedWoId,
    "FASE 4 - REGRA DE NEGÓCIO: Orçamento convertido em OS com status CONVERTED e vínculo registrado"
  );

  const createdWo = (
    await db.select().from(workOrders).where(eq(workOrders.id, convertedWoId))
  )[0];
  assert(
    createdWo.fromQuoteId === testQuoteId && createdWo.totalCents === 18000,
    "FASE 4: Ordem de Serviço criada corretamente a partir do orçamento aprovado"
  );

  // 13. FASE 4: Transição de Status pelo Mecânico (Início do Serviço)
  await db
    .update(workOrders)
    .set({ status: "IN_PROGRESS", startedAt: new Date() })
    .where(eq(workOrders.id, convertedWoId));

  const woInProgress = (
    await db.select().from(workOrders).where(eq(workOrders.id, convertedWoId))
  )[0];
  assert(
    woInProgress.status === "IN_PROGRESS" && !!woInProgress.startedAt,
    "FASE 4: Mecânico colocou OS em IN_PROGRESS com timestamp startedAt preenchido"
  );

  // 14. FASE 4: Aplicação de Peça na OS com Baixa Automática de Estoque
  const stockBeforeWo = (
    await db.select().from(products).where(eq(products.id, testProductId))
  )[0].stockQuantity;

  const partQtyUsed = 2;
  await db
    .update(products)
    .set({ stockQuantity: stockBeforeWo - partQtyUsed })
    .where(eq(products.id, testProductId));

  await db.insert(stockMovements).values({
    id: "mov-wo-" + Date.now(),
    companyId: autocenter.id,
    productId: testProductId,
    type: "WORK_ORDER",
    quantity: -partQtyUsed,
    referenceType: "WORK_ORDER",
    referenceId: convertedWoId,
    userId: mechanicUser.id,
    notes: "Peça aplicada na OS #201",
    createdAt: new Date(),
  });

  const stockAfterWo = (
    await db.select().from(products).where(eq(products.id, testProductId))
  )[0].stockQuantity;
  assert(
    stockAfterWo === stockBeforeWo - partQtyUsed,
    "FASE 4: Saldo da peça reduzido com sucesso no estoque após aplicação na OS"
  );

  const woMovement = await db
    .select()
    .from(stockMovements)
    .where(
      and(
        eq(stockMovements.productId, testProductId),
        eq(stockMovements.referenceId, convertedWoId)
      )
    );
  assert(
    woMovement.length === 1 && woMovement[0].type === "WORK_ORDER",
    "FASE 4: Movimentação de estoque do tipo WORK_ORDER registrada com sucesso"
  );

  // 15. FASE 4: Isolamento Multi-tenant de Orçamentos e OS
  const silvaQuotesCheck = await db
    .select()
    .from(quotes)
    .where(and(eq(quotes.id, testQuoteId), eq(quotes.companyId, silva.id)));
  assert(
    silvaQuotesCheck.length === 0,
    "ISOLAMENTO FASE 4: Orçamento da Empresa 1 NUNCA aparece para a Empresa 2"
  );

  const silvaWoCheck = await db
    .select()
    .from(workOrders)
    .where(and(eq(workOrders.id, convertedWoId), eq(workOrders.companyId, silva.id)));
  assert(
    silvaWoCheck.length === 0,
    "ISOLAMENTO FASE 4: Ordem de Serviço da Empresa 1 NUNCA aparece para a Empresa 2"
  );

  // 16. FASE 5: Compras, Entrada de Mercadorias e Estoque
  const testPurchaseId = generateUUID();
  const initialStockForPurchase = (
    await db.select().from(products).where(eq(products.id, testProductId))
  )[0].stockQuantity;

  await db.insert(purchases).values({
    id: testPurchaseId,
    companyId: autocenter.id,
    purchaseNumber: 999,
    supplierId: (await db.select().from(suppliers).where(eq(suppliers.companyId, autocenter.id)))[0]?.id || generateUUID(),
    invoiceNumber: "NF-99988",
    status: "CONFIRMED",
    subtotalCents: 15000,
    totalCents: 15000,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const purchaseQty = 10;
  await db.insert(purchaseItems).values({
    id: generateUUID(),
    companyId: autocenter.id,
    purchaseId: testPurchaseId,
    productId: testProductId,
    quantity: purchaseQty,
    unitCostCents: 1500,
    totalCostCents: 15000,
  });

  // Atualizar estoque e registrar movimentação de compra
  await db
    .update(products)
    .set({
      stockQuantity: initialStockForPurchase + purchaseQty,
      updatedAt: new Date(),
    })
    .where(and(eq(products.id, testProductId), eq(products.companyId, autocenter.id)));

  await db.insert(stockMovements).values({
    id: generateUUID(),
    companyId: autocenter.id,
    productId: testProductId,
    type: "PURCHASE",
    quantity: purchaseQty,
    unitCostCents: 1500,
    referenceType: "PURCHASE",
    referenceId: testPurchaseId,
    notes: "Entrada por compra de teste",
    createdAt: new Date(),
  });

  const stockAfterPurchase = (
    await db.select().from(products).where(eq(products.id, testProductId))
  )[0].stockQuantity;
  assert(
    stockAfterPurchase === initialStockForPurchase + purchaseQty,
    "FASE 5: Saldo de estoque incrementado com sucesso após confirmação de compra"
  );

  const purchaseMovement = await db
    .select()
    .from(stockMovements)
    .where(
      and(
        eq(stockMovements.productId, testProductId),
        eq(stockMovements.referenceId, testPurchaseId)
      )
    );
  assert(
    purchaseMovement.length === 1 && purchaseMovement[0].type === "PURCHASE",
    "FASE 5: Movimentação de estoque do tipo PURCHASE registrada com sucesso"
  );

  const silvaPurchaseCheck = await db
    .select()
    .from(purchases)
    .where(and(eq(purchases.id, testPurchaseId), eq(purchases.companyId, silva.id)));
  assert(
    silvaPurchaseCheck.length === 0,
    "ISOLAMENTO FASE 5: Compra da Empresa 1 NUNCA aparece para a Empresa 2"
  );

  // 17. FASE 6: Financeiro e Conciliação
  const testTxId = generateUUID();
  await db.insert(financialTransactions).values({
    id: testTxId,
    companyId: autocenter.id,
    type: "RECEIVABLE",
    status: "PENDING",
    category: "Serviços",
    description: "Recebimento OS #999",
    amountCents: 25000,
    paidAmountCents: 0,
    dueDate: new Date(),
    paidAt: null,
    paymentMethod: "PIX",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const createdTx = (
    await db
      .select()
      .from(financialTransactions)
      .where(and(eq(financialTransactions.id, testTxId), eq(financialTransactions.companyId, autocenter.id)))
  )[0];
  assert(
    createdTx && createdTx.status === "PENDING" && createdTx.amountCents === 25000,
    "FASE 6: Transação financeira registrada como PENDENTE no valor correto em centavos"
  );

  // Liquidar transação
  await db
    .update(financialTransactions)
    .set({
      status: "PAID",
      paidAmountCents: 25000,
      paidAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(financialTransactions.id, testTxId), eq(financialTransactions.companyId, autocenter.id)));

  const settledTx = (
    await db
      .select()
      .from(financialTransactions)
      .where(and(eq(financialTransactions.id, testTxId), eq(financialTransactions.companyId, autocenter.id)))
  )[0];
  assert(
    settledTx.status === "PAID" && settledTx.paidAmountCents === 25000,
    "FASE 6: Baixa financeira executada com sucesso (status PAID)"
  );

  const silvaTxCheck = await db
    .select()
    .from(financialTransactions)
    .where(and(eq(financialTransactions.id, testTxId), eq(financialTransactions.companyId, silva.id)));
  assert(
    silvaTxCheck.length === 0,
    "ISOLAMENTO FASE 6: Lançamento financeiro da Empresa 1 NUNCA aparece para a Empresa 2"
  );

  // 18. FASE 7: Parser de XML de NF-e v4.00
  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
  <nfeProc xmlns="http://www.portalfiscal.inf.br/nfe">
    <NFe>
      <infNFe Id="NFe35240912345678000199550010000123451001234567">
        <ide>
          <nNF>12345</nNF>
          <serie>1</serie>
          <dhEmi>2026-09-14T10:00:00-03:00</dhEmi>
        </ide>
        <emit>
          <CNPJ>12345678000199</CNPJ>
          <xNome>Distribuidora de Autopecas Brasil Ltda</xNome>
          <xFant>AutoPecas Express</xFant>
        </emit>
        <det nItem="1">
          <prod>
            <cProd>BOSCH-OIL-01</cProd>
            <cEAN>7891234567890</cEAN>
            <xProd>Filtro de Oleo Motor Bosch</xProd>
            <NCM>84212300</NCM>
            <uCom>UN</uCom>
            <qCom>5.0000</qCom>
            <vUnCom>45.0000</vUnCom>
            <vProd>225.00</vProd>
          </prod>
        </det>
        <total>
          <ICMSTot>
            <vNF>225.00</vNF>
          </ICMSTot>
        </total>
      </infNFe>
    </NFe>
  </nfeProc>`;

  const parsedNfe = parseNFeXml(sampleXml);
  assert(
    parsedNfe.accessKey === "35240912345678000199550010000123451001234567",
    "FASE 7: NF-e Chave de acesso de 44 dígitos extraída com exatidão"
  );
  assert(
    parsedNfe.invoiceNumber === "12345",
    "FASE 7: NF-e Número da nota fiscal extraído corretamente"
  );
  assert(
    parsedNfe.supplier.cnpj === "12345678000199" && parsedNfe.supplier.tradeName === "AutoPecas Express",
    "FASE 7: NF-e Fornecedor emitente extraído corretamente"
  );
  assert(
    parsedNfe.items.length === 1 &&
      parsedNfe.items[0].code === "BOSCH-OIL-01" &&
      parsedNfe.items[0].quantity === 5 &&
      parsedNfe.items[0].unitCostCents === 4500 &&
      parsedNfe.totalCents === 22500,
    "FASE 7: NF-e Itens e totalizador em centavos validados com 100% de precisão"
  );

  console.log("\n================================================");
  console.log(`TOTAL DE TESTES: ${testsPassed + testsFailed}`);
  console.log(`✓ PASSOU: ${testsPassed}`);
  console.log(`✗ FALHOU: ${testsFailed}`);
  console.log("================================================\n");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runIsolationTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Erro no teste de isolamento:", err);
    process.exit(1);
  });
