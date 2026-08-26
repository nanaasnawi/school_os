# Phase 2.5 — Operational Readiness Checklist & Audit Specification

> Single source of truth untuk kriteria kelulusan platform sebelum memasuki Phase 3.

---

## 1. Audit Matrix & Status

| Area | Item Audit | Standard / Target | Status |
|---|---|---|:---:|
| **Observability** | Request ID & Correlation ID | Terikat di setiap HTTP request & domain event log | ✅ VERIFIED |
| **Observability** | Tracing & Structured Logging | Logging menggunakan `tracing::` (dilarang `println!`) | ✅ VERIFIED |
| **Observability** | Audit Log Trail | Seluruh operasi write (`POST`, `PATCH`, `DELETE`) dicatat ke audit trail | ✅ VERIFIED |
| **Performance** | Database Index Audit | Index pada semua Foreign Keys + `tenant_id` + `deleted_at` | ✅ VERIFIED |
| **Performance** | Connection Pool Tuning | SQLx pool `max_connections(50)`, `idle_timeout(30s)` | ✅ VERIFIED |
| **Security** | JWT Expiration & RBAC Matrix | JWT 15 min expiration + Refresh Tokens + Granular permissions | ✅ VERIFIED |
| **Security** | Multi-Tenant Isolation | RLS Filter `tenant_id` pada seluruh SQL queries | ✅ VERIFIED |
| **Backup & Recovery**| Dump & Restore Testing | Script backup teruji dengan restore test DB | ✅ VERIFIED |
| **Documentation** | ADR & Runbooks | 7 ADRs + Runbooks + OpenAPI Spec Contract Freeze | ✅ VERIFIED |
| **Release Eng.** | Production Build Gate | `cargo fmt`, `clippy -D warnings`, `cargo test`, `npm build` 100% green | ✅ VERIFIED |
