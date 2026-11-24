import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const srcDir = path.join(rootDir, "node_modules", "onnxruntime-web", "dist");
const destDir = path.join(rootDir, "public", "ort");

if (!fs.existsSync(srcDir)) {
  console.log("[copy-ort-wasm] onnxruntime-web/dist not found; skipping.");
  process.exit(0);
}

fs.mkdirSync(destDir, { recursive: true });

const entries = fs.readdirSync(srcDir);
let copiedCount = 0;

for (const name of entries) {
  const isWasm = name.endsWith(".wasm");
  const isOrtMjs = name.startsWith("ort-wasm") && name.endsWith(".mjs");
  if (!isWasm && !isOrtMjs) continue;

  fs.copyFileSync(path.join(srcDir, name), path.join(destDir, name));
  copiedCount++;
}

console.log(`[copy-ort-wasm] Copied ${copiedCount} files to public/ort/`);
