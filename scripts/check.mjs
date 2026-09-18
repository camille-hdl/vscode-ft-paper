// Checks the generated theme. Reads the JSON as VS Code will load it, not the specification.
// Usage: node scripts/check.mjs   (or npm run check). Exit code 1 if a check fails.
//
// 1. Off-palette colors: every #rrggbb must be a palette swatch or a derived fill;
//    every #rrggbbaa must have its base in the palette and a written reason. Keys
//    VS Code wants translucent must be translucent.
// 2. Contrast: body text, comments, line numbers and every syntax color ≥ 4.5:1 on
//    every background the editor shows them on permanently. Transient backgrounds
//    (selection, search, diff) are measured and listed, without failing.
// 3. Unknown keys: compared with the official reference when it is reachable.

import { readFileSync } from "node:fs"
import { palette, derivedRoles, roleOf, alphaOf, composite, contrast } from "./palette.mjs"
import { buildTheme } from "./theme.mjs"
import { THEME_PATH, render } from "./build.mjs"

const MIN = 4.5
let failures = 0
const fail = (msg) => {
  failures++
  console.log(`  FAIL  ${msg}`)
}
const fmt = (n) => n.toFixed(2)

const raw = readFileSync(THEME_PATH, "utf8")
const theme = JSON.parse(raw)
const { alphaReasons } = buildTheme()

console.log("# 0. The JSON is up to date")
if (raw !== render()) fail("themes/ft-paper-color-theme.json differs from a fresh build: run npm run build")
else console.log("  ok")

// ---------------------------------------------------------------- 1. palette

console.log("\n# 1. Off-palette colors")
const uses = []
const walk = (value, path) => {
  if (typeof value === "string" && value.startsWith("#")) uses.push([path, value.toLowerCase()])
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) walk(v, path ? `${path}.${k}` : k)
}
walk(theme.colors, "colors")
walk(theme.tokenColors, "tokenColors")
walk(theme.semanticTokenColors, "semanticTokenColors")

const translucentRequired = [
  "sideBar.dropBackground", "editor.inactiveSelectionBackground", "editor.selectionHighlightBackground",
  "editor.wordHighlightBackground", "editor.wordHighlightStrongBackground", "editor.wordHighlightTextBackground",
  "editor.findMatchHighlightBackground", "editor.findRangeHighlightBackground", "editor.hoverHighlightBackground",
  "editor.rangeHighlightBackground", "editor.symbolHighlightBackground", "editor.foldBackground",
  "editorOverviewRuler.findMatchForeground", "editorOverviewRuler.rangeHighlightForeground",
  "editorOverviewRuler.selectionHighlightForeground", "editorOverviewRuler.wordHighlightForeground",
  "editorOverviewRuler.wordHighlightStrongForeground", "editorOverviewRuler.wordHighlightTextForeground",
  "editorError.background", "editorWarning.background", "editorInfo.background",
  "diffEditor.insertedTextBackground", "diffEditor.removedTextBackground", "diffEditor.insertedLineBackground",
  "diffEditor.removedLineBackground", "merge.currentHeaderBackground", "merge.currentContentBackground",
  "merge.incomingHeaderBackground", "merge.incomingContentBackground", "merge.commonContentBackground",
  "merge.commonHeaderBackground", "panelSection.dropBackground", "terminal.findMatchBackground",
  "terminal.findMatchHighlightBackground", "terminal.dropBackground",
]

