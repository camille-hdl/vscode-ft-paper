// Generates both themes from the committed palettes and shared specification.
import { writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { themes, loadPalette, composite, alphaByte } from "./palette.mjs"
import { buildTheme } from "./theme.mjs"

export const render = (source) => {
  for (const [role, { hex, alpha }] of Object.entries(source.fillRecipes)) {
    const got = composite(hex + alphaByte(alpha), source.palette.paper)
    const expected = source.palette[role]
    const drift = Math.max(...[1, 3, 5].map((i) => Math.abs(parseInt(got.slice(i, i + 2), 16) - parseInt(expected.slice(i, i + 2), 16))))
    if (drift > 1) throw new Error(`${source.name} ${role}: the recipe gives ${got}, the palette ${expected}`)
  }
  return JSON.stringify(buildTheme(source).theme, null, 2) + "\n"
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const definition of themes) {
    const source = loadPalette(definition)
    writeFileSync(source.themePath, render(source))
    console.log(`wrote ${source.themePath}`)
  }
}
