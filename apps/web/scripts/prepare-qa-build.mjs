import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const appDir = path.resolve(currentDir, "..");

for (const target of [".next", "out"]) {
  fs.rmSync(path.join(appDir, target), {
    recursive: true,
    force: true,
  });
}
