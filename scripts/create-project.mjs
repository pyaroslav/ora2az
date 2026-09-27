#!/usr/bin/env node
// After `npx sanity login`: create the ora2az project, make the dataset public, mint an Editor token for seeding,
// and write ids/tokens into ~/.config/ora2az/env. Idempotent: reuses an existing project named "ora2az".
// Uses the CLI's own auth token (~/.config/sanity/config.json) against the Sanity management API.
import {readFileSync, writeFileSync, existsSync} from 'node:fs'
import {join} from 'node:path'

const API = 'https://api.sanity.io/v2021-06-07'
const NAME = process.env.PROJECT_NAME ?? 'ora2az'
const DATASET = process.env.SANITY_DATASET ?? 'production'
const cfgPath = join(process.env.HOME, '.config', 'sanity', 'config.json')
const envPath = join(process.env.HOME, '.config', 'ora2az', 'env')

const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'))
const auth = cfg.authToken
if (!auth) { console.error('Not logged in: run `npx sanity login` in ora2az/studio first.'); process.exit(1) }

async function api(method, path, body) {
  const r = await fetch(API + path, {method, headers: {Authorization: `Bearer ${auth}`, 'Content-Type': 'application/json'}, body: body ? JSON.stringify(body) : undefined})
  const text = await r.text()
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status} ${text.slice(0, 300)}`)
  return text ? JSON.parse(text) : null
}

const me = await api('GET', '/users/me')
console.log(`logged in as ${me.name ?? me.id} <${me.email ?? '?'}>`)

const orgs = await api('GET', '/organizations')
if (!orgs.length) throw new Error('no organizations visible to this user')
const org = process.env.SANITY_ORG_ID ? orgs.find((o) => o.id === process.env.SANITY_ORG_ID) : orgs[0]
console.log(`organizations: ${orgs.map((o) => `${o.name} (${o.id})`).join(', ')} → using ${org.name} (${org.id})`)

const projects = await api('GET', '/projects')
let project = projects.find((p) => p.displayName === NAME && p.organizationId === org.id)
if (project) console.log(`project exists: ${project.displayName} (${project.id})`)
else {
  project = await api('POST', '/projects', {displayName: NAME, organizationId: org.id})
  console.log(`project created: ${project.displayName} (${project.id})`)
}

const datasets = await api('GET', `/projects/${project.id}/datasets`)
const ds = datasets.find((d) => d.name === DATASET)
if (!ds) { await api('PUT', `/projects/${project.id}/datasets/${DATASET}`, {aclMode: 'public'}); console.log(`dataset ${DATASET} created (public)`) }
else if (ds.aclMode !== 'public') { await api('PATCH', `/projects/${project.id}/datasets/${DATASET}`, {aclMode: 'public'}); console.log(`dataset ${DATASET} set public`) }
else console.log(`dataset ${DATASET} exists (public)`)

// Editor token for the seed script (project-scoped). Reuse if a token with our label exists? Tokens are shown once, so mint a new one only when env is empty.
let env = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, 'm')) ?? [])[1] ?? ''
const set = (k, v) => { env = env.match(new RegExp(`^${k}=`, 'm')) ? env.replace(new RegExp(`^${k}=.*$`, 'm'), `${k}=${v}`) : env + `\n${k}=${v}` }

if (!get('SANITY_WRITE_TOKEN')) {
  const tok = await api('POST', `/projects/${project.id}/tokens`, {label: `ora2az-seed-${new Date().toISOString().slice(0, 10)}`, roleName: 'editor'})
  set('SANITY_WRITE_TOKEN', tok.key); console.log('editor token minted for seeding')
} else console.log('SANITY_WRITE_TOKEN already set, keeping it')
set('SANITY_PROJECT_ID', project.id); set('SANITY_DATASET', DATASET); set('SANITY_ORG_ID', org.id)
writeFileSync(envPath, env.trimEnd() + '\n', {mode: 0o600})
// Studio + app + desk env files (gitignored)
writeFileSync('studio/.env', `SANITY_STUDIO_PROJECT_ID=${project.id}\nSANITY_STUDIO_DATASET=${DATASET}\n`)
writeFileSync('app/.env.local', `NEXT_PUBLIC_SANITY_PROJECT_ID=${project.id}\nNEXT_PUBLIC_SANITY_DATASET=${DATASET}\n`)
writeFileSync('desk/.env', `SANITY_APP_ORGANIZATION_ID=${org.id}\nSANITY_APP_PROJECT_ID=${project.id}\nSANITY_APP_DATASET=${DATASET}\n`)
console.log(`\nwrote ${envPath}, studio/.env, app/.env.local, desk/.env`)
console.log(`\nNEXT (Manage UI, one time):\n  1. https://www.sanity.io/manage/organization/${org.id}  → Labs → enable Context, opt into Knowledge Bases\n  2. Same org → API → Tokens → new token, role "Context Viewer" → SANITY_ORG_TOKEN in ${envPath}\n  3. Dashboard → Context → New MCP endpoint "ora2az-groq" on project ${project.id} / ${DATASET}`)
