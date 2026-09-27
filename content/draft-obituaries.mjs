#!/usr/bin/env node
// Drafts an obituary for each Oracle feature with Sanity Agent Actions (runs on Sanity, uses the plan's AI credits).
// The only material the model gets is the feature's own graph neighbourhood, fetched with GROQ. Output goes to the
// draft document; nothing reaches the public site until an editor certifies it in the desk (edit + publish).
// Usage: node content/draft-obituaries.mjs [--only oracle-streams,dbms-job] [--force]
import {createClient} from '@sanity/client'
import {readFileSync, existsSync} from 'node:fs'
import {join} from 'node:path'

const envFile = join(process.env.HOME ?? '', '.config', 'ora2az', 'env')
if (existsSync(envFile)) for (const l of readFileSync(envFile, 'utf8').split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && m[2]) process.env[m[1]] ??= m[2] }
const argv = process.argv.slice(2)
const only = (argv[argv.indexOf('--only') + 1] ?? '').split(',').filter((s) => argv.includes('--only') && s)
const force = argv.includes('--force')

const client = createClient({projectId: process.env.SANITY_PROJECT_ID, dataset: process.env.SANITY_DATASET ?? 'production', token: process.env.SANITY_WRITE_TOKEN, apiVersion: 'vX', useCdn: false})

const FACTS = `*[_id == $id][0]{
  name, category, introducedIn, deprecatedIn, desupportedIn, oracleReplacement,
  "survivedBy": *[_type == "mapping" && references(^._id)]{fidelity, effort, rationale, "target": azureTarget->name},
  "complications": *[_type == "caveat" && mapping->oracleFeature._ref == ^._id]{severity, statement},
  "contested": *[_type == "dispute" && (claimA->mapping->oracleFeature._ref == ^._id || claimB->mapping->oracleFeature._ref == ^._id)]{title, resolution}
}`

const INSTRUCTION = `Write a short newspaper obituary for the Oracle Database feature described in $facts, for a column called "The Legacy Obituaries" that covers Oracle features that did not survive a move to Azure.
Rules:
- Use ONLY facts present in $facts. Do not add releases, products, numbers or claims that are not there.
- Exactly 3 paragraphs of 2 sentences each, 80–110 words total. Dry, respectful, lightly wry.
- Paragraph 1: who it was and what it did in life, and when it was born (introducedIn) if known.
- Paragraph 2: cause of departure — its deprecation/desupport releases if present, otherwise the blocking complication that keeps it from Azure.
- Paragraph 3 is MANDATORY and must begin "It is survived by": name every Azure target in survivedBy with its fidelity in plain words (exact = lives on unchanged, partial = partly, workaround = only by workaround, none = not at all). Mention one contested account only if the list is not empty.
- Spend at most 2 sentences on complications; do not list them all.
- No headings, no lists, no links, no quotation of source titles.`

const ids = await client.withConfig({perspective: 'raw'}).fetch(`*[_type == "oracleFeature" && !(_id in path("drafts.**")) ${only.length ? '&& slug.current in $only' : ''}]{_id, "slug": slug.current, "has": defined(obituary), "draft": defined(*[_id == "drafts." + ^._id][0].obituary)} | order(slug asc)`, {only})
let done = 0, skipped = 0
for (const f of ids) {
  if ((f.has || f.draft) && !force) { skipped++; continue }
  // generate appends to existing text, so a forced redraft starts from an empty field on the draft
  if (f.draft) await client.patch(`drafts.${f._id}`).unset(['obituary']).commit()
  const t0 = Date.now()
  await client.agent.action.generate({
    schemaId: '_.schemas.ora2az',
    documentId: f._id,
    instruction: INSTRUCTION,
    instructionParams: {facts: {type: 'groq', query: FACTS, params: {id: f._id}}},
    target: {path: ['obituary']},
  })
  done++
  console.log(`${f.slug}: drafted in ${((Date.now() - t0) / 1000).toFixed(1)} s`)
}
console.log(`drafted ${done}, skipped ${skipped} (already had an obituary or draft)`)