const inPalette = new Set(Object.values(palette))
const translucent = []
let opaque = 0
for (const [path, hex] of uses) {
  if (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/.test(hex)) {
    fail(`${path}: unexpected format ${hex}`)
    continue
  }
  const base = hex.slice(0, 7)
  if (!inPalette.has(base)) {
    fail(`${path}: ${hex} is neither in the palette nor a derived fill`)
    continue
  }
  if (hex.length === 7) {
    opaque++
    continue
  }
  const key = path.replace(/^colors\./, "")
  const why = alphaReasons[key]
  if (!why) fail(`${path}: ${hex} is translucent without a written reason`)
  if (derivedRoles.has(roleOf(base))) fail(`${path}: transparency on a derived fill (${roleOf(base)})`)
  translucent.push([key, hex, why])
}
for (const key of translucentRequired) {
  const hex = theme.colors[key]
  if (hex && alphaOf(hex) === 1) fail(`${key}: VS Code requires a translucent color, ${hex} is opaque`)
}
const distinct = new Set(uses.map(([, h]) => h))
console.log(`  ${uses.length} uses, ${distinct.size} distinct values; ${opaque} opaque uses, all in the palette.`)
console.log(`  ${translucent.length} translucent uses, each on a palette hue:`)
for (const [key, hex, why] of translucent) console.log(`    ${key.padEnd(48)} ${hex}  ${why}`)
const derivedUsed = [...distinct].filter((h) => h.length === 7 && derivedRoles.has(roleOf(h)))
console.log(`  Derived fills used opaque: ${derivedUsed.map(roleOf).join(", ") || "none (all translucent)"}`)

// ---------------------------------------------------------------- 2. contrast

console.log(`\n# 2. Contrast (threshold ${fmt(MIN)}:1)`)
const col = theme.colors
const permanentBackgrounds = {
  editor: col["editor.background"],
  hover: col["editorHoverWidget.background"],
  peek: col["peekViewEditor.background"],
}

const syntax = new Map()
for (const { name, settings } of theme.tokenColors) {
  if (settings.foreground) syntax.set(`${settings.foreground}`, [...(syntax.get(settings.foreground) ?? []), name])
}
for (const [token, v] of Object.entries(theme.semanticTokenColors)) {
  const fg = typeof v === "string" ? v : v.foreground
  if (fg) syntax.set(fg, [...(syntax.get(fg) ?? []), `sem. ${token}`])
}

const gated = [
  ["Body text (editor.foreground)", col["editor.foreground"]],
  ["Line number", col["editorLineNumber.foreground"]],
  ["Active line number", col["editorLineNumber.activeForeground"]],
  ["Bracket pair colors", col["editorBracketHighlight.foreground1"]],
  ...[...syntax].map(([fg, names]) => [`Syntax ${roleOf(fg)} — ${[...new Set(names)].slice(0, 4).join(", ")}${names.length > 4 ? "…" : ""}`, fg]),
]
const bgNames = Object.keys(permanentBackgrounds)
console.log(`  ${"".padEnd(70)} ${bgNames.map((b) => b.padStart(10)).join("")}`)
for (const [label, fg] of gated) {
  const cells = bgNames.map((b) => {
    const bg = permanentBackgrounds[b]
    const r = contrast(fg, bg)
    if (r < MIN) fail(`${label} on ${b}: ${fmt(r)}`)
    return fmt(r).padStart(10)
  })
  console.log(`  ${label.slice(0, 70).padEnd(70)} ${cells.join("")}`)
}
const tc = contrast(col["terminal.foreground"], col["terminal.background"])
if (tc < MIN) fail(`Terminal text: ${fmt(tc)}`)
console.log(`  ${"Terminal text".padEnd(70)} ${fmt(tc).padStart(10)}`)

