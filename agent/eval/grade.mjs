#!/usr/bin/env node
// Blind grading of eval runs.
//  1. Deterministic: which publisher domains does each answer cite (by URL), vs the question's required publishers.
//  2. Model-graded (headless agent CLI, strongest model, no tools): answers are shuffled and relabelled W/X/Y/Z so the grader
//     never sees the condition. Rubric from grade.md: verdict, grounded, refusal.
// Usage: node eval/grade.mjs --dir eval/results/2026-09-27 [--only q01,q02]
import {runAgent} from '../lib/runtime.mjs'
import {readFileSync, writeFileSync, existsSync} from 'node:fs'
import {join, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {parse} from 'yaml'

const here = dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const opt = (n, d) => { const i = argv.indexOf(n); return i < 0 ? d : argv[i + 1] }
const dir = opt('--dir', join(here, 'results', '2026-09-27'))
const only = (opt('--only', '') || '').split(',').filter(Boolean)
const CONDS = ['none', 'bm25', 'groq', 'groq+kb']
const questions = parse(readFileSync(join(here, 'questions.yaml'), 'utf8')).filter((q) => !only.length || only.includes(q.id))

const DOMAINS = {
  oracle: /docs\.oracle\.com|oracle\.com\//i,
  microsoft: /learn\.microsoft\.com|azure\.microsoft\.com|microsoft\.com\//i,
  community: /postgresql\.org|ora2pg|github\.com\/(?!pyaroslav)|oracle-base\.com|asktom|mikedietrich|connor-mcdonald|stackoverflow/i,
  firsthand: /uptimearchitect\.com|github\.com\/pyaroslav/i,
}
const urls = (t) => [...String(t ?? '').matchAll(/https?:\/\/[^\s)\]>"'`]+/g)].map((m) => m[0])
const cited = (t) => Object.fromEntries(Object.entries(DOMAINS).map(([k, re]) => [k, urls(t).some((u) => re.test(u))]))

// deterministic shuffle per question so reruns are stable
const seeded = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296 }
const LABELS = ['W', 'X', 'Y', 'Z']

const RUBRIC = readFileSync(join(here, 'grade.md'), 'utf8')
const out = []
for (const q of questions) {
  const runs = CONDS.map((c) => {
    const f = join(dir, `${q.id}.${c}.json`)
    if (!existsSync(f)) return null
    const r = JSON.parse(readFileSync(f, 'utf8'))
    return {cond: c, text: r.result ?? '(no answer)', meta: r.meta}
  }).filter(Boolean)
  if (!runs.length) continue
  const rnd = seeded(q.id)
  const order = runs.map((r) => [rnd(), r]).sort((a, b) => a[0] - b[0]).map((x) => x[1])
  order.forEach((r, i) => (r.label = LABELS[i]))
  const prompt = `You are a strict, blind grader for an Oracle-to-Azure migration Q&A evaluation. You do not know which system produced which answer. Judge only against the expected verdict below; do not reward length or style. Do not use tools.

${RUBRIC}

QUESTION (${q.id}, type=${q.type}):
${q.q}

EXPECTED VERDICT:
${q.expected}

${order.map((r) => `===== ANSWER ${r.label} =====\n${r.text}`).join('\n\n')}

Return ONLY a JSON object, no prose, of the form:
{${order.map((r) => `"${r.label}": {"verdict": 0|1, "grounded": 0|1, "refusal": 0|1|null, "note": "<12 words>"}`).join(', ')}}
Use "refusal": null unless the question type is refusal.`
  const r = runAgent(['-p', prompt, '--model', process.env.GRADER_MODEL ?? 'opus', '--strict-mcp-config', '--mcp-config', join(here, '..', 'mcp', 'none.json'), '--disallowedTools', 'Bash,Read,Edit,Write,Glob,Grep,WebFetch,WebSearch,Task,NotebookEdit', '--max-turns', '1', '--output-format', 'json'])
  let scores = {}
  try { const txt = JSON.parse(r.stdout).result; scores = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1)) } catch (e) { console.error(`${q.id}: grader parse failed`, (r.stdout || r.stderr).slice(0, 300)) }
  for (const run of order) {
    const c = cited(run.text)
    const need = (q.required_sources ?? [])
    const citeOk = need.length ? need.every((p) => c[p]) : null
    out.push({id: q.id, type: q.type, cond: run.cond, label: run.label, ...(scores[run.label] ?? {}), citations: citeOk === null ? null : citeOk ? 1 : 0, cited: c, urls: urls(run.text).length, turns: run.meta?.num_turns, ms: run.meta?.duration_ms, out_tokens: run.meta?.usage?.output_tokens})
  }
  console.log(q.id, order.map((r) => `${r.cond}:${JSON.stringify(scores[r.label] ?? {}).slice(0, 60)}`).join(' | '))
}
writeFileSync(join(dir, 'grades.json'), JSON.stringify(out, null, 2))

// summary table
const sum = (xs, k) => xs.reduce((s, x) => s + (typeof x[k] === 'number' ? x[k] : 0), 0)
const cnt = (xs, k) => xs.filter((x) => typeof x[k] === 'number').length
const rows = CONDS.map((c) => {
  const xs = out.filter((x) => x.cond === c)
  const med = (k) => { const v = xs.map((x) => x[k]).filter((n) => typeof n === 'number').sort((a, b) => a - b); if (!v.length) return '—'; const m = v.length >> 1; return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2 }
  return `| ${c} | ${sum(xs, 'verdict')}/${cnt(xs, 'verdict')} | ${sum(xs, 'citations')}/${cnt(xs, 'citations')} | ${sum(xs, 'grounded')}/${cnt(xs, 'grounded')} | ${sum(xs, 'refusal')}/${cnt(xs, 'refusal')} | ${med('turns')} | ${med('ms') === '—' ? '—' : Math.round(med('ms') / 1000) + ' s'} |`
})
const table = ['| condition | verdict correct | required citations | grounded | refused when it should | median turns | median time |', '|---|---|---|---|---|---|---|', ...rows].join('\n')
writeFileSync(join(dir, 'summary.md'), table + '\n')
console.log('\n' + table)
