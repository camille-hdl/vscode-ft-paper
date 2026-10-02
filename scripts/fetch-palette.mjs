// Refreshes both committed palettes from the JSON embedded in their published pages.
import { writeFileSync } from "node:fs"
import { themes } from "./palette.mjs"

// Fetch and validate every page before replacing either local palette.
const palettes = await Promise.all(themes.map(async (definition) => {
  const response = await fetch(definition.url, { signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error(`${definition.url}: HTTP ${response.status}`)
  const html = await response.text()
  const id = `${definition.name}-palette`
  const match = html.match(new RegExp(`<script\\b(?=[^>]*\\bid=["']${id}["'])(?=[^>]*\\btype=["']application/json["'])[^>]*>([\\s\\S]*?)</script>`))
  if (!match) throw new Error(`no #${id} block in ${definition.url}`)
  const data = JSON.parse(match[1])
  if (data.name !== definition.name || !Array.isArray(data.groups) || !data.terminal) throw new Error(`${definition.url}: invalid palette`)
  return [definition.palettePath, JSON.stringify(data, null, 2) + "\n"]
}))
for (const [target, json] of palettes) {
  writeFileSync(target, json)
  console.log(`wrote ${target}`)
}
