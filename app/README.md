# app/ — Legacy Obituaries (Path Two)

Next.js App Router site that prints an obituary for every Oracle feature that Oracle has deprecated or desupported, or that has no clean Azure equivalent, straight from the ora2az Sanity dataset.

```
cp .env.example .env.local   # NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET
npm run dev
```
Routes: `/` roster · `/obituary/[slug]` · `/about`.
