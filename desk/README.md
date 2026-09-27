# Mortician's Desk

A reviewer's desk for the **Legacy Obituaries** public site, built with the
[Sanity App SDK](https://www.sanity.io/docs/app-sdk). It runs inside your
organization's Sanity Dashboard, both in development and when deployed.

## What it does

- **Live list of `oracleFeature` documents**, filterable by review status
  (All / Drafts / Certified). Each row shows the feature name and slug,
  category, the release it was deprecated in, the release it was desupported
  in, whether an `obituary` has been written, and the current review status.
  The list updates in real time as editors work in Studio.
- **Certify / Un-certify.** Each draft row has a Certify button that sets
  `reviewStatus` to `certified` and publishes the document in one
  transaction. Certified rows get an Un-certify button that sets
  `reviewStatus` back to `draft` and publishes that, so the public site's
  `reviewStatus == "certified"` filter drops it. Certify is disabled while a
  feature has no obituary.
- **Header strip** with live counts: total features, certified, drafts, and
  the number of `dispute` documents.

The desk reads the `drafts` perspective, so unpublished drafts and pending
edits appear alongside published documents.

## Setup

Requirements: Node.js 22.12 or later, a Sanity account with access to the
organization that owns the project.

```sh
cp .env.example .env     # fill in SANITY_APP_ORGANIZATION_ID and SANITY_APP_PROJECT_ID
npm install
```

| Variable                      | Used by          | Purpose                                              |
| ----------------------------- | ---------------- | ---------------------------------------------------- |
| `SANITY_APP_ORGANIZATION_ID`  | `sanity.cli.ts`  | Organization that owns the app (dev URL and deploy). |
| `SANITY_APP_PROJECT_ID`       | `src/config.ts`  | Project the desk reads and writes.                   |
| `SANITY_APP_DATASET`          | `src/config.ts`  | Dataset name. Defaults to `production`.              |

Variables prefixed `SANITY_APP_` are inlined into the browser bundle by the
Sanity CLI; keep secrets out of them. The CLI loads `.env` before it reads
`sanity.cli.ts`, which is why the organization id can come from the
environment. `sanity.cli.ts` also fills in defaults for the two optional
runtime variables so every `process.env.SANITY_APP_*` reference has a value
to inline.

## Run locally

```sh
npx sanity login   # once
npm run dev
```

The CLI starts a dev server on port 3333 and prints a Dashboard URL of the
form `https://www.sanity.io/@<org-id>?dev=http://localhost:3333`. Open that
URL and pick the app in the sidebar. The app only renders inside the
Dashboard, which supplies authentication. Use a browser other than Safari
during development; Safari blocks the mixed-content iframe.

## Deploy to the Dashboard

```sh
npm run deploy
```

On the first deploy the CLI asks for an app title (or takes `app.title` from
`sanity.cli.ts`) and writes the new `deployment.appId` into `sanity.cli.ts`.
Commit that change. Later deploys reuse the id. For unattended deploys set
`SANITY_AUTH_TOKEN` to an organization-level robot token with the
"Manage SDK Apps" permission and run
`npx sanity deploy --title "Mortician's Desk"`.

Remove a deployment with `npx sanity undeploy`.

## Type-check

```sh
npm run typecheck
```

## Project layout

```
sanity.cli.ts          CLI config: organizationId (from env), entry, title
src/App.tsx            <SanityApp config fallback> root
src/config.ts          projectId / dataset from SANITY_APP_* env
src/Desk.tsx           page layout, status filter state
src/CountsStrip.tsx    useQuery: totals for the header strip
src/FeatureTable.tsx   useDocuments: handles filtered by reviewStatus
src/FeatureRow.tsx     useDocumentProjection: fields for one row
src/CertifyButton.tsx  useApplyDocumentActions + editDocument + publishDocument
src/desk.css           plain CSS, light/dark via prefers-color-scheme
```

## Schema expectations

Document type `oracleFeature` with `name` (string), `slug` (slug), `category`
(string), `deprecatedIn` and `desupportedIn` (strings), `reviewStatus`
(`"draft" | "certified"`), and `obituary` (Portable Text array). Document
type `dispute` is only counted.
