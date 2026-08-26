# ADR-0003: Event-Driven Architecture

**Status:** Accepted
**Date:** 2026-07-20

## Context

Domain-domain perlu berkomunikasi (misal: StudentRegistered → buat enrollment, kirim notifikasi). Direct function call antar domain menyebabkan coupling tinggi dan sulit di-scale.

## Decision

Semua cross-domain communication menggunakan EventBus.

```
Publisher → EventBus → Subscriber(s)
```

Aturan:
1. Domain event dipublish oleh Aggregate Root via `take_events()`
2. Use case memanggil `EventBus::publish_batch()` setelah command berhasil
3. Event metadata WAJIB: `event_id`, `event_type`, `occurred_at`, `tenant_id`, `correlation_id`, `source`
4. Audit Trail mencatat semua event
5. InMemoryEventBus untuk development — production akan pakai message broker (Redis Streams / Kafka)

## Consequences

- **Positive**: Decoupling antar domain, audit trail otomatis, replayable events
- **Negative**: Eventual consistency (bukan immediate), debugging lebih kompleks
- **Risk**: Event loss jika bus crash — perlu outbox pattern (already implemented)

## Compliance

- Setiap domain event WAJIB implement `DomainEvent` trait
- Use case WAJIB publish events setelah sukses
- Events Wajib dicatat di audit log
