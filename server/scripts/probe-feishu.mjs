import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const { fetchMemoryPricesFromFeishu, getFeishuConfig } = await import(
  "../services/feishuMemory.ts"
);

const config = getFeishuConfig();
if (!config) {
  console.error("缺少 FEISHU_* 环境变量，请配置 server/.env");
  process.exit(1);
}

console.log("app_token:", config.appToken);
console.log("table_id:", config.tableId);

try {
  const rows = await fetchMemoryPricesFromFeishu();
  console.log("rows:", rows.length);
  console.log(JSON.stringify(rows, null, 2));
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
