import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main(): Promise<void> {
  const result = await pool.query<{ now: Date }>("SELECT NOW() AS now");
  console.log("Conexión OK:", result.rows[0]?.now);
  await pool.end();
}

main().catch((error: unknown) => {
  console.error("Error de conexión:", error);
  process.exit(1);
});