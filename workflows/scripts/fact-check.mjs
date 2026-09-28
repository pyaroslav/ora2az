#!/usr/bin/env node
// Fact check for the notice-lifecycle workflow.
// For each instance sitting in `drafted`, read the feature's draft obituary and its own data with GROQ,
// then fire `fact-check/pass` or `fact-check/fail` on the instance through the workflows CLI.
// Rule: every Oracle release (e.g. 12.2, 19c, 26ai) and every ORA-nnnnn code the obituary mentions must
// appear in the feature's own data: name, release fields, summary, oracleReplacement, its mappings
// (rationale, steps), the caveats on those mappings, and the disputes that involve them.
//
// Usage (from workflows/):
//   node scripts/fact-check.mjs                    # every in-flight notice-lifecycle instance in `drafted`
//   node scripts/fact-check.mjs <instanceId> ...   # specific instances
//   node scripts/fact-check.mjs --dry              # report only, fire nothing
// Needs: `sanity login` (the CLI fires actions as you) and SANITY_WRITE_TOKEN or SANITY_READ_TOKEN
// in the environment or ~/.config/ora2az/env (drafts are not publicly readable).
import {createClient} from '@sanity/client'
import {execFileSync} from 'node:child_process'
import {existsSync, readFileSync} from 'node:fs'
import {join} from 'node:path'

const envFile = join(process.env.HOME ?? '', '.config', 'ora2az', 'env')
if (existsSync(envFile)) for (const l of readFileSync(envFile, 'utf8').split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && m[2]) process.env[m[1]] ??= m[2] }

const argv = process.argv.slice(2)
const dry = argv.includes('--dry')
const ids = argv.filter((a) => !a.startsWith('--'))

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID ?? 'udyjvgsk',
  dataset: process.env.SANITY_DATASET ?? 'production',
  token: process.env.SANITY_READ_TOKEN ?? process.env.SANITY_WRITE_TOKEN,
  apiVersion: '2025-01-01',
  useCdn: false,
  perspective: 'raw',
})

const cli = (...args) => JSON.parse(execFileSync('npx', ['sanity-workflows', ...args, '--json'], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit']}))

// Oracle release names (8i..26ai, 9.2..23.x) and ORA- error codes.
const RELEASE = /\b(?:(?:8|9|10|11|12|18|19|21|23|26)(?:ai|i|g|c)|(?:9|10|11|12|18|19|21|23|26)\.\d)\b/gi
const ORA = /\bORA-\d{5}\b/gi
const tokens = (text) => new Set([...(text.match(RELEASE) ?? []), ...(text.match(ORA) ?? [])].map((t) => (/^ORA-/i.test(t) ? t.toUpperCase() : t.toLowerCase())))

const QUERY = `{
  "draft": *[_id == "drafts." + $id][0]{"obituary": pt::text(obituary)},
  "published": *[_id == $id][0]{"obituary": pt::text(obituary)},
  "facts": *[_id == $id][0]{
    name, introducedIn, deprecatedIn, desupportedIn, oracleReplacement,
    "summary": pt::text(summary),
    "mappings": *[_type == "mapping" && oracleFeature._ref == ^._id && !(_id in path("drafts.**"))]{rationale, "steps": pt::text(steps)},
    "caveats": *[_type == "caveat" && mapping->oracleFeature._ref == ^._id && !(_id in path("drafts.**"))]{statement},
    "disputes": *[_type == "dispute" && !(_id in path("drafts.**")) && (claimA->mapping->oracleFeature._ref == ^._id || claimB->mapping->oracleFeature._ref == ^._id)]{title, whatDisagrees, resolution}
  }
}`

function flatten(v) {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return v.map(flatten).join('\n')
  if (typeof v === 'object') return Object.values(v).map(flatten).join('\n')
  return String(v)
}

const targets = ids.length
  ? ids
  : cli('list').instances.filter((i) => i.definition === 'notice-lifecycle' && i.currentStage === 'drafted' && i.status === 'in-flight').map((i) => i._id)

if (!targets.length) console.log('No notice-lifecycle instances waiting in `drafted`.')
let failed = 0
for (const instanceId of targets) {
  const inst = cli('show', instanceId)
  if (inst.currentStage !== 'drafted') { console.log(`${instanceId}: in ${inst.currentStage}, skipped`); continue }
  const gdr = inst.fields.find((f) => f.name === 'subject')?.value?.id ?? ''
  const featureId = gdr.split(':').pop() // dataset:<project>:<dataset>:<documentId>
  const {draft, published, facts} = await client.fetch(QUERY, {id: featureId})
  const obituary = draft?.obituary || published?.obituary || ''
  let action, note
  if (!facts) { action = 'fail'; note = `Feature ${featureId} not found.` }
  else if (!obituary.trim()) { action = 'fail'; note = 'No obituary text on the draft or published document.' }
  else {
    const mentioned = tokens(obituary)
    const allowed = tokens(flatten(facts))
    const unsupported = [...mentioned].filter((t) => !allowed.has(t))
    if (unsupported.length) { action = 'fail'; note = `Not in the feature's own data: ${unsupported.join(', ')}.` }
    else { action = 'pass'; note = `Checked ${mentioned.size} release/ORA- mention(s) against the feature's data${mentioned.size ? ': ' + [...mentioned].join(', ') : ''}. All supported.` }
  }
  if (action === 'fail') failed++
  console.log(`${instanceId} (${featureId}): ${action.toUpperCase()} - ${note}`)
  if (dry) continue
  // --param values are JSON-parsed by the CLI; pass a JSON string so the note always stays a string.
  const r = cli('fire-action', instanceId, '--activity', 'fact-check', '--action', action, '--param', `note=${JSON.stringify(note)}`)
  console.log(`  -> now at ${r.currentStage}`)
}
process.exitCode = failed ? 1 : 0
