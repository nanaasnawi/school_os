# RFC 0001: EventBus v2 Asynchronous Event Distribution Specification

- **Status**: Draft / Accepted
- **Author**: Engineering Architecture Team
- **Date**: 2026-08-04

## 1. Problem & Motivation
Domain events saat ini disebarkan via memory bus `tokio::sync::broadcast`. Untuk skala enterprise multi-tenant dengan jutaan event per hari, EventBus memerlukan *Durable Messaging Queue* (seperti NATS / Kafka / RabbitMQ) untuk menjamin *at-least-once delivery* dan pemrosesan *Asynchronous Read Model Projections*.

## 2. Proposed Design
1. **Outbox Pattern**: Domain Event disimpan ke tabel `outbox_events` dalam transaksi SQLx yang sama dengan Aggregate Root.
2. **Relay Worker**: Background task membaca `outbox_events` dan menyebarkannya ke EventBus/Message Broker.
3. **Idempotent Consumer**: Setiap event handler mengecek `event_id` yang terproses untuk menjamin idempotensi.

## 3. Migration Plan
Backward compatible — `EventBus` interface di `school-core/src/common/event_bus.rs` tidak berubah.
