# School OS — Engineering Constitution

> Konstitusi engineering yang wajib dipatuhi oleh seluruh agen AI dan kontributor manusia.
> Dokumen ini adalah *single source of truth* untuk keputusan arsitektur, standar kualitas, dan protokol kontribusi.

---

## 1. Architecture Law

### 1.1 Domain-Driven Design (DDD)

Setiap domain adalah modul independen dengan siklus hidup sendiri.

```
backend/school-core/src/<domain>/
├── domain/          # Entities, Value Objects, Aggregates, Events
├── application/     # Use Cases (Commands, Queries, Handlers)
├── infrastructure/  # Repository implementations (PostgreSQL)
└── presentation/    # DTOs (Request/Response) — OPTIONAL, bisa di api-server
```

**Aturan:**
- Domain layer TIDAK BOLEH depend ke application, infrastructure, atau presentation.
- Application layer BOLEH depend ke domain, TIDAK BOLEH depend ke infrastructure.
- Infrastructure layer implement interface yang didefinisikan di domain.

### 1.2 Clean Architecture

```
Presentation (api-server)
    ↓
Application (use cases)
    ↓
Domain (entities, events, repository interfaces)
    ↓
Infrastructure (PostgreSQL, external services)
```

**YANG TIDAK BOLEH:**
- Domain mengimpor dari Presentation (`use axum::...`)
- Infrastructure mengimpor dari Presentation
- Application mengimpor dari Infrastructure secara langsung (harus lewat dependency injection)

### 1.3 Event-Driven Architecture (EDA)

Cross-domain communication WAJIB melalui EventBus, bukan direct function call.

- Publisher → EventBus → Subscriber(s)
- Domain event dipublish oleh Aggregate Root via `take_events()`
- Event metadata WAJIB mencakup: `event_id`, `event_type`, `occurred_at`, `tenant_id`, `correlation_id`, `source`
- Audit Trail: semua event domain WAJIB dicatat ke audit log

### 1.4 CQRS Ready

- **Command**: Create, Update, Delete → `POST`, `PATCH`, `DELETE`
- **Query**: Read → `GET`
- List endpoint WAJIB menggunakan `Page<T>` response
- Detail endpoint WAJIB menggunakan Read Model terpisah, bukan Aggregate langsung

### 1.5 Local Bridge Agent & Student Identity Subsystem Law

- **Local Bridge Boundary**: Web App / Cloud Server DILARANG terhubung langsung ke database internal Dapodik lokal. Selalu gunakan `Local Bridge Agent` yang terisolasi dan berkomunikasi melalui Secure API Channel (TLS + Token).
- **Opaque QR Token Security**: QR Code DILARANG menyimpan data PII mentah (NIK, NISN, Nama Ibu Kandung) dan DILARANG menyimpan secret signing key di frontend. QR Code WAJIB berisi *short-lived opaque one-time token* (`request_id` + `nonce`) yang divalidasi 100% di Server Side & mengikuti state machine: `ISSUED ➔ CLAIMED ➔ VERIFIED ➔ APPROVED ➔ CONSUMED`.
- **Scoped Idempotency Key Engine**: `Local Bridge Agent` WAJIB mengusung *Encrypted Local Outbox Queue* dengan `idempotency_key` terikat pada per-transaksi/request (`hash_sha256(tenant_id + entity_id + operation + mutation_request_id)`). DILARANG menggunakan key permanen tanpa `mutation_request_id`.
- **Domain Separation (Identity vs Mobility)**: Identity State (`NEW`, `ACTIVE`, `GRADUATED`, `ALUMNI`) DILARANG dicampur dengan Mobility Case State (`NONE`, `TRANSFER_OUT_PENDING`, `TRANSFER_IN_APPROVED`, `COMPLETED`). Keduanya adalah bounded contexts terpisah.
- **Local Bridge Device Key & OS Secure Storage**: Kredensial agent DILARANG disimpan dalam `config.json` mentah. Agent WAJIB menggunakan OS Secure Storage (Windows Credential Manager / Keychain) dan mTLS certificates.
- **Local Audit Ingestion**: Saat offline, event dicatat di Local Audit Store dengan immutable `event_id` + `occurred_at` + `sequence`. Saat online, event di-ingest ke Cloud Audit tanpa distorsi timestamp.
- **Dapodik Anti-Corruption Layer (ACL)**: Domain School OS DILARANG mengimpor skema atau nama tabel Dapodik. Dapodik Adapter wajib bertindak sebagai Anti-Corruption Layer (ACL) independen.
- **Bidirectional Sync Invariant (PULL & PUSH)**: Hub Integrasi Dapodik WAJIB mendukung sinkronisasi 2 arah penuh: **PULL** (penerimaan data master siswa/rombel dari Dapodik Localhost ke School OS Master Domain) dan **PUSH** (pengiriman data pendaftaran/mutasi dari School OS ke Encrypted Outbox Queue Dapodik).

