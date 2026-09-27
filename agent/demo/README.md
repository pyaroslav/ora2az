# First live answer (2026-09-26)

`./bin/ora2az ask "We are on Oracle 19c and use DBMS_JOB for nightly batches. Moving to Azure SQL Managed Instance — what happens to those jobs?" --mcp groq`

Result: 5 turns, 32 s, GROQ endpoint only. Verdict partial fidelity to SQL Server Agent on MI; scoped to 19c; surfaced the ORA-27486 / CREATE JOB caveat, transactional-submit caveat, Agent step limits; presented the "Did DBMS_JOB stop working in 19c?" dispute with both claims and the resolution; every claim cited (Microsoft Learn, ORACLE-BASE, Mike Dietrich, Connor McDonald, Oracle 19c reference). Session id 47923393-52ca-4f73-9787-afb73c9d9bb8.
