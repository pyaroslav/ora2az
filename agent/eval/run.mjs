#!/usr/bin/env node
// Runs every question in questions.yaml under the requested conditions and stores raw JSON per run.
// Usage: node eval/run.mjs --conditions none,bm25,groq,groq+kb [--only q01,q02] [--out eval/results/2026-09-30]
// Conditions:
//   none     — plain persona, no tools (what the model "knows")
//   bm25     — plain persona, no tools, top-k passages from the flattened public dataset pasted into the prompt
//   groq     — migration-advisor agent, GROQ endpoint only
//   groq+kb  — migration-advisor agent, GROQ + Knowledge Base endpoints
import {runAgent, loadEnv} from '../lib/runtime.mjs'
import {mkdirSync, readFileSync, writeFileSync, existsSync} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {parse} from 'yaml'
import {bm25Passages} from './bm25.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const argv = process.argv.slice(2)
const opt = (n, d) => { const i = argv.indexOf(n); return i < 0 ? d : argv[i + 1] }
const conditions = opt('--conditions', 'none,bm25,groq,groq+kb').split(',')
const only = opt('--only', '')?.split(',').filter(Boolean)
const out = opt('--out', join(here, 'results', new Date().toISOString().slice(0, 10)))
const maxTurns = opt('--max-turns', '12')
mkdirSync(out, {recursive: true})

loadEnv()

const questions = parse(readFileSync(join(here, 'questions.yaml'), 'utf8')).filter((q) => !only.length || only.includes(q.id))
const PLAIN = 'You are an experienced Oracle-to-Azure migration consultant. Answer the question directly and concretely from your own knowledge. Cite sources with URLs if you can. Be concise: a verdict line, then the key facts.'
const TOOLS = {
  groq: ['mcp__sanity-groq__initial_context', 'mcp__sanity-groq__schema_explorer', 'mcp__sanity-groq__groq_query', 'mcp__sanity-groq__array_field_reader'],
}
TOOLS['groq+kb'] = [...TOOLS.groq, 'mcp__sanity-kb__initial_context', 'mcp__sanity-kb__knowledge_base_read']
const DISALLOW = 'Bash,Read,Edit,Write,Glob,Grep,WebFetch,WebSearch,Task,NotebookEdit'

function runOnce(prompt, cond) {
  const args = ['-p', prompt, '--permission-mode', 'dontAsk', '--disallowedTools', DISALLOW, '--max-turns', maxTurns, '--output-format', 'json', '--strict-mcp-config']
  if (cond === 'none' || cond === 'bm25') {
    args.push('--mcp-config', join(root, 'mcp', 'none.json'), '--system-prompt', PLAIN, '--max-turns', '1')
  } else {
    args.push('--system-prompt-file', join(root, 'persona.md'), '--model', process.env.AGENT_MODEL ?? 'sonnet', '--mcp-config', join(root, 'mcp', `${cond}.json`), '--allowedTools', TOOLS[cond].join(','))
  }
  const t0 = Date.now()
  const r = runAgent(args, {cwd: root})
  let parsed = null
  try { parsed = JSON.parse(r.stdout) } catch {}
  return {cond, duration_ms: Date.now() - t0, exit: r.status, stderr: (r.stderr || '').slice(0, 2000), raw: parsed, stdout: parsed ? undefined : r.stdout.slice(0, 4000)}
}

const summary = []
for (const q of questions) {
  for (const cond of conditions) {
    const file = join(out, `${q.id}.${cond}.json`)
    if (existsSync(file)) { console.log(`skip ${q.id} ${cond} (exists)`); summary.push(JSON.parse(readFileSync(file, 'utf8')).meta); continue }
    let prompt = q.q
    let passages
    if (cond === 'bm25') {
      passages = await bm25Passages(q.q, 8)
      prompt = `${q.q}\n\nUse ONLY the following reference passages. If they do not answer the question, say so.\n\n${passages.map((p, i) => `[${i + 1}] (${p.id}) ${p.text}`).join('\n\n')}`
    }
    process.stdout.write(`${q.id} ${cond} … `)
    const r = runOnce(prompt, cond)
    const meta = {id: q.id, type: q.type, cond, num_turns: r.raw?.num_turns, duration_ms: r.duration_ms, session_id: r.raw?.session_id, usage: r.raw?.usage, is_error: r.raw?.is_error, exit: r.exit}
    writeFileSync(file, JSON.stringify({meta, question: q, passages, result: r.raw?.result, stderr: r.stderr, stdout: r.stdout}, null, 2))
    summary.push(meta)
    console.log(`turns ${meta.num_turns ?? '?'} · ${(r.duration_ms / 1000).toFixed(0)}s${r.raw?.is_error ? ' · ERROR' : ''}`)
  }
}
writeFileSync(join(out, 'summary.json'), JSON.stringify(summary, null, 2))
console.log(`\nwrote ${summary.length} runs to ${out}`)
