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
| groq+kb | 17/18 | 12/16 | 18/18 | 2/2 | 7 | 34 s |

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


