import { db } from "./index";
import { companies } from "./schema/companies";
import { users } from "./schema/users";
import { customers } from "./schema/customers";
import { vehicles } from "./schema/vehicles";
import { services } from "./schema/services";
import { products } from "./schema/products";
import { suppliers } from "./schema/suppliers";
import { stockMovements } from "./schema/stock_movements";
import { hashPassword, generateUUID } from "../lib/server/crypto";

async function seed() {
  console.log("🌱 Iniciando seed do banco de dados...");

  const defaultPasswordHash = await hashPassword("senha123456");

  // ==========================================
  // EMPRESA 1: AutoCenter Pro
  // ==========================================
  const company1Id = generateUUID();
  console.log(`Criando Empresa 1: AutoCenter Pro (${company1Id})`);

  await db.insert(companies).values({
    id: company1Id,
    name: "AutoCenter Pro Reparação Automotiva Ltda",
    tradeName: "AutoCenter Pro",
    document: "11.222.333/0001-44",
    email: "contato@autocenterpro.com.br",
    phone: "(11) 98765-4321",
    address: "Av. Automóvel Club, 1500",
    city: "São Paulo",
    state: "SP",
    zipCode: "01310-100",
    plan: "PRO",
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const owner1Id = generateUUID();
  const mechanic1Id = generateUUID();
  const attendant1Id = generateUUID();
  const finance1Id = generateUUID();

  await db.insert(users).values([
    {
      id: owner1Id,
      companyId: company1Id,
      name: "Carlos Mendes (Proprietário)",
      email: "carlos@autocenter.com",
      passwordHash: defaultPasswordHash,
      role: "OWNER",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: mechanic1Id,
      companyId: company1Id,
      name: "Marcos Oliveira (Mecânico Chefe)",
      email: "marcos@autocenter.com",
      passwordHash: defaultPasswordHash,
      role: "MECHANIC",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: attendant1Id,
      companyId: company1Id,
      name: "Juliana Lima (Recepção/Atendimento)",
      email: "juliana@autocenter.com",
      passwordHash: defaultPasswordHash,
      role: "ATTENDANT",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: finance1Id,
      companyId: company1Id,
      name: "Roberto Rocha (Financeiro)",
      email: "roberto@autocenter.com",
      passwordHash: defaultPasswordHash,
      role: "FINANCE",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  // Clientes da Empresa 1
  const cust1Id = generateUUID();
  const cust2Id = generateUUID();

  await db.insert(customers).values([
    {
      id: cust1Id,
      companyId: company1Id,
      name: "Ana Carolina Ferraz",
      document: "123.456.789-00",
      phone: "(11) 99123-4567",
      whatsapp: "(11) 99123-4567",
      email: "ana.ferraz@email.com",
      city: "São Paulo",
      state: "SP",
      notes: "Cliente fiel há 3 anos. Prefere óleo sintético.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: cust2Id,
      companyId: company1Id,
      name: "Transportadora Rápido Express Ltda",
      document: "33.444.555/0001-66",
      phone: "(11) 3456-7890",
      whatsapp: "(11) 98888-7777",
      email: "frotas@rapidoexpress.com.br",
      city: "São Paulo",
      state: "SP",
      notes: "Frota de 12 furgões Sprinter. Faturamento quinzenal.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  // Veículos da Empresa 1
  await db.insert(vehicles).values([
    {
      id: generateUUID(),
      companyId: company1Id,
      customerId: cust1Id,
      plate: "BRA2E19",
      brand: "Honda",
      model: "Civic",
      year: 2021,
      version: "2.0 Touring Turbo",
      fuelType: "GASOLINA",
      mileage: 48500,
      notes: "Revisão dos 50k km se aproximando.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: generateUUID(),
      companyId: company1Id,
      customerId: cust2Id,
      plate: "SPX9870",
      brand: "Mercedes-Benz",
      model: "Sprinter 415 CDI",
      year: 2020,
      version: "Furgão Teto Alto",
      fuelType: "DIESEL",
      mileage: 165000,
      notes: "Veículo de carga pesada.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  // Serviços da Empresa 1
  await db.insert(services).values([
    {
      id: generateUUID(),
      companyId: company1Id,
      name: "Troca de Óleo e Filtros",
      description: "Substituição do óleo do motor, filtro de óleo, ar e combustível com checagem de 30 itens.",
      category: "Revisão",
      basePriceCents: 12000, // R$ 120,00 de mão de obra
      estimatedMinutes: 45,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: generateUUID(),
      companyId: company1Id,
      name: "Alinhamento 3D e Balanceamento das 4 Rodas",
      description: "Alinhamento a laser digital computadorizado e balanceamento dinâmico de rodas de liga/aço.",
      category: "Geometria",
      basePriceCents: 16000, // R$ 160,00
      estimatedMinutes: 60,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: generateUUID(),
      companyId: company1Id,
      name: "Revisão do Sistema de Freios (Dianteiro e Traseiro)",
      description: "Inspeção de discos, substituição de pastilhas/sapatas, sangria e fluido DOT4.",
      category: "Freios",
      basePriceCents: 22000, // R$ 220,00
      estimatedMinutes: 90,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  // Fornecedor da Empresa 1
  const supp1Id = generateUUID();
  await db.insert(suppliers).values({
    id: supp1Id,
    companyId: company1Id,
    legalName: "Distribuidora Nacional de Autopeças S/A",
    tradeName: "Nacional Peças",
    document: "77.888.999/0001-11",
    phone: "(11) 2222-3333",
    whatsapp: "(11) 97777-6666",
    email: "pedidos@nacionalpecas.com.br",
    city: "Guarulhos",
    state: "SP",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Produtos/Peças da Empresa 1
  const prod1Id = generateUUID();
  const prod2Id = generateUUID();

  await db.insert(products).values([
    {
      id: prod1Id,
      companyId: company1Id,
      name: "Óleo 5W30 Sintético 1L Motul",
      skuCode: "MOT-5W30-1L",
      manufacturer: "Motul",
      category: "Lubrificantes",
      unit: "L",
      costPriceCents: 3800, // Custo: R$ 38,00
      salePriceCents: 6500, // Venda: R$ 65,00
      stockQuantity: 48,
      minStock: 12,
      location: "Prateleira A1",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: prod2Id,
      companyId: company1Id,
      name: "Pastilha de Freio Dianteira Cerâmica Bosch",
      skuCode: "BOS-0986-P01",
      manufacturer: "Bosch",
      category: "Freios",
      unit: "PAR",
      costPriceCents: 14000, // Custo: R$ 140,00
      salePriceCents: 24000, // Venda: R$ 240,00
      stockQuantity: 8,
      minStock: 4,
      location: "Prateleira C4",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  // Movimentação de estoque inicial
  await db.insert(stockMovements).values([
    {
      id: generateUUID(),
      companyId: company1Id,
      productId: prod1Id,
      type: "PURCHASE",
      quantity: 48,
      unitCostCents: 3800,
      referenceType: "INITIAL_STOCK",
      userId: owner1Id,
      notes: "Saldo de implantação do sistema",
      createdAt: new Date(),
    },
    {
      id: generateUUID(),
      companyId: company1Id,
      productId: prod2Id,
      type: "PURCHASE",
      quantity: 8,
      unitCostCents: 14000,
      referenceType: "INITIAL_STOCK",
      userId: owner1Id,
      notes: "Saldo de implantação do sistema",
      createdAt: new Date(),
    },
  ]);

  // ==========================================
  // EMPRESA 2: Oficina Mecânica do Silva (Tenant Isolado)
  // ==========================================
  const company2Id = generateUUID();
  console.log(`Criando Empresa 2: Oficina do Silva (${company2Id})`);

  await db.insert(companies).values({
    id: company2Id,
    name: "Silva & Filhos Auto Mecânica ME",
    tradeName: "Oficina do Silva",
    document: "44.555.666/0001-77",
    email: "silva@oficinadasilva.com.br",
    phone: "(21) 99876-1234",
    address: "Rua dos Mecânicos, 45",
    city: "Rio de Janeiro",
    state: "RJ",
    zipCode: "20000-000",
    plan: "STARTER",
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const owner2Id = generateUUID();
  await db.insert(users).values({
    id: owner2Id,
    companyId: company2Id,
    name: "João Silva (Proprietário)",
    email: "joao@oficinadasilva.com",
    passwordHash: defaultPasswordHash,
    role: "OWNER",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Cliente da Empresa 2
  const custSilvaId = generateUUID();
  await db.insert(customers).values({
    id: custSilvaId,
    companyId: company2Id,
    name: "Mariana Albuquerque",
    document: "998.877.665-44",
    phone: "(21) 98765-4321",
    whatsapp: "(21) 98765-4321",
    email: "mariana.albuquerque@email.com",
    city: "Rio de Janeiro",
    state: "RJ",
    notes: "Cliente da Oficina do Silva",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Veículo da Empresa 2
  await db.insert(vehicles).values({
    id: generateUUID(),
    companyId: company2Id,
    customerId: custSilvaId,
    plate: "RIO1A23",
    brand: "Fiat",
    model: "Argo",
    year: 2022,
    version: "1.3 Trekking",
    fuelType: "FLEX",
    mileage: 32000,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("✓ Seed concluído com sucesso!");
  console.log("\n--- CREDENCIAIS DE ACESSO DEMO ---");
  console.log("EMPRESA 1: AutoCenter Pro");
  console.log("  Owner:      carlos@autocenter.com      | senha123456");
  console.log("  Mecânico:   marcos@autocenter.com      | senha123456");
  console.log("  Atendente:  juliana@autocenter.com     | senha123456");
  console.log("  Financeiro: roberto@autocenter.com     | senha123456");
  console.log("\nEMPRESA 2: Oficina do Silva (Tenant Isolado)");
  console.log("  Owner:      joao@oficinadasilva.com    | senha123456");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Erro ao executar seed:", err);
    process.exit(1);
  });
