import {readFileSync, readdirSync} from 'node:fs'
import {join} from 'node:path'
import {parse} from 'yaml'
import {randomUUID} from 'node:crypto'

const TYPE_BY_PREFIX = {
  source: 'source', feature: 'oracleFeature', target: 'azureTarget', mapping: 'mapping',
  caveat: 'caveat', dispute: 'dispute', glossary: 'glossary', pattern: 'pattern',
}
const REF_FIELDS = new Set(['oracleFeature', 'azureTarget', 'mapping', 'claimA', 'claimB', 'evidence', 'resolvedBy'])
const REF_ARRAY_FIELDS = new Set(['sources', 'relatedMappings'])
const PT_FIELDS = new Set(['summary', 'obituary', 'steps', 'approach'])
// YAML reads 11.2 / 12.1 / 12.2 as numbers; the schema wants strings everywhere a release label appears.
const STRING_FIELDS = new Set(['introducedIn', 'deprecatedIn', 'desupportedIn', 'appliesToOracleVersions', 'oracleVersions', 'editions', 'azureTiers', 'docVersion', 'alsoKnownAs'])
const str = (v) => (Array.isArray(v) ? v.map((x) => String(x)) : v === null || v === undefined ? v : String(v))

export function loadAll(dir) {
  const out = []
  for (const f of readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).sort()) {
    const list = parse(readFileSync(join(dir, f), 'utf8')) ?? []
    if (!Array.isArray(list)) throw new Error(`${f}: top level must be a list`)
    list.forEach((d) => out.push({...d, __file: f}))
  }
  return out
}

export function typeOf(id) {
  const prefix = String(id).split('.')[0]
  const t = TYPE_BY_PREFIX[prefix]
  if (!t) throw new Error(`unknown id prefix in ${id}`)
  return t
}

// Sanity treats a dot in _id as a path prefix (like drafts.), which hides the document from normal queries.
// YAML keeps the readable `type.slug` form; stored ids use `type_slug`.
export const storedId = (id) => String(id).replace('.', '_')
const ref = (id) => ({_type: 'reference', _ref: storedId(id), _key: storedId(id).replace(/[^a-z0-9-]/gi, '-')})

export function toPortableText(text) {
  if (!text) return undefined
  const blocks = []
  for (const para of String(text).trim().split(/\n\s*\n/)) {
    const lines = para.split('\n').map((l) => l.trim()).filter(Boolean)
    const isList = lines.every((l) => l.startsWith('- '))
    if (isList) {
      lines.forEach((l) =>
        blocks.push({
          _type: 'block', _key: randomUUID().slice(0, 12), style: 'normal', listItem: 'bullet', level: 1,
          markDefs: [], children: [{_type: 'span', _key: randomUUID().slice(0, 12), text: l.slice(2), marks: []}],
        }),
      )
    } else {
      blocks.push({
        _type: 'block', _key: randomUUID().slice(0, 12), style: 'normal', markDefs: [],
        children: [{_type: 'span', _key: randomUUID().slice(0, 12), text: lines.join(' '), marks: []}],
      })
    }
  }
  return blocks
}

export function toDocument(raw) {
  const {__file, ...d} = raw
  if (!d._id) throw new Error(`${__file}: document without _id: ${JSON.stringify(d).slice(0, 80)}`)
  const doc = {...d, _type: typeOf(d._id)}
  doc._id = storedId(d._id)
  for (const [k, v] of Object.entries(doc)) {
    if (v === null || v === undefined || v === '') { delete doc[k]; continue }
    if (REF_FIELDS.has(k)) doc[k] = ref(v)
    else if (REF_ARRAY_FIELDS.has(k)) doc[k] = v.map(ref)
    else if (PT_FIELDS.has(k)) doc[k] = toPortableText(v)
    else if (k === 'slug') doc[k] = {_type: 'slug', current: v}
    else if (STRING_FIELDS.has(k)) doc[k] = str(v)
    else if (k === 'appliesTo' && v && typeof v === 'object') doc[k] = Object.fromEntries(Object.entries(v).map(([kk, vv]) => [kk, STRING_FIELDS.has(kk) ? str(vv) : vv]))
  }
  return doc
}
