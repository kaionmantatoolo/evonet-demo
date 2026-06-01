const fs = require("fs");
const path = require("path");

const target = path.join(
  process.cwd(),
  "node_modules",
  "next",
  "dist",
  "build",
  "swc",
  "index.js"
);

if (!fs.existsSync(target)) {
  console.log("[patch-next-swc-wasm] Skip: next swc index not found");
  process.exit(0);
}

const original = fs.readFileSync(target, "utf8");
const before =
  "const importedRawBindings = await import((0, _url.pathToFileURL)(pkgPath).toString());";
const after =
  "const importedRawBindings = await import(importPath ? (0, _url.pathToFileURL)(pkgPath).toString() : pkgPath);";

if (!original.includes(before)) {
  if (original.includes(after)) {
    console.log("[patch-next-swc-wasm] Already patched");
    process.exit(0);
  }
  console.log("[patch-next-swc-wasm] Skip: pattern not found");
  process.exit(0);
}

const patched = original.replace(before, after);
fs.writeFileSync(target, patched, "utf8");
console.log("[patch-next-swc-wasm] Patched next swc wasm import");
