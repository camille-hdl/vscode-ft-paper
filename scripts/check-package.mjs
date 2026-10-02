// Verify the actual VSIX contents before publishing, including both theme files.
// Usage: node scripts/check-package.mjs [path-to-vsix] (also run by npm run package).
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const expected = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"))
const target = resolve(process.argv[2] ?? `${expected.name}-${expected.version}.vsix`)
const entries = execFileSync("unzip", ["-Z1", target], { encoding: "utf8" }).trim().split("\n")
const read = (path) => {
  if (!entries.includes(path)) throw new Error(`${target}: missing ${path}`)
  return execFileSync("unzip", ["-p", target, path])
}
const manifest = JSON.parse(read("extension/package.json"))
for (const key of ["name", "publisher", "version"]) {
  if (manifest[key] !== expected[key]) throw new Error(`${target}: incorrect ${key}`)
}
if (JSON.stringify(manifest.contributes?.themes) !== JSON.stringify(expected.contributes.themes)) {
  throw new Error(`${target}: incorrect theme contributions`)
}
for (const theme of expected.contributes.themes) {
  const path = theme.path.replace(/^\.\//, "")
  if (!read(`extension/${path}`).equals(readFileSync(resolve(root, path)))) {
    throw new Error(`${target}: packaged ${theme.label} differs from generated theme`)
  }
}
read("extension/readme.md")
read("extension/LICENSE.txt")
console.log(`Verified ${target}: version ${manifest.version}, both themes match the generated files, README and license included.`)
