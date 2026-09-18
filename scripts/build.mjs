// Generates themes/ft-paper-color-theme.json from the palette and the specification.
// Usage: node scripts/build.mjs   (or npm run build)

import { writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { palette, fillRecipes, composite, alphaByte } from "./palette.mjs"
import { buildTheme } from "./theme.mjs"

export const THEME_PATH = fileURLToPath(new URL("../themes/ft-paper-color-theme.json", import.meta.url))

// Translucent recipes must give back, over paper, the hex published by the palette.
for (const [role, [base, alpha]] of Object.entries(fillRecipes)) {
  const got = composite(palette[base] + alphaByte(alpha), palette.paper)
  const drift = Math.max(...[1, 3, 5].map((i) => Math.abs(parseInt(got.slice(i, i + 2), 16) - parseInt(palette[role].slice(i, i + 2), 16))))
  if (drift > 1) throw new Error(`${role}: the recipe gives ${got}, the palette ${palette[role]}`)
}

export const render = () => JSON.stringify(buildTheme().theme, null, 2) + "\n"

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(THEME_PATH, render())
  console.log(`wrote ${THEME_PATH}`)
}
