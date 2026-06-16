# ENSIA Document Management System

A full-stack, message-driven microservices DMS built as a 4th-year Enterprise Computing project. It handles document upload, storage, async multilingual translation, real-time comments, and integrates with an Odoo 15 ERP.

---

## Architecture

```
React SPA
    │
    ▼
API Gateway (:8080)
    ├── auth-service       (:8083) ── PostgreSQL 15
    ├── documents-service  (:8082) ── PostgreSQL 15 + Redis 7 + MinIO
    └── comments-service   (:8081) ── Cassandra 4.1
                │
              Kafka
                │
        translator-service ──── Google Gemini API
                                (FR / AR / ES)

Odoo 15 ERP (separate stack) ── PostgreSQL 13
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router 7, Tailwind CSS 4, Recharts, Axios |
| API Gateway | Java 8, Spring Cloud Gateway 2021.0.8 |
| Auth Service | Java 8, Spring Boot 2.7.18, JJWT 0.11.5 |
| Documents Service | Java 8, Spring Boot 2.7.18, AWS SDK S3 (MinIO) |
| Comments Service | Java 8, Spring Boot 2.7.18, Spring Data Cassandra |
| Translator Service | Python 3, confluent-kafka 2.3.0, Google Gemini API |
| ERP | Odoo 15 with custom `ensia_dms` module |
| Message Bus | Kafka 7.6.0 (KRaft mode) |
| Object Storage | MinIO (S3-compatible) |
| Cache | Redis 7 (60s TTL) |
| Observability | Prometheus + Grafana + postgres-exporter |
| Testing | Playwright (E2E), k6 (load tests), Python integration tests |
| Deployment | Docker Compose (dev) + Kubernetes manifests (prod) |

---

## Services

### api-gateway (`:8080`)
Spring Cloud Gateway — single entry point, routes requests to downstream services.

### auth-service (`:8083`)
JWT-based authentication and user management backed by PostgreSQL.

### documents-service (`:8082`)
Handles document CRUD, uploads files to MinIO (S3), caches reads in Redis, and publishes `dms.documents.uploaded` events to Kafka.

### comments-service (`:8081`)
Stores and retrieves comments using Cassandra — optimized for high-volume writes with a composite partition key on `docId`.

### translator-service (async)
Kafka consumer that listens on `dms.documents.uploaded`, calls Google Gemini API to translate content into French, Arabic, and Spanish, then publishes results back via `dms.documents.translated`.

### frontend (`:3000` dev / `:80` prod)
React SPA with role-based views:
- **User** — document library, upload wizard, multilingual viewer, comments
- **Admin** — user CRUD, bulk import/export (CSV), department & category management, analytics dashboard

### Odoo 15 ERP (`:8069`)
Custom module `ensia_dms` with document, category, and department models. RBAC via `group_dms_user` and `group_dms_manager` security groups.

---

## Kafka Topics

| Topic | Producer | Consumer |
|---|---|---|
| `dms.documents.uploaded` | documents-service | translator-service |
| `dms.documents.translated` | translator-service | documents-service |

---

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Java 8+, Maven
- Node.js 18+
- Python 3.10+

### Run with Docker Compose

```bash
# Start all infrastructure + microservices
docker compose up -d

# Start Odoo ERP (separate stack)
cd odoo && docker compose up -d
```

### Run frontend locally

```bash
cd document-management-system
npm install
npm run dev
```

### Run translator service locally

```bash
cd translator-service
pip install -r requirements.txt
python main.py
```

---

## Project Structure

```
├── api-gateway/              # Spring Cloud Gateway
├── auth-service/             # JWT auth + user management
├── documents-service/        # Document CRUD + S3 + Kafka
├── comments-service/         # Cassandra-backed comments
├── translator-service/       # Python Kafka consumer + Gemini
├── document-management-system/  # React frontend
│   └── e2e/                  # Playwright test suites (11 specs)
├── odoo/                     # Odoo 15 ERP + custom module
│   └── addons/ensia_dms/
├── infra/postgres/           # DB schema + partitioning scripts
├── k8s/                      # Kubernetes manifests (10 YAMLs)
├── load-tests/               # k6 load test scripts + results
├── prometheus.yml
└── docker-compose.yml
```

---

## Database Schemas

**PostgreSQL — `documents`**
```
id (BIGINT PK), title, created_at, owner, file_url,
translated_content_fr, translated_content_ar, translated_content_es
```

**Cassandra — `dms.comments`**
```
PRIMARY KEY ((doc_id), created_at, id)
content, author
```

---

## Default Credentials (dev)

| Role | Email | Password |
|---|---|---|
| Admin | admin@dms.com | admin123 |
| User | user@dms.com | user123 |

---

## Kubernetes Deployment

```bash
kubectl apply -f k8s/
```

All services are exposed via NodePort. The API Gateway is accessible at `:30080`.

---

## Testing

```bash
# Playwright E2E tests
cd document-management-system
npx playwright test

# Python integration test
python test_e2e_flow.py

# k6 load test
./k6 run load-tests/comment-load-test.js
```
