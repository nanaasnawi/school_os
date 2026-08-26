# ADR-0002: Domain-Driven Design (DDD)

**Status:** Accepted
**Date:** 2026-07-20

## Context

Sistem akademik memiliki kompleksitas bisnis yang tinggi: aturan kurikulum, penilaian, kenaikan kelas, multi-tenant, dll. Tanpa pemisahan domain yang jelas, kode akan menjadi spaghetti dan sulit diubah.

## Decision

Setiap domain bisnis adalah modul independen dengan struktur:

```
<domain>/
├── domain/          # Entities, Value Objects, Aggregates, Domain Events
├── application/     # Use Cases (Commands, Queries, Handlers)
├── infrastructure/  # Repository implementations
└── presentation/    # DTOs (optional, bisa di api-server)
```

Domain yang diidentifikasi:
- **Identity** — User, authentication, roles
- **People** — Student, Teacher, Guardian, Staff
- **Academic** — AcademicYear, Class, Subject, Enrollment
- **Audit** — Audit trail
- **Authorization** — RBAC, permissions
- **Learning** — Material, Quiz, Assignment (future)
- **Attendance** — Daily attendance (future)
- **Assessment** — Grade, scoring (future)

## Consequences

- **Positive**: Isolasi domain, parallel development, Ubiquitous Language
- **Negative**: Overhead koordinasi antar domain via event
- **Risk**: Domain boundaries bisa salah di awal — siap untuk refactor

## Compliance

- Setiap domain di folder terpisah di `school-core/src/`
- Domain TIDAK BOLEH saling import secara langsung — komunikasi via EventBus
- Tiap domain harus punya `mod.rs` + `tests.rs`
