// Checks ids, prefixes, required fields, and that every reference resolves. Run before seeding.
import {join, dirname} from 'node:path'
import {existsSync, readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {loadAll, toDocument, storedId} from './lib.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const raw = loadAll(join(here, 'data'))
const ids = new Set()
const errors = []
const REQUIRED = {
  source: ['title', 'publisher', 'url', 'retrievedAt'],
  oracleFeature: ['name', 'slug', 'category', 'summary', 'sources'],
  azureTarget: ['name', 'slug', 'service', 'summary', 'sources'],
  mapping: ['oracleFeature', 'azureTarget', 'fidelity', 'rationale', 'sources'],
  caveat: ['mapping', 'severity', 'statement', 'evidence'],
  dispute: ['title', 'claimA', 'claimB', 'whatDisagrees', 'resolution'],
  glossary: ['term', 'definition', 'sources'],
  pattern: ['title', 'problem', 'approach', 'sources'],
}
const docs = []
for (const r of raw) {
  try {
    if (!/^[a-z]+\.[a-z0-9-]+$/.test(r._id)) errors.push(`${r.__file}: bad _id "${r._id}"`)
    if (ids.has(storedId(r._id))) errors.push(`${r.__file}: duplicate _id ${r._id}`)
    ids.add(storedId(r._id))
    const d = toDocument(r)
    for (const f of REQUIRED[d._type] ?? []) if (d[f] === undefined) errors.push(`${r._id}: missing ${f}`)
    docs.push(d)
  } catch (e) { errors.push(String(e.message)) }
}
const walk = (v, owner) => {
  if (Array.isArray(v)) v.forEach((x) => walk(x, owner))
  else if (v && typeof v === 'object') {
    if (v._type === 'reference' && !ids.has(v._ref)) errors.push(`${owner}: dangling reference ${v._ref}`)
    Object.values(v).forEach((x) => walk(x, owner))
  }
}
docs.forEach((d) => walk(d, d._id))
const counts = docs.reduce((m, d) => ((m[d._type] = (m[d._type] ?? 0) + 1), m), {})
console.log(counts, `total ${docs.length}`)
const bannedFile = join(process.env.HOME ?? '', '.config', 'ora2az', 'banned.regex') // private scrub list, kept outside the repo
const banned = existsSync(bannedFile) ? new RegExp(readFileSync(bannedFile, 'utf8').trim(), 'i') : null
for (const r of raw) if (banned && banned.test(JSON.stringify(r))) errors.push(`${r._id}: banned identifier present`)
if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log('OK')