---

## 2. Code Conventions

### 2.1 Rust

| Aspek | Standar |
|-------|---------|
| Error Handling | `DomainError` / `ApplicationError` / `InfrastructureError` + `ErrorCode` |
| Serialization | Manual `as_db_str()` / `from_db_str()` untuk enum — JANGAN `format!("{:?}")` |
| Logging | WAJIB `tracing::` — DILARANG `println!`, `eprintln!`, `dbg!` |
| IDs | WAJIB `Uuid::now_v7()` — DILARANG `Uuid::new_v4()` |
| Async | `tokio` + `async_trait` |
| Formatting | `cargo fmt` wajib sebelum commit |
| Linting | `cargo clippy` — zero warnings |

### 2.2 TypeScript / Next.js

| Aspek | Standar |
|-------|---------|
| Framework | Next.js App Router |
| Styling | CSS Modules + globals.css |
| API Client | Auto-generated dari OpenAPI (`@hey-api/openapi-ts`) |
| State | React Context untuk global, props untuk component |
| Testing | Vitest + @testing-library/react |
| Type Safety | `strict: true` — minimal `unknown`, jangan `any` |
| Formatting | Prettier |
| Linting | ESLint |

### 2.3 Error Handling Pattern (Rust)

```rust
// Domain error — business rule violations
DomainError::Validation(String)
DomainError::BusinessRule(ErrorCode, String)

// Application error — maps domain errors + system errors
ApplicationError::Domain(DomainError)
ApplicationError::NotFound(ErrorCode, String)
ApplicationError::Unauthorized(ErrorCode, String)
ApplicationError::Infrastructure(InfrastructureError)
ApplicationError::Internal(String)

// Infrastructure error — technical failures
InfrastructureError::Database(sqlx::Error)
InfrastructureError::Network(String)
InfrastructureError::System(String)
```

---

## 3. Database Rules

| Aturan | Keterangan |
|--------|------------|
| IDs | `UUID v7` — semua primary key |
| Tenant Isolation | Semua query WAJIB filter `tenant_id` |
| Soft Delete | Semua entity punya `deleted_at` + `deleted_by` |
| Audit Trail | `created_at`, `updated_at` WAJIB ada |
| Migrations | SQLx migration — 1 file per perubahan |
| Row Level Security | PostgreSQL RLS untuk multi-tenant |
| Indexing | Semua foreign key + `tenant_id` WAJIB di-index |

---

## 4. Testing Mandate

- **Unit Tests**: Setiap domain WAJIB punya `tests.rs` — coverage > 80%
- **Integration Tests**: `backend/school-core/tests/` untuk repository test dengan test DB
- **Frontend Tests**: Komponen kritis WAJIB punya Vitest test
- **Type Check**: `tsc --noEmit` — zero errors
- **Quality Gate sebelum merge**:
  - `cargo fmt` — passed
  - `cargo clippy` — zero warnings
  - `cargo test` — all green
  - `npm run lint` — zero errors
  - `npm run type-check` — zero errors
  - `npm run build` — successful

---

## 5. Frontend Rules

### 5.1 Route Structure
```
src/app/
├── (auth)/          # Login, Register — segregated layout
├── (dashboard)/     # Admin, Teacher, Parent dashboards
└── api/             # API routes (if needed)
```

### 5.2 Component Patterns
- Gunakan CSS Modules (`*.module.css`)
- Satu component = satu folder (jika kompleks) atau satu file
- `DataTable` adalah shared component — reuse jangan buat ulang

### 5.3 SDK & API
- Jangan edit file di `src/lib/sdk/` — auto-generated dari OpenAPI
- Regenerate SDK: `cd frontend && npx @hey-api/openapi-ts -c openapi-ts.config.ts`
- API client wrapper di `src/lib/api.ts`

