import * as fs from "fs";
import * as path from "path";
import { client } from "./index";

async function runMigrations() {
  console.log("Iniciando migrações no banco libSQL/Turso...");
  const migrationsDir = path.join(__dirname, "migrations");
  
  if (!fs.existsSync(migrationsDir)) {
    console.error("Diretório de migrações não encontrado:", migrationsDir);
    process.exit(1);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    console.log(`Aplicando migração: ${file}`);
    const sqlContent = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    const statements = sqlContent
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      try {
        await client.execute(stmt);
      } catch (err: any) {
        // Se a tabela ou índice já existir, prosseguir ou logar
        if (!err.message?.includes("already exists")) {
          console.error("Erro ao executar statement:", stmt);
          throw err;
        }
      }
    }
  }

  console.log("✓ Todas as migrações foram aplicadas com sucesso!");
}

runMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Falha na migração:", err);
    process.exit(1);
  });
