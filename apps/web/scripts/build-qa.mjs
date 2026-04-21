import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const appDir = path.resolve(currentDir, "..");
const require = createRequire(import.meta.url);
const nextCli = require.resolve("next/dist/bin/next");

const child = spawn(process.execPath, [nextCli, "build"], {
  cwd: appDir,
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:8100",
  },
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
