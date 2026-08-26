# ADR-0001: Clean Architecture

**Status:** Accepted
**Date:** 2026-07-20

## Context

Backend harus maintainable, testable, dan independent dari framework eksternal. Framework (Axum, SQLx) bisa berubah di masa depan tanpa mengubah business logic.

## Decision

Mengadopsi Clean Architecture dengan 4 layer:

```
Presentation (api-server)
    ↓
Application (use cases)
    ↓
Domain (entities, business rules)
    ↓
Infrastructure (database, external services)
```

Aturan dependency:
- Domain → tidak boleh depend ke layer manapun
- Application → boleh depend ke Domain
- Infrastructure → implement interface dari Domain
- Presentation → depend ke Application (via use case trait/command)

## Consequences

- **Positive**: Business logic terisolasi, framework bisa diganti, testable
- **Negative**: Boilerplate lebih banyak (trait, DI, mapper)
- **Risk**: Developer baru butuh waktu adaptasi

## Compliance

- Semua crate `school-core/*/domain/` TIDAK BOLEH `use axum::...` atau `use sqlx::...`
- Infrastruktur repository WAJIB implement trait dari domain layer
- Use case WAJIB menerima dependency via trait (DI), bukan langsung instansiasi
