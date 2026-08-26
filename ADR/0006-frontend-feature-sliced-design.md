# ADR 0006: Frontend Feature-Sliced Design & Presentation Layer Pureness

- **Status**: Accepted
- **Date**: 2026-08-04
- **Author**: Engineering Architecture Team

## Context

Aplikasi frontend Next.js berisiko menjadi tidak terstruktur jika business logic backend berpindah ke komponen UI. Komponen UI yang mencampur data fetching, state mutation, dan validasi form menyebabkan *spaghetti code* dan sulit dirawat dalam jangka panjang.

## Decision

Mengadopsi **Frontend Feature-Sliced Architecture** di `frontend/src/` dengan aturan berikut:

1. **Pure Presentation Layer**: Komponen UI di `src/shared/ui/` dan `src/features/*/components/` tidak boleh memanggil `fetch()` atau `axios` langsung.
2. **TanStack Query Single Source of Truth**: Seluruh server state dikelola oleh TanStack Query (`useQuery` / `useMutation`) mengonsumsi SDK auto-generated `@hey-api/client-fetch`.
3. **Form Validation**: Semua form menggunakan **React Hook Form + Zod Schema** yang selaras dengan OpenAPI contract.
4. **Permission-aware UI**: Pengecekan akses UI menggunakan granular RBAC permissions via `<Can permission="..." />`, bukan hardcoded roles.

## Consequences

- **Positive**: Frontend murni menjadi presentation layer, ramah pengujian, konsisten, dan modular.
- **Negative**: Memerlukan pembuatan query/mutation hooks dan Zod schemas per fitur.
