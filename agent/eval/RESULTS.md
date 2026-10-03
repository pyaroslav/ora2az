# EVAL — does the structure matter?

Conditions per question: **none** (no tools) · **BM25** (flattened dataset, top-k passages, no tools) · **GROQ** (Context GROQ endpoint) · **GROQ+KB** (both endpoints).
Rubric (blind): (a) verdict correct · (b) required source IDs cited · (c) no claims beyond retrieved evidence.
Report turns and tokens per condition (no dollar cost: subscription).

## Questions (held out; written before content was final)

18 questions in `ora2az/agent/eval/questions.yaml`: 7 fact · 4 version-scope · 2 dispute · 3 how-to · 2 refusal. One expected answer (q02, unconstrained NUMBER) was corrected on 2026-09-26 after research showed Ora2Pg's default is bigint, not numeric; the correction is marked inline and the question text is unchanged.

## Results — run of 2026-09-27 (frozen: `agent/eval/results/2026-09-27/`)

18 held-out questions × 4 conditions = 72 runs, all completed. Graded blind by the strongest available model through the same headless CLI: each question's four answers shuffled and relabelled W/X/Y/Z. Citations are checked deterministically by URL domain against the question's required publishers (16 questions require citations; the 2 refusal questions do not).

| condition | verdict correct | required citations | grounded | refused when it should | median turns | median time |
|---|---|---|---|---|---|---|
| none | 10/18 | 11/16 | 0/18 | 0/2 | 1 | 22 s |
| bm25 | 14/18 | 4/16 | 16/18 | 2/2 | 1 | 10 s |
| groq | 17/18 | 12/16 | 18/18 | 2/2 | 5 | 28 s |
| groq+kb | 17/18 | 12/16 | 18/18 | 2/2 | 7 | 33 s |

## Run settings

- Runner: `node eval/run.mjs --conditions … --max-turns 14` (the runner's default is 12; this run passed 14 explicitly). The most turns any run used was 10.
- Models: the two Sanity Context conditions ran on the *smaller* model (`--model` alias passed by `lib/runtime.mjs` via `AGENT_MODEL`); the two baselines ran without a `--model` flag and so on the CLI's default, the *larger* model. The grader ran on the larger model. Exact model ids were read from each run's session transcript (not committed); the DEV posts name them.
- Medians are true medians (mean of the two middle values for 18 runs).

**Reading it.**
- The graph earns its keep on **grounding**: 18/18 for both Sanity Context conditions vs 0/18 with no tools, and on **verdicts**: 17/18 vs 14/18 for keyword search and 10/18 from memory.
- Keyword search (BM25 over the same 445 documents, one passage per document, references not followed) got the facts it could see but **cited the required publishers on only 4/16 questions**: citations live on `source` documents that a flat index never joins to the claim. That is the structural gap in one number.
- The no-tools baseline "cites" 11/16, but **9 of the 59 distinct URLs it produced from memory do not resolve** (404 / unreachable), and the grader marked every one of its answers ungrounded. Its citation score should be read with that in mind.
- The Knowledge Base adds ~2 turns and ~6 s at the median and did not change the score on this question set; its value shows on how-to prose (see `agent/demo`), which only 3 of the 18 questions test.

## Schema defects the eval exposed

1. **q04 (empty string = NULL).** Every retrieval condition answered "no Azure target keeps this behaviour" and only hedged on Oracle Database@Azure. Cause: the graph had no `mapping` from `feature.empty-string-null` to `target.oracle-db-at-azure`, so the grounded agent correctly declined to assert it. Fix: added `mapping.empty-string-null--oracle-db-at-azure` (fidelity exact). Re-run of q04 only, in `agent/eval/results/2026-09-27-q04-after-fix/`: all four conditions correct, both Sanity Context conditions cite the new mapping's sources. The frozen table above is **not** updated with the fix.

## Honest caveats

- One run per question per condition; no variance estimate.
- Questions and expected verdicts were written by the dataset's author (me) before the content was finished; one expectation (q02) was corrected after research, noted inline.
- The grader is from the same model family as the answering model. Mitigations: blind shuffled labels, a fixed rubric, and a deterministic citation check that does not use the grader.
- No dollar cost is reported: runs used a flat-rate subscription, so only turns and time are measured.
- The Knowledge Base Issues tab flagged 2 "conflicts" on build; both are gaps (one entry states a desupport release, a neighbouring entry mentions the feature without it), not contradictions.

## After the freeze (2026-09-27, evening)

Everything below ran after the frozen table above and does not change it. Same runner settings (`--max-turns 14`), same models per condition, same blind grader. These runs show the CLI calling its built-in `ToolSearch` to load the MCP tool definitions before the first Sanity call; the frozen runs made no non-MCP calls.

**q13 re-run after an agent-rule fix.** In the frozen run, the GROQ + Knowledge Base agent read Knowledge Base prose about scheduler jobs, never queried the `dispute` documents, and dropped one side of the dispute. Fix: `persona.md` now says to query disputes before reading Knowledge Base prose. Re-run (`results/2026-09-27-q13-after-fix/`, baselines copied from the frozen run for the blind grade):

| Condition | Verdict | Grounded | Cited |
|---|---|---|---|
| GROQ | 1 | 1 | 1 |
| GROQ + KB | 1 | 1 | 1 (was 0) |

**Two how-to questions added to test the Knowledge Base** (`q19` method selection for a cross-endian move to Oracle Database@Azure, `q20` switchover vs failover at cutover; `results/2026-09-27-additions/`):

| Condition | q19 verdict / grounded / cited | q20 verdict / grounded / cited |
|---|---|---|
| Model alone | 0 / 0 / 0 | 1 / 0 / 0 |
| Keyword search | 0 / 1 / 0 | 1 / 1 / 1 |
| GROQ | 1 / 1 / **0** | 1 / 1 / 1 |
| GROQ + KB | 1 / 1 / **1** | 1 / 1 / 1 |

On q19 the Knowledge Base agent read the three relevant entries in one `knowledge_base_read` call and cited every required publisher; the GROQ-only agent reached the same verdict by walking `pattern` documents through eight calls and missed the Oracle citation. Two questions are a signal, not a result: the `pattern` documents are also in the dataset, so GROQ can reach the same prose, just less directly.

## Second grader (another vendor), partial

`eval/grade_second.mjs` regrades the frozen answers with `gemini-3.8-flash` (Google free tier), using the same shuffle seed, labels and rubric; citations reuse the deterministic check. Google's free tier allows 20 requests per model per day and returned HTTP 503 (overloaded) on most attempts between 2026-09-28 and 2026-10-03, so the run stopped at q01–q14 (56 answers) at the challenge deadline; it resumes from `results/2026-09-27/grades-second.partial.json`.

| Condition | Verdicts agreed | Grounding agreed | Second grader: verdict correct |
|---|---|---|---|
| Model alone | 11/14 | 3/14 | 12/14 |
| Keyword search | 14/14 | 12/14 | 12/14 |
| GROQ | 14/14 | 14/14 | 13/14 |
| GROQ + KB | 14/14 | 14/14 | 13/14 |

Overall 53/56 verdicts agreed. Every disagreement is on a baseline answer; most are the second grader marking a correct answer from memory as "grounded", which the rubric does not allow without retrieved evidence.