---

## 6. Security Rules

- JWT Authentication — semua endpoint kecuali `/health` dan `/auth/login`
- RBAC — setiap endpoint punya permission check
- Input Validation — semua request divalidasi di Application layer
- Audit Log — semua operasi write dicatat
- HTTPS Only — production
- Password — di-hash dengan `argon2`
- CSRF Protection — Next.js built-in

---

## 7. API Versioning

```
/api/v1/<resource>
```

**Breaking changes** → WAJIB buat version baru (`/api/v2/...`).
Jangan pernah mengubah response schema secara langsung.

---

## 8. Definition of Done (DoD)

Task dianggap **DONE** apabila semua ini terpenuhi:

| # | Kriteria | Check |
|---|----------|-------|
| 1 | Domain entity + event selesai | [ ] |
| 2 | Use case (command/query + handler) selesai | [ ] |
| 3 | Repository interface + implementation selesai | [ ] |
| 4 | Unit test untuk domain logic selesai | [ ] |
| 5 | API endpoint (controller + routing) selesai | [ ] |
| 6 | DTO (request/response) selesai | [ ] |
| 7 | Database migration selesai (jika ada perubahan skema) | [ ] |
| 8 | Event domain di-publish (jika relevan) | [ ] |
| 9 | Audit event tercatat | [ ] |
| 10 | OpenAPI spec diperbarui | [ ] |
| 11 | Task di `task.md` dicentang `[x]` | [ ] |
| 12 | Authorization / Permission policy diuji | [ ] |
| 13 | Integration test repository + API selesai | [ ] |

---

## 9. Architecture Gates

Setiap fitur wajib memenuhi gerbang arsitektur berikut sebelum dinyatakan stabil:

- [ ] Domain layer TIDAK BERGANTUNG pada SQLx (`use sqlx::...` dilarang di domain)
- [ ] Domain layer TIDAK BERGANTUNG pada Axum (`use axum::...` dilarang di domain)
- [ ] Tidak ada business logic di Controller (Controller hanya menerima HTTP request & memanggil Use Case)
- [ ] Tidak ada business logic di Repository (Repository hanya menangani simpan/muat data)
- [ ] Semua dependency mengarah ke dalam (Clean Architecture Rule)
- [ ] Semua use case bersifat transactional bila diperlukan
- [ ] Tidak ada `unwrap()` atau `expect()` pada production code (wajib error handling)

---

## 9. Task Protocol

- Sebelum memulai task, baca `task.md` dan `AGENTS.md`
- Update status task dari `[ ]` ke `[/]` saat mulai
- Update ke `[x]` hanya jika semua DoD terpenuhi
- Jika menemukan isu di luar scope, catat di task baru, jangan mengubah task berjalan

---

## 10. Repository Map

```
/
├── .github/              # CI/CD workflows
├── backend/
│   ├── school-core/      # Domain logic crate
│   │   └── src/
│   │       ├── common/       # Base: event, aggregate, error, page, clock, event_bus
│   │       ├── identity/     # Auth domain
│   │       ├── people/       # Student, Teacher, Guardian, Staff
│   │       ├── academic/     # AcademicYear, Class, Subject, Enrollment
│   │       ├── audit/        # Audit trail
│   │       ├── authorization/# RBAC
│   │       ├── permission/   # Permission registry
│   │       ├── policy/       # Policy engine
│   │       └── config/       # App configuration
│   ├── api-server/       # HTTP API crate (Axum)
│   │   └── src/
│   │       ├── presentation/ # Route handlers per domain
│   │       ├── bootstrap/    # App initialization
│   │       ├── middleware/   # Auth, tracing, request-id
│   │       └── infrastructure/ # Observability
│   └── migrations/       # SQLx migrations
├── frontend/             # Next.js App
│   └── src/
│       ├── app/          # Routes (auth, dashboard)
│       ├── components/   # Shared components
│       ├── contexts/     # React contexts
│       └── lib/          # API client, SDK
├── android/              # Kotlin + Compose (future)
├── ADR/                  # Architecture Decision Records
└── docs/                 # Documentation
    ├── architecture/
    ├── domain-catalog/
    ├── event-catalog/
    ├── api-contract/
    ├── database/
    ├── deployment/
    ├── diagrams/
    └── security/
```
