#!/usr/bin/env node
// Second, independent grader from another vendor (Gemini via REST). Same blind protocol as grade.mjs:
// answers shuffled with the same per-question seed and relabelled W/X/Y/Z, same rubric, JSON-only reply.
// Needs GEMINI_API_KEY in ~/.config/ora2az/env. Usage: node eval/grade_second.mjs [--dir eval/results/2026-09-27]
import {readFileSync, writeFileSync, existsSync} from 'node:fs'
import {join, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {parse} from 'yaml'
import {loadEnv} from '../lib/runtime.mjs'

loadEnv()
const KEY = process.env.GEMINI_API_KEY
if (!KEY) { console.error('GEMINI_API_KEY missing in ~/.config/ora2az/env'); process.exit(2) }
// One model for every question, so grades are comparable. Free tier: 3.8 Flash (2.5 models are closed to new keys; 3.1 Pro has no free quota).
const MODELS = (process.env.GRADER2_MODELS ?? 'gemini-3.8-flash').split(',')
const PACE_MS = Number(process.env.GRADER2_PACE_MS ?? 20000)
const here = dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const dir = argv.includes('--dir') ? argv[argv.indexOf('--dir') + 1] : join(here, 'results', '2026-09-27')
const CONDS = ['none', 'bm25', 'groq', 'groq+kb'], LABELS = ['W', 'X', 'Y', 'Z']
const RUBRIC = readFileSync(join(here, 'grade.md'), 'utf8')
const questions = parse(readFileSync(join(here, 'questions.yaml'), 'utf8'))
const seeded = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296 }

async function ask(prompt) {
  for (const m of MODELS) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${KEY}`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({contents: [{role: 'user', parts: [{text: prompt}]}], generationConfig: {temperature: 0, responseMimeType: 'application/json'}}),
      })
      if (r.ok) { const j = await r.json(); return {model: m, text: j.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? ''} }
      if (r.status === 429 || r.status >= 500) { const wait = Math.min(120000, 20000 * (attempt + 1)); console.error(`  ${m}: HTTP ${r.status}, retrying in ${wait / 1000}s`); await new Promise((s) => setTimeout(s, wait)); continue }
      break // other errors: try next model
    }
  }
  throw new Error('all grader models failed')
}

const first = existsSync(join(dir, 'grades.json')) ? JSON.parse(readFileSync(join(dir, 'grades.json'), 'utf8')) : []
const progressFile = join(dir, 'grades-second.partial.json')
const out = existsSync(progressFile) ? JSON.parse(readFileSync(progressFile, 'utf8')) : []
for (const q of questions) {
  if (out.some((x) => x.id === q.id)) continue
  const runs = CONDS.map((c) => { const f = join(dir, `${q.id}.${c}.json`); return existsSync(f) ? {cond: c, text: JSON.parse(readFileSync(f, 'utf8')).result ?? '(no answer)'} : null }).filter(Boolean)
  if (!runs.length) continue
  const rnd = seeded(q.id)
  const order = runs.map((r) => [rnd(), r]).sort((a, b) => a[0] - b[0]).map((x) => x[1]); order.forEach((r, i) => (r.label = LABELS[i]))
  const prompt = `You are a strict, blind grader for an Oracle-to-Azure migration Q&A evaluation. You do not know which system produced which answer. Judge only against the expected verdict below; do not reward length or style.\n\n${RUBRIC}\n\nQUESTION (${q.id}, type=${q.type}):\n${q.q}\n\nEXPECTED VERDICT:\n${q.expected}\n\n${order.map((r) => `===== ANSWER ${r.label} =====\n${r.text}`).join('\n\n')}\n\nReturn ONLY a JSON object: {${order.map((r) => `"${r.label}": {"verdict": 0|1, "grounded": 0|1, "refusal": 0|1|null, "note": "<12 words>"}`).join(', ')}}. Use "refusal": null unless the question type is refusal.`
  const {model, text} = await ask(prompt)
  let s = {}; try { s = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)) } catch { console.error(q.id, 'unparseable') }
  for (const r of order) {
    const f = first.find((g) => g.id === q.id && g.cond === r.cond) ?? {}
    out.push({id: q.id, type: q.type, cond: r.cond, grader: model, ...(s[r.label] ?? {}), citations: f.citations ?? null, firstGrader: {verdict: f.verdict, grounded: f.grounded, refusal: f.refusal}})
  }
  writeFileSync(progressFile, JSON.stringify(out, null, 2))
  await new Promise((s) => setTimeout(s, PACE_MS))
  console.log(q.id, model, order.map((r) => `${r.cond}:${s[r.label]?.verdict ?? '?'}${s[r.label]?.grounded ?? '?'}`).join(' '))
}
writeFileSync(join(dir, 'grades-second.json'), JSON.stringify(out, null, 2))
const sum = (xs, k) => xs.filter((x) => x[k] === 1).length, cnt = (xs, k) => xs.filter((x) => typeof x[k] === 'number').length
const agree = (xs, k) => xs.filter((x) => typeof x[k] === 'number' && x[k] === x.firstGrader[k]).length
const rows = CONDS.map((c) => { const xs = out.filter((x) => x.cond === c); return `| ${c} | ${sum(xs, 'verdict')}/${cnt(xs, 'verdict')} | ${sum(xs, 'grounded')}/${cnt(xs, 'grounded')} | ${sum(xs, 'refusal')}/${cnt(xs, 'refusal')} | ${agree(xs, 'verdict')}/${cnt(xs, 'verdict')} |` })
const table = `Second grader: ${[...new Set(out.map((x) => x.grader))].join(', ')}\n\n| condition | verdict correct | grounded | refused when it should | agrees with first grader on verdict |\n|---|---|---|---|---|\n${rows.join('\n')}\n`
writeFileSync(join(dir, 'summary-second.md'), table); console.log('\n' + table)
