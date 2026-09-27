// Keyword-search baseline: flatten the PUBLIC dataset into passages and rank them with BM25.
// Reads via the public Content Lake API (dataset is public), caches to eval/.cache/dataset.json.
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const cache = join(here, '.cache', 'dataset.json')

const ptText = (blocks) => Array.isArray(blocks) ? blocks.map((b) => (b.children ?? []).map((c) => c.text ?? '').join('')).join(' ') : ''

export async function loadDataset() {
  // Local mode (before the dataset is online): BM25_LOCAL=1 reads content/data/*.yaml through the seed converter.
  if (process.env.BM25_LOCAL) {
    const {loadAll, toDocument} = await import('../../content/lib.mjs')
    return loadAll(join(here, '..', '..', 'content', 'data')).map(toDocument)
  }
  if (existsSync(cache)) return JSON.parse(readFileSync(cache, 'utf8'))
  const pid = process.env.SANITY_PROJECT_ID, ds = process.env.SANITY_DATASET ?? 'production'
  if (!pid) throw new Error('SANITY_PROJECT_ID not set')
  const url = `https://${pid}.api.sanity.io/v2026-09-01/data/query/${ds}?query=${encodeURIComponent('*[!(_type match "system.*") && !(_id in path("drafts.**"))]')}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`fetch ${res.status}`)
  const {result} = await res.json()
  mkdirSync(dirname(cache), {recursive: true})
  writeFileSync(cache, JSON.stringify(result))
  return result
}

// One passage per document: every scalar string field + Portable Text flattened. References are NOT followed —
// that is the point: keyword search sees documents, not the graph.
export function flatten(docs) {
  return docs.map((d) => {
    const parts = []
    for (const [k, v] of Object.entries(d)) {
      if (k.startsWith('_')) continue
      if (typeof v === 'string') parts.push(v)
      else if (Array.isArray(v) && v[0]?._type === 'block') parts.push(ptText(v))
      else if (Array.isArray(v) && typeof v[0] === 'string') parts.push(v.join(', '))
      else if (v && typeof v === 'object' && !Array.isArray(v)) for (const x of Object.values(v)) if (Array.isArray(x) && typeof x[0] === 'string') parts.push(x.join(', '))
    }
    return {id: d._id, type: d._type, text: parts.join(' | ').replace(/\s+/g, ' ').trim()}
  }).filter((p) => p.text)
}

const tok = (s) => s.toLowerCase().replace(/[^a-z0-9_@.]+/g, ' ').split(' ').filter((t) => t.length > 1)

export function bm25(passages, query, k = 8, k1 = 1.5, b = 0.75) {
  const docs = passages.map((p) => tok(p.text))
  const N = docs.length, avgdl = docs.reduce((s, d) => s + d.length, 0) / N
  const df = new Map()
  for (const d of docs) for (const t of new Set(d)) df.set(t, (df.get(t) ?? 0) + 1)
  const q = tok(query)
  const scores = docs.map((d, i) => {
    const tf = new Map(); for (const t of d) tf.set(t, (tf.get(t) ?? 0) + 1)
    let s = 0
    for (const t of q) {
      const f = tf.get(t); if (!f) continue
      const idf = Math.log(1 + (N - df.get(t) + 0.5) / (df.get(t) + 0.5))
      s += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * d.length / avgdl))
    }
    return {i, s}
  })
  return scores.filter((x) => x.s > 0).sort((a, b2) => b2.s - a.s).slice(0, k).map((x) => ({...passages[x.i], score: +x.s.toFixed(3), text: passages[x.i].text.slice(0, 1200)}))
}

export async function bm25Passages(query, k = 8) {
  return bm25(flatten(await loadDataset()), query, k)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const q = process.argv.slice(2).join(' ') || 'DBMS_JOB Azure SQL Managed Instance'
  const hits = await bm25Passages(q, 5)
  for (const h of hits) console.log(`${h.score}\t${h.id}\n\t${h.text.slice(0, 200)}\n`)
}
