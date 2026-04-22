import { composeCompetitionVideo } from "./compose.mjs";
import { isMain, parseArgs } from "./lib.mjs";
import { recordCompetitionVideo } from "./record.mjs";

export async function runCompetitionVideoPipeline(options = {}) {
  const args = options.args ?? parseArgs(process.argv.slice(2));
  const metadata = await recordCompetitionVideo({ args });
  return composeCompetitionVideo({
    args: {
      ...args,
      bundle: metadata.bundleDir,
    },
  });
}

async function main() {
  const { finalPath } = await runCompetitionVideoPipeline();
  console.log(`Competition video pipeline completed: ${finalPath}`);
}

if (isMain(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
