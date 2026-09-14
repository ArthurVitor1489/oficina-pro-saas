import { db } from "../src/db";
import { users } from "../src/db/schema/users";
import { companies } from "../src/db/schema/companies";
import { customers } from "../src/db/schema/customers";
import { vehicles } from "../src/db/schema/vehicles";
import { auditLogs } from "../src/db/schema/audit_logs";
import { eq, and } from "drizzle-orm";
import { verifyPassword } from "../src/lib/server/crypto";
import { hasPermission } from "../src/lib/server/rbac";
import { logAudit } from "../src/lib/server/audit";

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
