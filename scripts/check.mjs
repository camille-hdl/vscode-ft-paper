// Checks the generated theme. Reads the JSON as VS Code will load it, not the specification.
// Usage: node scripts/check.mjs   (or npm run check). Exit code 1 if a check fails.
//
// 1. Off-palette colors: every #rrggbb must be a palette swatch or a derived fill;
//    every #rrggbbaa must have its base in the palette and a written reason. Keys
//    VS Code wants translucent must be translucent.
// 2. Contrast: body text, comments, line numbers and every syntax color ≥ 4.5:1 on
//    the editor, hover and peek backgrounds. Night selection, diff, search and merge
//    backgrounds also fail below 4.5; day exceptions are measured without changing it.
// 3. Unknown keys: compared with the official reference when it is reachable.

import { readFileSync } from "node:fs"
import { themes, loadPalette, ansiNames, alphaOf, composite, contrast } from "./palette.mjs"
import { buildTheme } from "./theme.mjs"
import { render } from "./build.mjs"

const MIN = 4.5
let failures = 0
const fail = (msg) => {
  failures++
  console.log(`  FAIL  ${msg}`)
}
const fmt = (n) => n.toFixed(2)
const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))

// Fetch the reference once for both themes. Offline builds still check local data.
let knownKeys
try {
  const response = await fetch("https://raw.githubusercontent.com/microsoft/vscode-docs/main/api/references/theme-color.md", { signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const doc = await response.text()
  knownKeys = new Set([...doc.matchAll(/^- `([A-Za-z0-9.]+)`/gm)].map((m) => m[1]))
  if (!knownKeys.size) throw new Error("empty color reference")
} catch (e) {
  console.log(`Color reference not checked: ${e.message}`)
}

for (const definition of themes) {
  const source = loadPalette(definition)
  const { palette, derivedRoles, roleOf, terminal, type } = source
  console.log(`\n=== ${source.name} ===`)
  const raw = readFileSync(source.themePath, "utf8")
  const theme = JSON.parse(raw)
  const { alphaReasons } = buildTheme(source)

  console.log("# 0. Theme contribution and generated JSON")
  const contribution = manifest.contributes.themes.find((entry) => entry.label === source.name)
  if (!contribution || contribution.uiTheme !== source.uiTheme || contribution.path !== `./themes/${source.name}-color-theme.json`) fail(`${source.name}: incorrect theme contribution`)
  if (theme.name !== source.name || theme.type !== type) fail(`${source.name}: incorrect theme name or type`)
  if (raw !== render(source)) fail(`${source.themePath} differs from a fresh build: run npm run build`)
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
    if (derivedRoles.has(roleOf(base)) && !(type === "dark" && (hex.endsWith("fe") || (roleOf(base) === "fill-match" && hex.endsWith("80"))) && why?.startsWith("fill-"))) fail(`${path}: transparency on a derived fill (${roleOf(base)})`)
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
    ...(type === "dark" && { suggestions: col["editorSuggestWidget.selectedBackground"] }),
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

  // Interface: every content text pair fails below the threshold.
  console.log("\n  Interface (all content text pairs are checked):")
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
    ["editorGhostText.foreground", "editor.background"],
    ["editorSuggestWidget.foreground", "editorSuggestWidget.background"],
    ["editorSuggestWidget.selectedForeground", "editorSuggestWidget.selectedBackground"],
    ["editorHoverWidget.foreground", "editorHoverWidget.background"],
    ["input.foreground", "input.background"],
    ["dropdown.foreground", "dropdown.background"],
    ["menu.foreground", "menu.background"],
    ["menu.selectionForeground", "menu.selectionBackground"],
    ["notifications.foreground", "notifications.background"],
    ["quickInput.foreground", "quickInput.background"],
    ["quickInputList.focusForeground", "quickInputList.focusBackground"],
    ["button.secondaryForeground", "button.secondaryBackground"],
    ["button.secondaryForeground", "button.secondaryHoverBackground"],
    ["activityBarBadge.foreground", "activityBarBadge.background"],
    ["statusBarItem.warningForeground", "statusBarItem.warningBackground"],
    ["statusBarItem.remoteForeground", "statusBarItem.remoteBackground"],
  ]
  for (const [fgKey, bgKey] of uiPairs) {
    const fg = col[fgKey]
    const r = contrast(fg, col[bgKey])
    const tag = r >= MIN ? "ok  " : "FAIL"
    if (r < MIN) fail(`${fgKey} on ${bgKey}: ${fmt(r)}`)
    console.log(`    ${tag}  ${fmt(r).padStart(6)}  ${fgKey} (${roleOf(fg)}) on ${bgKey} (${roleOf(col[bgKey])})`)
  }

  // Keep day unchanged; enforce the threshold for night overlays too.
  console.log(`\n  Transient backgrounds (${type === "dark" ? "syntax contrast enforced" : "day syntax exceptions reported"}):`)
  const transient = [
    ["selection", col["editor.selectionBackground"]],
    ["inserted line (diff)", composite(col["diffEditor.insertedLineBackground"], col["editor.background"])],
    ["removed line (diff)", composite(col["diffEditor.removedLineBackground"], col["editor.background"])],
    ["inserted text (diff)", composite(col["diffEditor.insertedTextBackground"], composite(col["diffEditor.insertedLineBackground"], col["editor.background"]))],
    ["removed text (diff)", composite(col["diffEditor.removedTextBackground"], composite(col["diffEditor.removedLineBackground"], col["editor.background"]))],
    ["search match", composite(col["editor.findMatchHighlightBackground"], col["editor.background"])],
    ["current search match", composite(col["editor.findMatchBackground"], col["editor.background"])],
    ["search editor match", composite(col["searchEditor.findMatchBackground"], col["editor.background"])],
    ["peek editor match", composite(col["peekViewEditor.matchHighlightBackground"], col["peekViewEditor.background"])],
    ["peek result match", composite(col["peekViewResult.matchHighlightBackground"], col["peekViewResult.background"])],
    ["list filter match", composite(col["list.filterMatchBackground"], col["list.activeSelectionBackground"])],
    ["merge current header", composite(col["merge.currentHeaderBackground"], composite(col["merge.currentContentBackground"], col["editor.background"]))],
    ["merge incoming header", composite(col["merge.incomingHeaderBackground"], composite(col["merge.incomingContentBackground"], col["editor.background"]))],
    ["merge changed word", composite(col["mergeEditor.change.word.background"], composite(col["mergeEditor.change.background"], col["editor.background"]))],
  ]
  for (const [label, bg] of transient) {
    const ink = contrast(col["editor.foreground"], bg)
    const worst = [...syntax.keys()].map((fg) => [fg, contrast(fg, bg)]).sort((x, y) => x[1] - y[1])
    const under = worst.filter(([, r]) => r < MIN).map(([fg, r]) => `${roleOf(fg)} ${fmt(r)}`)
    console.log(`    ${label.padEnd(28)} ${bg}  body text ${fmt(ink)}; worst ${fmt(worst[0][1])} (${roleOf(worst[0][0])}); under threshold: ${under.join(", ") || "none"}`)
    if (type === "dark" && under.length) fail(`syntax on ${label}: ${under.join(", ")}`)
    if (ink < MIN) fail(`body text on ${label}: ${fmt(ink)}`)
  }

  // ---------------------------------------------------------------- 3. keys

  console.log("\n# 3. Color keys known to VS Code")
  if (knownKeys) {
    const unknown = Object.keys(col).filter((k) => !knownKeys.has(k))
    if (unknown.length) for (const k of unknown) fail(`key missing from the reference: ${k}`)
    else console.log(`  ok: ${Object.keys(col).length} keys, all in the reference`)
  }

  // Syntax roles must match the site's published code roles.
  console.log("\n# 4. Syntax roles")
  for (const [tokenName, semantic, role] of [
    ["Comment", "comment", "ink-muted"], ["String", "string", "jade"],
    ["Keyword", "keyword", "oxford"], ["Function", "function", "velvet"],
    ["Type, class, module", "type", "velvet"], ["Operator", "operator", "teal"],
    ["Property, key", "property", "claret"], ["Named constant", "enumMember", "claret"],
    ["Regular expression", "regexp", "crimson"], ["Parameter", "parameter", "ink-2"],
    ["Punctuation", null, "ink-2"], ["Tag", null, "claret"],
  ]) {
    const token = theme.tokenColors.find((token) => token.name === tokenName)
    if (token?.settings.foreground !== palette[role]) fail(`${tokenName}: expected ${role}`)
    const value = semantic && theme.semanticTokenColors[semantic]
    if (semantic && (typeof value === "string" ? value : value?.foreground) !== palette[role]) fail(`semantic ${semantic}: expected ${role}`)
  }

  // Published terminal colors and cursor rules must survive generation unchanged.
  console.log("\n# 5. Terminal and cursor roles")
  for (const [field, key] of Object.entries({
    background: "terminal.background", foreground: "terminal.foreground",
    cursor: "terminalCursor.foreground", cursorText: "terminalCursor.background",
    cursorBar: "editorCursor.foreground", selectionBackground: "terminal.selectionBackground",
  })) {
    if (col[key] !== terminal[field].hex.toLowerCase()) fail(`${key}: differs from terminal.${field}`)
  }
  for (const [fgKey, bgKey] of [
    ["terminalCursor.background", "terminalCursor.foreground"],
    ["terminal.foreground", "terminal.selectionBackground"],
  ]) {
    const ratio = contrast(col[fgKey], col[bgKey])
    if (ratio < MIN) fail(`${fgKey} on ${bgKey}: ${fmt(ratio)}`)
  }
  if (type === "dark" && col["terminal.selectionForeground"] !== terminal.selectionForeground.hex.toLowerCase()) fail("terminal selection foreground differs from palette")
  const ansiContrasts = []
  for (const [index, ansiName] of ansiNames.entries()) {
    const entry = terminal.ansi.find((entry) => entry.index === index)
    const fg = col[`terminal.ansi${ansiName}`]
    if (!entry || fg !== entry.hex.toLowerCase()) fail(`ANSI ${index}: differs from the published terminal`)
    const ratio = contrast(fg, col["terminal.background"])
    ansiContrasts.push(ratio)
    // Day ANSI slots are preserved even where the published palette is below 4.5.
    if (type === "dark" && ratio < MIN) fail(`ANSI ${index}: ${fmt(ratio)}`)
  }
  console.log(`  ANSI minimum ${fmt(Math.min(...ansiContrasts))}:1${type === "light" ? " (published day slots, informational)" : ""}`)

  console.log("\n# 6. Worst content contrast by surface")
  for (const [label, bg] of Object.entries({
    ...permanentBackgrounds,
    sidebar: col["sideBar.background"],
    selection: col["editor.selectionBackground"],
  })) {
    const foregrounds = label === "sidebar" ? [col["sideBar.foreground"], col["descriptionForeground"], ...Object.keys(col).filter((k) => k.startsWith("gitDecoration.")).map((k) => col[k])] : gated.map(([, fg]) => fg)
    const worst = foregrounds.map((fg) => [fg, contrast(fg, bg)]).sort((a, b) => a[1] - b[1])[0]
    console.log(`  ${label.padEnd(16)} ${fmt(worst[1])}:1 (${roleOf(worst[0])} on ${roleOf(bg)})`)
  }
}

console.log(failures ? `\n${failures} failure(s).` : "\nAll checks pass.")
process.exit(failures ? 1 : 0)
