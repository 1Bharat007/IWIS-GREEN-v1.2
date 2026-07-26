import "dotenv/config";
import { vectorDB } from "../src/utils/vector-db.util";

async function main() {
  await vectorDB.initialize();
}

main().catch(console.error);
