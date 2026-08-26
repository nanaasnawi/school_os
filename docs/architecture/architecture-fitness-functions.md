# Architecture Specification: Fitness Functions & Automated CI/CD Invariants

> Kumpulan aturan fitness function yang wajib diverifikasi secara otomatis pada CI/CD pipeline untuk menjamin kesehatan arsitektur School OS.

---

## 1. Domain Layer Invariants

| Fitness Function | Rule | Automated Check Command |
|---|---|---|
| **Clean Architecture Layer Isolation** | Domain layer (`backend/school-core/src/*/domain/`) **DILARANG** mengimpor SQLx (`use sqlx::...`) | `grep -r "use sqlx" backend/school-core/src/*/domain/` |
| **Presentation Isolation** | Domain layer **DILARANG** mengimpor Axum (`use axum::...`) | `grep -r "use axum" backend/school-core/src/*/domain/` |
| **Production Safety** | Domain & Application code **DILARANG** menggunakan `unwrap()` atau `expect()` tanpa justifikasi test | `grep -r "\.unwrap()" backend/school-core/src/` |
| **UUID Standard Invariant** | Semua Aggregate Root **WAJIB** menggunakan `Uuid::now_v7()` (DILARANG `Uuid::new_v4()`) | `grep -r "Uuid::new_v4" backend/school-core/src/` |
| **Unit Test Coverage** | Seluruh Domain Aggregates **WAJIB** memiliki unit test di `domain/tests` (Coverage > 80%) | `cargo test --lib` |

---

## 2. API & Authorization Invariants

| Fitness Function | Rule | Enforcement Mechanism |
|---|---|---|
| **Granular RBAC Check** | Setiap REST Controller endpoint **WAJIB** dilindungi oleh permission policy guard | Middleware & `RequirePermission` extractor |
| **Audit Metadata Standard** | Semua Event Domain **WAJIB** mencakup: `event_id`, `event_type`, `occurred_at`, `tenant_id`, `correlation_id` | `DomainEvent` base trait |
| **Tenant Isolation** | Semua SQL query **WAJIB** menyertakan klausul filter `tenant_id` | SQLx Compile-time query verification + RLS |
