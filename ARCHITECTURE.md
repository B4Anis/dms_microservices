# ENSIA DMS — System Architecture

```
Legend
  ──────►  Synchronous  (HTTP / REST)
  ═══════► Asynchronous (Kafka event)
  · · · ►  Out-of-band  (metrics scrape / background init)
```

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                        CLIENTS                                              │
│                                                                                             │
│          ┌──────────────────────┐              ┌─────────────────────┐                      │
│          │   React SPA (Vite)   │              │  Odoo 15 Web UI     │                      │
│          │   document-management│              │  (ENSIA DMS module) │                      │
│          │   -system/           │              │  :8015              │                      │
│          └──────────┬───────────┘              └────────┬────────────┘                      │
└─────────────────────┼────────────────────────────────── ┼ ───────────────────────────────────┘
                      │  HTTP :8080                        │  HTTP :8069 (internal)
                      ▼                                    ▼
┌─────────────────────────────────┐      ┌─────────────────────────────────────────────────────┐
│         API GATEWAY             │      │              ODOO STACK (separate compose)           │
│         :8080                   │      │                                                     │
│                                 │      │   ┌────────────────┐    ┌───────────────────────┐   │
│  • JWT validation (→ auth-svc)  │      │   │  odoo:15.0     │    │  PostgreSQL 13        │   │
│  • Route rewriting              │      │   │  (ensia_dms    │───►│  odoo15-db            │   │
│  • Load balancing               │      │   │   module)      │    │  (odoo schema)        │   │
└──────┬──────────┬───────────────┘      │   └────────────────┘    └───────────────────────┘   │
       │          │                      └─────────────────────────────────────────────────────┘
       │          │
       │  ┌───────┴──────────────────────────────────────────────────┐
       │  │                   SYNCHRONOUS LAYER                       │
       │  └───────────────────────────────────────────────────────────┘
       │
       ├──────────────────────────────────────────────────────────────────────┐
       │                                                                      │
       ▼                                                                      ▼
┌──────────────────────┐                                          ┌──────────────────────┐
│   AUTH SERVICE       │                                          │  COMMENTS SERVICE    │
│   :8083              │                                          │  :8081               │
│                      │                                          │                      │
│  • Login / register  │                                          │  • POST /comments    │
│  • JWT issue/verify  │                                          │  • GET  /comments/   │
│  • User CRUD         │                                          │    document/{id}     │
└──────────┬───────────┘                                          └──────────┬───────────┘
           │ R/W                                                             │ R/W
           ▼                                                                 ▼
┌──────────────────────┐                                          ┌──────────────────────┐
│  PostgreSQL 15       │                                          │  Cassandra 4.1       │
│  :5433               │                                          │  :9042               │
│  DB: dms             │◄────────────────────────────────────────►│  Keyspace: dms       │
│  Tables:             │  (shared infra; separate logical schemas) │  Table: comments     │
│   users              │                                          │  (partition: doc_id) │
│   documents          │                                          └──────────────────────┘
└──────────────────────┘
           ▲
           │ R/W (documents table)
           │
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                              DOCUMENTS SERVICE  :8082                                    │
│                                                                                          │
│   GET/POST   /api/documents                                                              │
│   GET/PATCH/DELETE  /api/documents/{id}                                                  │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                        Synchronous dependencies                                 │   │
│   │                                                                                 │   │
│   │   ┌──────────────┐          ┌──────────────────────┐                           │   │
│   │   │  Redis 7     │          │  MinIO (S3-compat.)  │                           │   │
│   │   │  :6379       │          │  :9000  API          │                           │   │
│   │   │              │          │  :9001  Console      │                           │   │
│   │   │  Cache TTL   │          │  Bucket: dms-bucket  │                           │   │
│   │   │  60 s        │          │                      │                           │   │
│   │   │  (doc reads) │          │  Stores binary files │                           │   │
│   │   └──────────────┘          └──────────────────────┘                           │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   On document upload ════════════════════════════════════════════════════════════════►  │
│   publishes to Kafka topic: dms.documents.uploaded                                       │
└──────────────────────────────────────────────────────────────────────────────────────────┘
           ║
           ║  ASYNC (Kafka topic: dms.documents.uploaded)
           ║
           ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                         KAFKA (KRaft mode, no Zookeeper)  :9092                         │
