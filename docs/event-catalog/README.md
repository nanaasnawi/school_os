# School OS — Event Catalog

> Katalog Event resmi untuk arsitektur Event-Driven di platform School OS.

---

## Architecture Overview

School OS menerapkan **Event-Driven Architecture (EDA)** untuk komunikasi antar domain secara terlepas (*decoupled*). Setiap perubahan state pada Aggregate Root mempublikasikan `DomainEvent` melalui `EventBus`.

```
Aggregate Root (e.g. Student)
      │
      ▼ (take_events)
  InMemoryEventBus / Outbox
      │
      ├───────────────────────┬──────────────────────┐
      ▼                       ▼                      ▼
AuditSubscriber        NotificationEngine     AnalyticsProcessor
(Stores AuditLog)      (Sends Push/Email)     (Updates Dashboard)
```

---

## Standar Metadata Event (`EventMetadata`)

Setiap domain event di School OS **WAJIB** membungkus `EventMetadata` standar:

```rust
pub struct EventMetadata {
    pub event_id: Uuid,         // UUID v7 unik untuk event ini
    pub event_type: String,     // Nama tipe event (e.g., "StudentCreated")
    pub occurred_at: DateTime<Utc>, // Stempel waktu kejadian
    pub tenant_id: Uuid,        // Tenant pengisolasi
    pub correlation_id: String, // ID korelasi request untuk tracing
    pub source: String,         // Modul sumber (e.g., "school-core::people")
}
```

---

## Katalog Event per Domain

Silakan baca dokumen lengkap [domain-events.md](domain-events.md) untuk melihat daftar seluruh skema event, payload JSON, dan subscriber yang mendengarkannya.
