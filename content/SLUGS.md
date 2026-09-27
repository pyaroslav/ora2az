# Canonical slugs

## Oracle features (`feature.<slug>`) — name — category — status hint
Obituary roster (deprecated / desupported):
- dbms-job — DBMS_JOB package — scheduler — deprecated 12.2 (still functional through 26ai), replacement DBMS_SCHEDULER
- traditional-auditing — Traditional (pre-Unified) Auditing — security — deprecated 21c, desupported 26ai
- non-cdb-architecture — Non-CDB architecture — platform — deprecated 12.1, desupported 21c
- oracle-streams — Oracle Streams — replication — deprecated 12.1, desupported 19c
- oracle-multimedia — Oracle Multimedia — datatype — deprecated 18c, desupported 19c
- exp-utility — Original Export utility (exp) — tooling — deprecated long ago, desupported 26ai
- em-express — EM Database Express — tooling — desupported 26ai
- stored-outlines — Stored outlines — performance — deprecated 11g, terminal in 26ai
- liboramysql — MySQL client library driver (liboramysql) — tooling — deprecated 21c, desupported 26ai
- dotnet-stored-procedures — Oracle Database Extensions for .NET — plsql — desupported 26ai
- data-recovery-advisor — RMAN Data Recovery Advisor — ha — desupported 26ai
- dbua — Database Upgrade Assistant (DBUA) — tooling — desupported 26ai
- utl-file-dir — UTL_FILE_DIR initialization parameter — plsql — desupported 18c
- oracle-change-data-capture — Oracle Change Data Capture (CDC) — replication — desupported 12.1
- advanced-replication — Oracle Advanced Replication — replication — desupported 12.2
- dbms-xmlquery — DBMS_XMLQUERY / DBMS_XMLSAVE — plsql — deprecated 18c, desupported 21c
- oracle-wallet-manager — Oracle Wallet Manager (OWM) — security — desupported 26ai
- tls-1-0-1-1 — TLS 1.0 / 1.1 network encryption — security — desupported 26ai

Living features that are hard to map:
- dbms-scheduler — DBMS_SCHEDULER — scheduler
- autonomous-transactions — PRAGMA AUTONOMOUS_TRANSACTION — plsql
- utl-file — UTL_FILE — plsql
- materialized-views-fast-refresh — Fast-refresh materialized views — performance
- vpd — Virtual Private Database (DBMS_RLS) — security
- sequences — Sequences — sql
- rowid — ROWID / UROWID — datatype
- number-unconstrained — NUMBER without precision/scale — datatype
- date-with-time — DATE (includes time) — datatype
- varchar2-byte-semantics — VARCHAR2 byte vs char length semantics — datatype
- empty-string-null — Empty string equals NULL — sql
- connect-by — CONNECT BY hierarchical queries — sql
- database-links — Database links — integration
- external-tables — External tables — storage
- advanced-queuing — Oracle Advanced Queuing (AQ) — integration
- oracle-text — Oracle Text — search
- spatial-sdo-geometry — Oracle Spatial SDO_GEOMETRY — datatype
- xmltype — XMLType — datatype
- before-row-triggers — BEFORE row triggers — plsql
- packages — PL/SQL packages — plsql
- partitioning — Table partitioning — storage
- rac — Real Application Clusters — ha
- data-guard — Data Guard — ha
- tde — Transparent Data Encryption — security
- flashback-query — Flashback Query (AS OF) — sql
- boolean-23ai — SQL BOOLEAN datatype (23ai) — datatype
- json-duality-views — JSON Relational Duality Views (23ai) — datatype
- vector-datatype — VECTOR datatype / AI Vector Search (23ai) — datatype
- character-set — Database character set (NLS) — nls
- data-pump — Data Pump (expdp/impdp) — tooling
- rman — RMAN backup and recovery — ha
- edition-based-redefinition — Edition-Based Redefinition — plsql

## Azure targets (`target.<slug>`) — name — service
- azure-sql-db — Azure SQL Database — azure-sql-db
- azure-sql-mi — Azure SQL Managed Instance — azure-sql-mi
- azure-pg-flex — Azure Database for PostgreSQL Flexible Server — azure-pg-flex
- oracle-db-at-azure — Oracle Database@Azure — oracle-db-at-azure
- oracle-on-azure-vm — Oracle Database on Azure Virtual Machines — oracle-on-azure-vm
- blob-adls — Azure Blob Storage / Data Lake Storage Gen2 — blob-adls
- data-factory — Azure Data Factory — data-factory
- synapse — Azure Synapse Analytics — synapse
- fabric — Microsoft Fabric — fabric
- service-bus — Azure Service Bus — service-bus
- functions — Azure Functions — functions
- elastic-jobs — Azure SQL Elastic Jobs — elastic-jobs
- sql-agent-mi — SQL Server Agent (on SQL Managed Instance) — azure-sql-mi
- pg-cron — pg_cron extension (PostgreSQL Flexible Server) — azure-pg-flex
- ai-search — Azure AI Search — ai-search
- azure-sql-auditing — Azure SQL Auditing — azure-sql-db
- pgaudit — pgAudit extension (PostgreSQL Flexible Server) — azure-pg-flex
- key-vault — Azure Key Vault (customer-managed TDE keys) — key-vault
- ssma — SQL Server Migration Assistant for Oracle — migration-tool
- azure-dms — Azure Database Migration Service — migration-tool
- ora2pg — Ora2Pg — migration-tool