// Interface: text on panel backgrounds. Failing, except disabled text and hints.
console.log("\n  Interface (failing, except disabled/hint roles marked \"info\"):")
const uiPairs = [
  ["sideBar.foreground", "sideBar.background"],
  ["list.activeSelectionForeground", "list.activeSelectionBackground"],
  ["tab.activeForeground", "tab.activeBackground"],
  ["tab.inactiveForeground", "tab.inactiveBackground"],
  ["statusBar.foreground", "statusBar.background"],
  ["titleBar.activeForeground", "titleBar.activeBackground"],
  ["titleBar.inactiveForeground", "titleBar.inactiveBackground"],
  ["activityBar.inactiveForeground", "activityBar.background"],
  ["breadcrumb.foreground", "breadcrumb.background"],
  ["input.placeholderForeground", "input.background"],
  ["editorInlayHint.foreground", "editorInlayHint.background"],
  ["editorCodeLens.foreground", "editor.background"],
  ["button.foreground", "button.background"],
  ["button.foreground", "button.hoverBackground"],
  ["badge.foreground", "badge.background"],
  ["statusBar.debuggingForeground", "statusBar.debuggingBackground"],
  ["statusBarItem.errorForeground", "statusBarItem.errorBackground"],
  ["list.highlightForeground", "list.activeSelectionBackground"],
  ["editorSuggestWidget.highlightForeground", "editorSuggestWidget.selectedBackground"],
  ["textLink.foreground", "editor.background"],
  ...Object.keys(col)
    .filter((k) => k.startsWith("gitDecoration."))
    .flatMap((k) => [[k, "sideBar.background"], [k, "list.activeSelectionBackground"]]),
  ["editorGhostText.foreground", "editor.background", "info"],
]
for (const [fgKey, bgKey, level] of uiPairs) {
  const fg = col[fgKey]
  const info = level === "info" || fgKey === "gitDecoration.ignoredResourceForeground"
  const r = contrast(fg, col[bgKey])
  const tag = r >= MIN ? "ok  " : info ? "info" : "FAIL"
  if (r < MIN && !info) fail(`${fgKey} on ${bgKey}: ${fmt(r)}`)
  console.log(`    ${tag}  ${fmt(r).padStart(6)}  ${fgKey} (${roleOf(fg)}) on ${bgKey} (${roleOf(col[bgKey])})`)
}

// Transient backgrounds: not failing, measured to know what is accepted.
console.log("\n  Transient backgrounds (not failing) — lowest contrast among syntax colors:")
const transient = [
  ["selection", col["editor.selectionBackground"]],
  ["inserted line (diff)", composite(col["diffEditor.insertedLineBackground"], col["editor.background"])],
  ["removed line (diff)", composite(col["diffEditor.removedLineBackground"], col["editor.background"])],
  ["inserted text (diff)", composite(col["diffEditor.insertedTextBackground"], composite(col["diffEditor.insertedLineBackground"], col["editor.background"]))],
  ["removed text (diff)", composite(col["diffEditor.removedTextBackground"], composite(col["diffEditor.removedLineBackground"], col["editor.background"]))],
  ["search match", composite(col["editor.findMatchHighlightBackground"], col["editor.background"])],
  ["current search match", composite(col["editor.findMatchBackground"], col["editor.background"])],
]
for (const [label, bg] of transient) {
  const ink = contrast(col["editor.foreground"], bg)
  const worst = [...syntax.keys()].map((fg) => [fg, contrast(fg, bg)]).sort((x, y) => x[1] - y[1])
  const under = worst.filter(([, r]) => r < MIN).map(([fg, r]) => `${roleOf(fg)} ${fmt(r)}`)
  console.log(`    ${label.padEnd(28)} ${bg}  body text ${fmt(ink)}; under threshold: ${under.join(", ") || "none"}`)
  if (ink < MIN) fail(`body text on ${label}: ${fmt(ink)}`)
}

// ---------------------------------------------------------------- 3. keys

console.log("\n# 3. Color keys known to VS Code")
try {
  const res = await fetch("https://raw.githubusercontent.com/microsoft/vscode-docs/main/api/references/theme-color.md", { signal: AbortSignal.timeout(10000) })
  const doc = await res.text()
  const known = new Set([...doc.matchAll(/^- `([A-Za-z0-9.]+)`/gm)].map((m) => m[1]))
  const unknown = Object.keys(col).filter((k) => !known.has(k))
  if (unknown.length) for (const k of unknown) fail(`key missing from the reference: ${k}`)
  else console.log(`  ok — ${Object.keys(col).length} keys, all in the reference (${known.size} documented keys)`)
} catch (e) {
  console.log(`  not checked: reference unreachable (${e.message})`)
}

console.log(failures ? `\n${failures} failure(s).` : "\nAll checks pass.")
process.exit(failures ? 1 : 0)
