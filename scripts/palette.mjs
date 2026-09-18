// Loads the ft-paper palette and provides the color helpers shared by build.mjs and
// check.mjs.
//
// Source: palette/ft-paper.json, a verbatim copy of the structured data published at
// https://camillehdl.dev/palette (refresh with npm run palette). Roles, hex values and
// the six derived fills all come from that file; nothing is hand-copied here.

import { readFileSync } from "node:fs"

export const PALETTE_URL = "https://camillehdl.dev/palette/"

const { groups } = JSON.parse(readFileSync(new URL("../palette/ft-paper.json", import.meta.url), "utf8"))

/** role → lowercase hex, for every swatch including the derived fills. */
export const palette = Object.fromEntries(
  groups.flatMap((g) => g.swatches.map((s) => [s.role, s.hex.toLowerCase()]))
)

/** Roles of the "Derived fills" group: mixed from the palette, not part of it. */
export const derivedRoles = new Set(
  groups.filter((g) => g.title === "Derived fills").flatMap((g) => g.swatches.map((s) => s.role))
)

/** Terminal ANSI slot (0–15) → role, as recorded by the palette. */
export const ansiSlots = Object.fromEntries(
  groups
    .flatMap((g) => g.swatches)
    .filter((s) => s.ansi !== null)
    .map((s) => [s.ansi, s.role])
)

/**
 * Derived fill recipes: palette hue and alpha. The palette publishes the opaque hex;
 * VS Code requires a translucent color for several keys. The same hue at the same
 * alpha, laid over paper, gives back the fill — build.mjs checks it to ±1 per channel
 * and fails otherwise.
 */
export const fillRecipes = {
  "fill-add": ["jade-bright", 0.2],
  "fill-remove": ["crimson", 0.16],
  "fill-change": ["oxford-bright", 0.16],
  "fill-change-focus": ["oxford-bright", 0.32],
  "fill-match": ["mandarin-bright", 0.34],
  "fill-target": ["claret", 0.4],
}

export const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

export const alphaOf = (hex) => (hex.length === 9 ? parseInt(hex.slice(7, 9), 16) / 255 : 1)

export const alphaByte = (alpha) => Math.round(alpha * 255).toString(16).padStart(2, "0")

/** Lays a #rrggbb[aa] color over an opaque #rrggbb background. */
export const composite = (hex, over) => {
  const a = alphaOf(hex)
  const top = toRgb(hex)
  const base = toRgb(over)
  return `#${top
    .map((c, i) => Math.round(c * a + base[i] * (1 - a)).toString(16).padStart(2, "0"))
    .join("")}`
}

const luminance = (hex) => {
  const [r, g, b] = toRgb(hex).map((c) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Same formula as the palette page (WCAG 2). */
export const contrast = (fg, bg) => {
  const a = luminance(fg)
  const b = luminance(bg)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/** Opaque hex → role(s); roles sharing a hex are joined with " = ". */
export const roleOf = (hex) => {
  const matches = Object.entries(palette).filter(([, h]) => h === hex.slice(0, 7).toLowerCase())
  if (matches.length === 0) return null
  return matches.map(([role]) => role).join(" = ")
}
