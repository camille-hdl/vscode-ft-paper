// Refreshes palette/ft-paper.json from the published palette page.
// Usage: node scripts/fetch-palette.mjs   (or npm run palette)
//
// https://camillehdl.dev/palette embeds the palette as structured data in
// <script type="application/json" id="ft-paper-palette">. This script is the only
// part of the repository that touches the network during a build; the theme itself
// is generated from the committed JSON.

import { writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { PALETTE_URL } from "./palette.mjs"

const target = fileURLToPath(new URL("../palette/ft-paper.json", import.meta.url))
const html = await (await fetch(PALETTE_URL)).text()
const match = html.match(/<script type="application\/json" id="ft-paper-palette">([\s\S]*?)<\/script>/)
if (!match) throw new Error(`no #ft-paper-palette block in ${PALETTE_URL}`)
writeFileSync(target, JSON.stringify(JSON.parse(match[1]), null, 2) + "\n")
console.log(`wrote ${target}`)
