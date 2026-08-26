# ADR-0004: Multi-Tenant Architecture

**Status:** Accepted
**Date:** 2026-07-20

## Context

School OS ditargetkan untuk digunakan oleh banyak sekolah dalam satu platform. Setiap sekolah (tenant) harus memiliki data yang terisolasi penuh.

## Decision

Menggunakan pendekatan **Discriminated Tenant** — semua tenant dalam satu database, diisolasi via `tenant_id` di setiap row.

Strategi isolasi:
1. **Tenant ID Column** — semua tabel punya `tenant_id UUID NOT NULL`
2. **Row Level Security (RLS)** — PostgreSQL RLS memfilter otomatis berdasarkan `tenant_id`
3. **Query Filter** — aplikasi WAJIB menyertakan `tenant_id` di semua query (defensive)
4. **Tenant Context** — `RequestContext` mengekstrak tenant_id dari JWT token

## Consequences

- **Positive**: Satu database, mudah maintain, biaya operasional rendah
- **Negative**: Risiko kebocoran data antar tenant jika query lupa filter
- **Risk**: Kebocoran data — dimitigasi dengan RLS + query filter + audit log

## Compliance

- Migrations: setiap tabel baru WAJIB punya `tenant_id` + index
- Queries: WAJIB filter `WHERE tenant_id = $1`
- RLS: WAJIB diaktifkan di setiap tabel multi-tenant
- Soft delete: semua entity punya `deleted_at` + `deleted_by`
