# Workflows: the obituary notice lifecycle

A Sanity Workflows definition (`notice-lifecycle`) that tracks each Legacy Obituary from draft to certified. It runs on `@sanity/workflow-engine` and `@sanity/workflow-cli` 0.35.0, which are early access. It is deployed to project `udyjvgsk`, dataset `production`, under deployment and tag `production`.

The workflow does not replace the desk. The desk still does the content write: it sets `reviewStatus` and publishes. The workflow adds three things on top.

- **An automated fact-check gate.** A notice cannot reach `fact-checked` until the fact-check script passes it.
- **A recorded history.** Every stage, action, operation and actor is stored on the instance.
- **A freeze on certified text.** A guard freezes the obituary while the notice sits in `certified`.

## Stages

```
                 fact-check/fail (note; stays here, activity stays open)
                 +------+
                 |      v
  start ----> [ drafted ] --fact-check/pass--> [ fact-checked ] --certification/certify--> [ certified ]
                 ^   ^                              |                                         |
                 |   +---certification/send-back----+                                         |
                 +--------------------------------retraction/retract--------------------------+

  certified: guard "freeze-obituary" on the feature (draft edits and publishes)
             allows a write only if it leaves `obituary` unchanged.
```

| Stage | Activity | Actions | Fired by |
| --- | --- | --- | --- |
| `drafted` | `fact-check` | `pass` (note), `fail` (note) | `scripts/fact-check.mjs` |
| `fact-checked` | `certification` | `certify`, `send-back` (reason) | an editor: the desk Certify button, or the CLI |
| `certified` | `retraction` | `retract` (reason) | an editor: the desk Un-certify button, or the CLI |

- **The subject** is the published `oracleFeature` document. The engine rejects draft ids as subjects. The fact check reads that document's draft, where the pending obituary lives.
- **One open notice per feature.** A `singleSubject` start requirement blocks a second in-flight instance for the same feature.
- **`fail` leaves the activity open.** The instance stays in `drafted` with `factCheck = "failed"` and the note, and the next run of the script can pass it.
- **`certified` is deliberately not terminal.** A terminal stage completes the instance, and a stage's guards live only while an instance occupies it. Keeping `retract` available keeps the freeze in force.
- **Routing reads fields.** Decisions are written to the `decision` field and transitions read it. `pass` clears an old decision so a returning notice is not bounced straight back.

## Files

- `definitions/notice-lifecycle.ts` holds the definition.
- `sanity.workflow.ts` binds it to `udyjvgsk.production`, tag `production`, and acknowledges reader model 10, which a required subject needs.
- `scripts/fact-check.mjs` runs the fact check and fires `pass` or `fail`.
- `test/notice-lifecycle.test.ts` covers every path with the in-memory test bench: fail then pass, certify with the guard denying an obituary edit and allowing others, send-back, and retract then re-certify.
- `../desk/src/workflow.ts` mirrors desk certification onto the workflow. See "Desk integration" below.

## Deploy

```sh
cd workflows
npm install
npm test                                        # in-memory bench, no network
npx sanity-workflows deploy --check             # validate offline
npx sanity-workflows deploy --deployment production --dry-run
npx sanity-workflows deploy --deployment production
```

The CLI authenticates with your `sanity login` session, or with `SANITY_AUTH_TOKEN` in CI.

## Start a notice and run the fact check

Start an instance with the published feature id:

```sh
npx sanity-workflows start notice-lifecycle --deployment production \
  --field subject='{"id":"dataset:udyjvgsk:production:feature_xmltype","type":"oracleFeature"}'
```

Then run the fact check:

```sh
node scripts/fact-check.mjs            # every in-flight notice waiting in `drafted`
node scripts/fact-check.mjs --dry      # report only
node scripts/fact-check.mjs production.wf-instance.2e9f8b706af0
```

The rule is that every Oracle release and every ORA-nnnnn code in the obituary must appear in the feature's own data. Releases are names like 12.2, 19c or 26ai. The feature's own data is its name, release fields, summary and in-Oracle replacement. It also includes its mappings' rationale and steps, the caveats on those mappings, and the disputes involving them. The script reads with GROQ and fires the action through `sanity-workflows fire-action`, so the action is attributed to the logged-in user. It reads drafts, so it needs `SANITY_WRITE_TOKEN` or `SANITY_READ_TOKEN` from the environment or `~/.config/ora2az/env`.

