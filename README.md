# ora2az — an Oracle → Azure migration knowledge graph on Sanity

A structured, sourced graph of how Oracle Database features map to Azure, and two things built on it for the [DEV Sanity Challenge](https://dev.to/challenges/sanity-2026-09-16):

| | What | Try it |
|---|---|---|
| **Path One** | A migration-advisor agent that answers only from the graph, through two Sanity Context MCP endpoints, with a four-way eval | [The Coroner's Reports](https://ora2az.vercel.app/coroner): every eval answer, with the queries it ran. No install. |
| **Path Two** | *The Legacy Obituaries*: an obituary for every Oracle feature that didn't survive the move to Azure | [ora2az.vercel.app](https://ora2az.vercel.app) |

**Sanity project** `udyjvgsk` · dataset `production` (public; query it anonymously, e.g. [all disputes](https://udyjvgsk.api.sanity.io/v2026-09-01/data/query/production?query=*%5B_type%3D%3D%22dispute%22%5D%7Btitle%2Cresolution%7D)). Studio at https://ora2az.sanity.studio needs a Sanity login.

## The result in one table

18 held-out questions, graded blind ([method and caveats](agent/eval/RESULTS.md)):

| Condition | Verdict correct | Cited every required publisher | Grounded |
|---|---|---|---|
| Model alone | 10/18 | 11/16 | 0/18 |
| Keyword search (BM25) over the same documents | 14/18 | **4/16** | 16/18 |
| **Sanity Context, GROQ** | **17/18** | **12/16** | **18/18** |
| Sanity Context, GROQ + Knowledge Base | 17/18 | 12/16 | 18/18 |

Keyword search finds the facts but not their sources: citations live on `source` documents that a flat index never joins to the claim.

## What's in the graph

446 documents from public sources only (Oracle documentation, Microsoft Learn, community tool docs, and the author's public blog and labs):

`oracleFeature` 50 · `azureTarget` 21 · `mapping` 101 (with a fidelity grade: exact / partial / workaround / none) · `caveat` 88 (scoped to Oracle versions, editions, Azure tiers, each with one evidence source) · `dispute` 5 (two caveats whose sources disagree, and the resolution) · `source` 155 · `glossary` 16 · `pattern` 10.

## Repository map

| Folder | Contents |
|---|---|
| [`studio/`](studio) | Sanity Studio and the schema ([`schemaTypes/`](studio/schemaTypes)) |
| [`content/`](content) | The dataset as YAML, the seed and validate scripts, the obituary drafting script (Agent Actions), and [dataset tests](content/test/dataset.test.mjs) |
| [`agent/`](agent) | Path One: the agent's rules ([`persona.md`](agent/persona.md)), MCP endpoint config, the `ora2az` CLI, and [`eval/`](agent/eval) (questions, runner, BM25 baseline, blind graders, frozen results) |
| [`app/`](app) | Path Two: the Next.js site, including the Coroner's Reports |
| [`desk/`](desk) | Mortician's Desk, a Sanity App SDK app where an editor certifies obituaries |
| [`workflows/`](workflows) | The `notice-lifecycle` Sanity Workflows definition: drafted → fact-checked → certified, with a fact-check script and tests |
| [`docs/build-log.md`](docs/build-log.md) | Session-by-session build log: what was asked, what broke, how it was fixed |

## Quick start

Read-only checks need nothing but Node 22:

```sh
git clone https://github.com/pyaroslav/ora2az && cd ora2az
cd content && npm ci && npm test           # 14 assertions against the public dataset
cd ../workflows && npm ci && npm test      # 5 workflow bench tests (no network)
cd ../app && npm ci && NEXT_PUBLIC_SANITY_PROJECT_ID=udyjvgsk npm run dev   # the site, locally
```

Running the agent yourself needs a Sanity organization token with the *Context Viewer* role for the two endpoints, and a headless agent CLI. Put `SANITY_ORG_ID`, `SANITY_ORG_TOKEN` and `AGENT_CLI` in `~/.config/ora2az/env`, then:

```sh
cd agent && ./bin/ora2az ask "Is Oracle Streams still an option for replicating to Azure?"
```

See [`agent/README.md`](agent/README.md) for the flags the CLI needs, and [`workflows/README.md`](workflows/README.md) for deploying the workflow.

License: MIT.
