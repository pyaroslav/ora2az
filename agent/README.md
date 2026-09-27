# agent/ — Path One: the migration advisor

- `persona.md` — the agent: persona, procedure, answer rules. Passed as the system prompt; tools are restricted to the Sanity Context MCP tools.
- `.mcp.json`, `mcp/*.json` — Sanity Context endpoints (GROQ mode `ora2az-groq`, Knowledge Base mode `ora2az-kb`). Secrets come from env.
- `bin/ora2az` — `ora2az ask "…" [--mcp none|groq|groq+kb]` runs the agent headless and prints the answer, turns and time.
- `lib/runtime.mjs` — launches the headless agent CLI named in `AGENT_CLI`.
- `eval/` — held-out questions, rubric, runner, BM25 baseline, blind grader, frozen results (`RESULTS.md`).

Env (in `~/.config/ora2az/env`, never committed): `SANITY_ORG_ID`, `SANITY_ORG_TOKEN` (org token, Context Viewer), `AGENT_CLI` (a headless agent CLI that supports `-p`, `--mcp-config`, `--strict-mcp-config`, `--system-prompt-file`, `--allowedTools`, `--output-format json`), optional `AGENT_MODEL`.
