// Loads palette/ft-paper.json and palette/ft-paper-night.json for build and check.
// Source: the JSON published at camillehdl.dev/palette/ and /palette-night/.
// Refresh with npm run palette; builds read these committed files without network.
// Night fill formulas refer to day hues, so validation reads both palettes.
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

export const themes = [
  { name: "ft-paper", type: "light", uiTheme: "vs", url: "https://camillehdl.dev/palette/" },
  { name: "ft-paper-night", type: "dark", uiTheme: "vs-dark", url: "https://camillehdl.dev/palette-night/" },
].map((theme) => ({
  ...theme,
  palettePath: fileURLToPath(new URL(`../palette/${theme.name}.json`, import.meta.url)),
  themePath: fileURLToPath(new URL(`../themes/${theme.name}-color-theme.json`, import.meta.url)),
}))

const readPalette = (name) => JSON.parse(readFileSync(new URL(`../palette/${name}.json`, import.meta.url), "utf8"))
const swatchesOf = (data) => data.groups.flatMap((group) => group.swatches)
const colorsOf = (data) => Object.fromEntries(swatchesOf(data).map((s) => [s.role, s.hex.toLowerCase()]))

/** Definition → palette roles, fill recipes, published terminal fields and reverse lookup. */
export const loadPalette = (definition) => {
  const data = readPalette(definition.name)
  const palette = colorsOf(data)
  const swatches = swatchesOf(data)
  const derivedRoles = new Set(data.groups.filter((g) => g.title === "Derived fills").flatMap((g) => g.swatches.map((s) => s.role)))
  // Night fills mix the DAY hues over night paper, as their published formulas specify.
  const fillBases = definition.type === "dark" ? colorsOf(readPalette("ft-paper")) : palette
  const fillRecipes = Object.fromEntries(swatches.filter((s) => s.role.startsWith("fill-")).map((s) => {
    const match = s.formula.match(/^([\w-]+) at (\d+)% over (?:night )?paper$/)
    if (!match || !fillBases[match[1]]) throw new Error(`${s.role}: unsupported formula ${s.formula}`)
    return [s.role, { base: match[1], hex: fillBases[match[1]], alpha: Number(match[2]) / 100 }]
  }))
  const roleOf = (hex) => {
    const matches = Object.entries(palette).filter(([, h]) => h === hex.slice(0, 7).toLowerCase())
    return matches.length ? matches.map(([role]) => role).join(" = ") : null
  }
  return { ...definition, palette, derivedRoles, fillRecipes, terminal: data.terminal, roleOf }
}

export const ansiNames = [
  "Black", "Red", "Green", "Yellow", "Blue", "Magenta", "Cyan", "White",
  "BrightBlack", "BrightRed", "BrightGreen", "BrightYellow", "BrightBlue", "BrightMagenta", "BrightCyan", "BrightWhite",
]

export const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
export const alphaOf = (hex) => (hex.length === 9 ? parseInt(hex.slice(7, 9), 16) / 255 : 1)
export const alphaByte = (alpha) => Math.round(alpha * 255).toString(16).padStart(2, "0")
/** Composite #rrggbb[aa] over an opaque #rrggbb background. */
export const composite = (hex, over) => {
  const a = alphaOf(hex)
  const top = toRgb(hex)
  const base = toRgb(over)
  return `#${top.map((c, i) => Math.round(c * a + base[i] * (1 - a)).toString(16).padStart(2, "0")).join("")}`
}
const luminance = (hex) => {
  const [r, g, b] = toRgb(hex).map((c) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
/** WCAG 2 contrast ratio of two opaque sRGB colors. */
export const contrast = (fg, bg) => {
  const a = luminance(fg)
  const b = luminance(bg)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}
