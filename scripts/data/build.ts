import { buildDatabase, paths } from "./lib";

async function main() {
  await buildDatabase();
  console.log(`Created ${paths.database}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
