// Shared runtime for the headless agent CLI. The CLI command and model come from the private env file
// (~/.config/ora2az/env): AGENT_CLI (required), AGENT_MODEL (optional). Nothing vendor-specific is committed.
import {existsSync, readFileSync} from 'node:fs'
import {join} from 'node:path'
import {spawnSync} from 'node:child_process'

export function loadEnv() {
  const f = join(process.env.HOME ?? '', '.config', 'ora2az', 'env')
  if (existsSync(f)) for (const line of readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z_]+)=(.*)$/)
    if (m && m[2]) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '')
  }
}

export function cli() {
  loadEnv()
  const c = process.env.AGENT_CLI
  if (!c) { console.error('AGENT_CLI is not set in ~/.config/ora2az/env'); process.exit(2) }
  return c
}

// Child env without the parent session's own markers (they share the CLI's name as prefix),
// so a run launched from inside an agent session behaves like a fresh one.
export function childEnv() {
  const prefix = cli().toUpperCase()
  // Keep the config-folder pointer (login and settings live there); drop the parent session's markers.
  return Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith(prefix) || k.endsWith('_CONFIG_DIR')))
}

export function runAgent(args, opts = {}) {
  return spawnSync(cli(), args, {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: childEnv(), maxBuffer: 64 * 1024 * 1024, ...opts})
}