│                                                                                          │
│   Topic: dms.documents.uploaded   ──────────────────────────────────────────────────►  │
│   Topic: dms.documents.translated  ◄─────────────────────────────────────────────────  │
│                                                                                          │
│   ┌──────────────────────────────┐                                                       │
│   │  Kafka UI   :8082            │  (browser-based topic/consumer-group inspector)       │
│   └──────────────────────────────┘                                                       │
└──────────────────────────────────────────────────────────────────────────────────────────┘
           ║
           ║  ASYNC (consumed from dms.documents.uploaded)
           ║
           ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            TRANSLATOR SERVICE  (Python)                                  │
│                                                                                          │
│   • Consumes dms.documents.uploaded                                                      │
│   • Calls Google Gemini API to translate content → FR, AR, ES                           │
│   • Reads source file from MinIO ──────────────────────────────────────────────────►    │
│   • Publishes dms.documents.translated  ════════════════════════════════════════════►   │
│     (Documents Service updates PostgreSQL with translated_content_* columns)             │
└──────────────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          OBSERVABILITY  (out-of-band)                                   │
│                                                                                          │
│   Prometheus :9090  · · · ►  postgres-exporter :9187  · · · ►  PostgreSQL               │
│                     · · · ►  (future: service /metrics endpoints)                        │
│                                                                                          │
│   Grafana    :3000  ──────►  Prometheus (datasource)                                    │
│              admin / admin                                                               │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Flow summaries

| Flow | Type | Path |
|------|------|------|
| Login / token issue | **Sync** | Browser → API GW → Auth Service → PostgreSQL |
| Document upload | **Sync** | Browser → API GW → Documents Service → PostgreSQL + MinIO |
| Document read (cached) | **Sync** | Browser → API GW → Documents Service → Redis (hit) |
| Document read (cold) | **Sync** | Browser → API GW → Documents Service → Redis (miss) → PostgreSQL |
| Translation trigger | **Async** | Documents Service ═► Kafka `dms.documents.uploaded` |
| Translation execution | **Async** | Kafka ═► Translator → Gemini API + MinIO ═► Kafka `dms.documents.translated` |
| Translation persistence | **Async** | Kafka `dms.documents.translated` ═► Documents Service → PostgreSQL |
| Comment post / fetch | **Sync** | Browser → API GW → Comments Service → Cassandra |
| ERP document mgmt | **Sync** | Odoo UI → Odoo 15 (`ensia_dms`) → PostgreSQL (odoo schema) |
| Metrics collection | **Out-of-band** | Prometheus scrapes postgres-exporter → Grafana dashboard |

## Port reference

| Service | Host port | Notes |
|---------|-----------|-------|
| API Gateway | 8080 | Single public entry point for DMS |
| Auth Service | 8083 | Also reachable internally by gateway |
| Comments Service | 8081 | Internal only (no direct public route) |
| Documents Service | 8082 | Internal only |
| Odoo 15 | 8015 | Separate compose stack |
| Kafka | 9092 | External; 29092 internal broker |
| Kafka UI | 8082 | Dev tool |
| MinIO API | 9000 | S3-compatible |
| MinIO Console | 9001 | Web UI |
| PostgreSQL (DMS) | 5433 | Mapped from container :5432 |
| PostgreSQL (Odoo) | — | Internal only, no host port |
| Redis | 6379 | |
| Cassandra | 9042 | |
| Prometheus | 9090 | |
| Grafana | 3000 | |
| postgres-exporter | 9187 | |
