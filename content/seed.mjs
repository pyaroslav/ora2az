// Upserts content/data/*.yaml into Sanity. Idempotent (deterministic _ids, createOrReplace).
// Usage: SANITY_PROJECT_ID=… SANITY_DATASET=production SANITY_WRITE_TOKEN=… node seed.mjs [--dry]
import {readFileSync, readdirSync} from 'node:fs'
import {join, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {parse} from 'yaml'
import {createClient} from '@sanity/client'
import {loadAll, toDocument} from './lib.mjs'

const dry = process.argv.includes('--dry')
const here = dirname(fileURLToPath(import.meta.url))
const docs = loadAll(join(here, 'data')).map(toDocument)

console.log(`${docs.length} documents from YAML`)
if (dry) {
  console.log(JSON.stringify(docs.slice(0, 3), null, 2))
  process.exit(0)
}

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET ?? 'production',
  token: process.env.SANITY_WRITE_TOKEN,
  apiVersion: '2026-09-01',
  useCdn: false,
})

// References must resolve: seed in dependency order, sources first, in batches.
const order = ['source', 'oracleFeature', 'azureTarget', 'mapping', 'caveat', 'dispute', 'glossary', 'pattern']
for (const type of order) {
  const batch = docs.filter((d) => d._type === type)
  if (!batch.length) continue
  for (let i = 0; i < batch.length; i += 50) {
    const tx = client.transaction()
    batch.slice(i, i + 50).forEach((d) => tx.createOrReplace(d))
    await tx.commit({autoGenerateArrayKeys: true})
  }
  console.log(`  ${type}: ${batch.length} upserted`)
}
console.log('done')
