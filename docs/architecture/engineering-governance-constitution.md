# Engineering Governance Constitution — School OS Platform

> Konstitusi Tata Kelola Engineering (Engineering Governance) untuk menjamin keberlanjutan, kualitas arsitektur, dan stabilitas School OS dalam skala jangka panjang.

---

## 1. RFC (Request for Comments) Standard

Setiap perubahan arsitektur besar **WAJIB** mendokumentasikan RFC di `docs/rfc/` sebelum kode ditulis.

### Template RFC:
- **Problem & Motivation**: Latar belakang dan masalah bisnis/teknis yang ingin diselesaikan.
- **Proposed Design**: Detail rancangan arsitektur, domain entity, event payload, dan API contract.
- **Alternatives Considered**: Opsi solusi lain yang dipertimbangkan dan alasan penolakannya.
- **Migration & Rollout Plan**: Strategi migrasi data dan rollback plan jika terjadi kegagalan.

---

## 2. Architectural PR Review Checklist

Setiap Pull Request (PR) tingkat enterprise **WAJIB** memenuhi checklist berikut:

```markdown
Architectural Review Checklist
[ ] Aggregate Boundary sudah tepat & invariant terjaga
[ ] Tidak ada dependensi sirkular (Unidirectional Flow Guarantee)
[ ] Tidak ada business logic di Repository atau Axum Controller
[ ] Domain Event memiliki audit metadata lengkap (event_id, tenant_id, correlation_id)
[ ] Tenant isolation terverifikasi (RLS / WHERE tenant_id = ...)
[ ] Tidak ada unwrap()/expect() pada production path
[ ] Compatibility & OpenAPI spec diperbarui
```

---

## 3. Technical Debt Register Standard

Seluruh utang teknis dicatat secara eksplisit di `docs/technical-debt/` dengan format ID (`TD-0001`), deskripsi dampak, tingkat prioritas, pemilik, dan target rilis perbaikan.

---

## 4. Release Train & Compatibility Policy

1. **Release Pipeline**: `Main` ➔ `Nightly` ➔ `Beta` ➔ `Release Candidate` ➔ `Stable`.
2. **API Lifecycle**: API major version (seperti `/api/v1`) didukung minimal **24 bulan**.
3. **Database Migration**: Semua SQLx migration bersifat **forward-only** dan backward-compatible.

---

## 5. Engineering Health Metrics

| Metric | Target SLA |
|---|:---:|
| **Build Success Rate** | > 99.0% |
| **Test Suite Success Rate** | 100.0% (Zero Failures) |
| **Mean PR Review Time** | < 24 Jam |
| **Architecture Violations** | **0 (Zero Tolerance)** |
