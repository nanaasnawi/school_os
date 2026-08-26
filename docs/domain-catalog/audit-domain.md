# Audit Domain Catalog

> **Domain Path**: `backend/school-core/src/audit/`

Domain **Audit** bertanggung jawab atas pencatatan jejak audit (*audit trail*) yang tidak dapat diubah (*immutable*) untuk setiap perubahan data atau aktivitas penting dalam platform School OS.

---

## 1. Aggregates & Entities

### 1.1 `AuditLog` (Aggregate Root)
Entitas catatan audit.

- **ID**: `Uuid` (UUID v7)
- **Tenant ID**: `Uuid`
- **Actor ID**: `Option<Uuid>` (User ID pelaksana aksi)
- **Event ID**: `Uuid` (Correlation ID dari domain event)
- **Event Type**: `String` (misal: `StudentCreated`, `TeacherUpdated`)
- **Source**: `String` (misal: `school-core::people`)
- **Payload**: `serde_json::Value` (Detail snapshot event)
- **Occurred At**: `DateTime<Utc>`

---

## 2. Infrastructure & Subscribers

- **`AuditEventSubscriber`**: Konsumen berdaya tahan (*durable subscriber*) yang mendengarkan `EventBus` secara terpisah.
- Mengubah setiap `DomainEvent` yang dipublish oleh Aggregate Root menjadi entitas `AuditLog` dan menyimpannya ke tabel `audit_logs` di PostgreSQL.
- Menggunakan `tracing::info` / `tracing::error` untuk observabilitas terintegrasi.
