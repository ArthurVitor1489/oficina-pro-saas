/**
 * Parser de NF-e (Nota Fiscal Eletrônica Modelo 55) em formato XML SEFAZ v4.00
 * Execução pura em TypeScript/JavaScript sem dependências nativas (compatível 100% Serverless Vercel).
 */

export interface ParsedNFeItem {
  itemNumber: number;
  code: string;
  ean: string;
  name: string;
  ncm: string;
  unit: string;
  quantity: number;
  unitCostCents: number;
  totalCostCents: number;
}

export interface ParsedNFe {
  accessKey: string;
  invoiceNumber: string;
  series: string;
  issuedAt: Date;
  supplier: {
    cnpj: string;
    tradeName: string;
    legalName: string;
  };
  items: ParsedNFeItem[];
  totalCents: number;
}

function getTagValue(xml: string, tag: string): string {
  const regex = new RegExp(`<(?:[a-zA-Z0-9_-]+:)?${tag}[^>]*>([^<]+)<\\/(?:[a-zA-Z0-9_-]+:)?${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : "";
}

function getTagBlock(xml: string, tag: string): string {
  const regex = new RegExp(`<(?:[a-zA-Z0-9_-]+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_-]+:)?${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1] : "";
}

export function parseNFeXml(xmlString: string): ParsedNFe {
  if (!xmlString || typeof xmlString !== "string") {
    throw new Error("Arquivo XML vazio ou inválido.");
  }

  // 1. Chave de Acesso (infNFe Id="NFe352409...")
  const chNFeMatch = xmlString.match(/Id=["'](?:NFe)?([0-9]{44})["']/i) ||
                     xmlString.match(/<chNFe>([0-9]{44})<\/chNFe>/i);
  const accessKey = chNFeMatch ? chNFeMatch[1] : "";

  // 2. Bloco Identificação <ide>
  const ideBlock = getTagBlock(xmlString, "ide");
  const invoiceNumber = getTagValue(ideBlock, "nNF");
  const series = getTagValue(ideBlock, "serie") || "1";
  const dhEmiStr = getTagValue(ideBlock, "dhEmi") || getTagValue(ideBlock, "dEmi");
  const issuedAt = dhEmiStr ? new Date(dhEmiStr) : new Date();

  if (!invoiceNumber) {
    throw new Error("Não foi possível identificar o número da Nota Fiscal (<nNF>) no XML.");
  }

  // 3. Bloco Emitente (Fornecedor) <emit>
  const emitBlock = getTagBlock(xmlString, "emit");
  const cnpj = getTagValue(emitBlock, "CNPJ") || getTagValue(emitBlock, "CPF");
  const legalName = getTagValue(emitBlock, "xNome");
  const tradeName = getTagValue(emitBlock, "xFant") || legalName;

  if (!cnpj) {
    throw new Error("Não foi possível identificar o CNPJ/CPF do fornecedor emitente no XML.");
  }

  // 4. Bloco Itens <det nItem="...">
  const detRegex = /<(?:[a-zA-Z0-9_-]+:)?det\s+nItem=["']?(\d+)["']?[^>]*>([\s\S]*?)<\/(?:[a-zA-Z0-9_-]+:)?det>/gi;
  const items: ParsedNFeItem[] = [];
  let detMatch;

  while ((detMatch = detRegex.exec(xmlString)) !== null) {
    const itemNumber = parseInt(detMatch[1], 10) || items.length + 1;
    const detContent = detMatch[2];
    const prodBlock = getTagBlock(detContent, "prod");

    const code = getTagValue(prodBlock, "cProd");
    const ean = getTagValue(prodBlock, "cEAN");
    const name = getTagValue(prodBlock, "xProd");
    const ncm = getTagValue(prodBlock, "NCM");
    const unit = getTagValue(prodBlock, "uCom") || "UN";
    const qComStr = getTagValue(prodBlock, "qCom");
    const vUnComStr = getTagValue(prodBlock, "vUnCom");
    const vProdStr = getTagValue(prodBlock, "vProd");

    const quantity = parseFloat(qComStr) || 1;
    const unitCost = parseFloat(vUnComStr) || 0;
    const totalCost = parseFloat(vProdStr) || unitCost * quantity;

    items.push({
      itemNumber,
      code,
      ean: ean === "SEM GTIN" ? "" : ean,
      name,
      ncm,
      unit,
      quantity,
      unitCostCents: Math.round(unitCost * 100),
      totalCostCents: Math.round(totalCost * 100),
    });
  }

  if (items.length === 0) {
    throw new Error("Nenhum item ou produto foi encontrado na Nota Fiscal.");
  }

  // 5. Totalizador <total><ICMSTot><vNF>
  const totalBlock = getTagBlock(xmlString, "total");
  const vNFStr = getTagValue(totalBlock, "vNF");
  let totalCents = vNFStr ? Math.round(parseFloat(vNFStr) * 100) : 0;

  if (totalCents === 0) {
    totalCents = items.reduce((acc, it) => acc + it.totalCostCents, 0);
  }

  return {
    accessKey,
    invoiceNumber,
    series,
    issuedAt: isNaN(issuedAt.getTime()) ? new Date() : issuedAt,
    supplier: {
      cnpj,
      tradeName,
      legalName,
    },
    items,
    totalCents,
  };
}