The same rule was run in dry mode against the 47 published certified obituaries, and all 47 passed.

## Certify

Certification is a human act. In the desk, Certify sets `reviewStatus` to certified and publishes. It then fires `certification/certify` on the feature's open instance, but only when that instance is in `fact-checked`. Un-certify fires `retraction/retract` when the instance is in `certified`. From a terminal, run:

```sh
npx sanity-workflows fire-action <instanceId>                                   # list what can be fired
npx sanity-workflows fire-action <instanceId> --activity certification --action certify
npx sanity-workflows fire-action <instanceId> --activity certification --action send-back --param reason='"tone"'
```

The order matters. Publish first, then fire `certify`. Entering `certified` deploys the freeze guard, and the publish that carries the new obituary would change `obituary`.

## Current state (2026-09-27, later)

Two notices have gone the whole way, and one front-page notice waits in the queue:

```
$ npx sanity-workflows list
instance                              workflow           tag          stage          status
production.wf-instance.c87d984a87de   notice-lifecycle   production   fact-checked   in-flight   (feature_exp-utility, on the front page)
production.wf-instance.2e9f8b706af0   notice-lifecycle   production   certified      in-flight   (feature_xmltype)
production.wf-instance.1739bb2d4543   notice-lifecycle   production   certified      in-flight   (feature_vector-datatype)
production.wf-instance.3c0dea974deb   notice-lifecycle   production   fact-checked   in-flight   (feature_flashback-query)
```

- `feature_xmltype`: draft published as certified, then `certify` fired, so the instance sits in `certified` with the obituary freeze in force.
- `feature_vector-datatype`: draft published as certified, then `certify` fired (2026-09-29).
- `feature_exp-utility` (desupported in 26ai, one of the 28 front-page notices): obituary moved back to draft, instance started, fact check PASS (mentions 11.2 and 26ai, both in its data), waiting for a human in `fact-checked`.
- The instance's `certified` stage is not terminal on purpose, so `retract` stays available and the guard stays live.

## Desk integration

`desk/src/workflow.ts` builds an engine from the App SDK client with `createEngine`. It finds the feature's open instance with `engine.instancesForDocument` and fires `certify` or `retract` after the desk's publish. This adds one dependency, `@sanity/workflow-engine` 0.35.0. It type-checks with `npx tsc --noEmit`. The live desk has been redeployed with this change (2026-09-27), so certifying in the desk also fires `certify`, and un-certifying fires `retract`.

The docs also describe a richer route: `@sanity/workflow-sdk` with `useWorkflowSession` renders the stage, activities and action verdicts live in an App SDK app. That needs `@sanity/workflow-react`, `@sanity/workflow-components`, `@sanity/ui` and `styled-components`, so it was left out.

## Limitations

- **Early access.** This is on 0.x packages, and a minor version can break the API. The packages are pinned to exactly 0.35.0. Stored instances are pinned to definition v1, so redeploying creates v2 and leaves these instances on v1.
- **Nothing is enforced against a direct writer.** The docs say every engine check is advisory, and the Content Lake does not enforce guard documents yet. The freeze is honored by the engine and by the Studio Workflows plugin, which this project does not install. The App SDK desk does not read guards, so it can still change a frozen obituary. The real hard boundary is dataset access control.
- **The gate is not a lock on publishing.** Nothing stops someone publishing an obituary that never passed the fact check. The workflow records whether it did.
- **The workflow is not wired to all 47 certified obituaries.** They were certified before it existed and have no instances.
- **Nothing runs in the background.** The engine is a library. The fact check runs when someone runs the script. No Sanity Function drains effects or ticks instances, and this definition declares no effects or clock conditions, so none is needed.
- **The fact check is narrow.** It checks release names and ORA- codes only, not other claims. It does not recognise forms like "12cR2" or "Release 2".
- **Workflow state lives in the content dataset.** Its ids contain a dot, so public, unauthenticated queries do not return them. A public count of `sanity.workflow*` documents returns 0.
- **Definition sharing was on**, which is the CLI default. Deploying sent the definition, which is public in this repo anyway, to Sanity. Use `--no-share-defs` to opt out.
