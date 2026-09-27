# Content format (source of truth for the dataset)

One YAML file per document type in `content/data/`. Each file is a list of documents. `seed.mjs` converts
shorthand to Sanity documents and upserts with `createOrReplace` (deterministic `_id`s ⇒ idempotent).

## Conventions
- `_id` prefixes: `source.` · `feature.` · `target.` · `mapping.` · `caveat.` · `dispute.` · `glossary.` · `pattern.`
  Slug part: lowercase, digits, hyphens only.
- **References** are written as plain id strings (`oracleFeature: feature.dbms-job`) or lists of id strings
  (`sources: [source.oracle-upgrd-26-desupports]`). The seed script turns them into `{_type: reference, _ref}`.
- **Portable Text** fields (`summary`, `obituary`, `steps`, `approach`) are written as Markdown-ish plain text:
  paragraphs separated by blank lines; `- ` lines become bullet blocks. No inline formatting is required.
- Dates: `YYYY-MM-DD`. Oracle versions: one of `11.2, 12.1, 12.2, 18c, 19c, 21c, 23ai, 26ai` (or `pre-11.2` for introducedIn).
- Every `feature`, `target`, `mapping`, `glossary`, `pattern` has `sources: [...]` (≥1). Every `caveat` has `evidence: source.<id>`.
- **Paraphrase.** Never paste sentences from Oracle or Microsoft docs. Numbers and names may be exact.
- No brand, client, or product names beyond Oracle/Microsoft/Azure/community tool names.

## Field reference

### sources.*.yaml → `source`
```yaml
- _id: source.ms-ssma-type-mapping
  title: "SSMA for Oracle: Project Settings (Type Mapping)"
  publisher: microsoft            # oracle | microsoft | community | firsthand
  url: https://learn.microsoft.com/en-us/sql/ssma/oracle/project-settings-type-mapping-oracletosql
  docVersion: "SSMA, page updated 2026-08"   # optional
  retrievedAt: 2026-09-26
  note: "Default column type mapping table."  # optional
```

### features.yaml → `oracleFeature`
```yaml
- _id: feature.dbms-job
  name: DBMS_JOB
  slug: dbms-job
  category: scheduler   # datatype|plsql|sql|storage|scheduler|security|ha|replication|integration|search|tooling|platform|nls|performance
  introducedIn: pre-11.2
  deprecatedIn: 19c          # omit if not deprecated
  desupportedIn:             # omit if not desupported
  oracleReplacement: DBMS_SCHEDULER   # optional
  summary: |
    Paragraph one.

    Paragraph two.
  sources: [source.oracle-upgrd-19-deprecated]
```

### targets.yaml → `azureTarget`
```yaml
- _id: target.azure-sql-mi
  name: Azure SQL Managed Instance
  slug: azure-sql-mi
  service: azure-sql-mi   # azure-sql-db|azure-sql-mi|azure-pg-flex|oracle-db-at-azure|oracle-on-azure-vm|blob-adls|data-factory|synapse|fabric|service-bus|functions|elastic-jobs|ai-search|monitor|key-vault|migration-tool|other
  tierNotes: "General Purpose vs Business Critical …"   # optional
  summary: |
    …
  sources: [source.ms-sqlmi-overview]
```

### mappings.yaml → `mapping`
```yaml
- _id: mapping.dbms-job--azure-sql-mi
  oracleFeature: feature.dbms-job
  azureTarget: target.azure-sql-mi
  fidelity: partial      # exact|partial|workaround|none
  effort: M              # S|M|L
  rationale: "Why this fidelity."
  steps: |
    - Step one
    - Step two
  appliesToOracleVersions: [19c, 21c, 23ai]
  sources: [source.ms-sqlmi-agent]
```

### caveats.yaml → `caveat`
```yaml
- _id: caveat.dbms-job-mi-agent-schedules
  mapping: mapping.dbms-job--azure-sql-mi
  severity: major        # blocker|major|minor
  statement: "One precise, checkable sentence or two."
  appliesTo:
    oracleVersions: [19c, 21c]
    editions: [EE, SE2]          # SE2|EE|XE/Free|Autonomous|Exadata
    azureTiers: ["General Purpose"]
  evidence: source.ms-sqlmi-agent
  firsthand: false
```

### disputes.yaml → `dispute`
```yaml
- _id: dispute.number-unconstrained-float-vs-numeric
  title: "Unconstrained NUMBER: float or numeric?"
  claimA: caveat.number-ssma-float53
  claimB: caveat.number-ora2pg-numeric
  whatDisagrees: "…"
  resolution: "…"
  resolvedBy: source.…   # optional
```

### glossary.yaml → `glossary`
```yaml
- _id: glossary.desupported
  term: Desupported
  definition: "…"
  alsoKnownAs: [removed]
  sources: [source.oracle-upgrd-26-desupports]
```

### patterns.yaml → `pattern`   (Knowledge Base material — prose)
```yaml
- _id: pattern.scheduler-jobs-to-elastic-jobs
  title: "Move DBMS_SCHEDULER jobs to Elastic Jobs or SQL Agent"
  problem: "…"
  approach: |
    Paragraphs / bullets.
  whenNotTo: "…"
  relatedMappings: [mapping.dbms-scheduler--azure-sql-mi]
  sources: [source.…]
```

## Canonical slugs (shared by all authors so references line up)

Features (`feature.<slug>`): see `content/SLUGS.md`. Targets (`target.<slug>`): see `content/SLUGS.md`.
