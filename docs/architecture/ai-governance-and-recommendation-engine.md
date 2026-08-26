# Architecture Decision & Governance: School Intelligence Platform (AI Assistance)

> Single Source of Truth untuk prinsip tata kelola AI pada School OS.

---

## 1. Golden Rule: Human-in-the-Loop & Domain Protection

> **AI TIDAK PERNAH MENGUBAH DOMAIN AGGREGATE SECCARA LANGSUNG.**

AI pada School OS beroperasi murni sebagai **Recommendation Subsystem** (Sistem Pemberi Rekomendasi). Seluruh hasil analisis AI harus melewati persetujuan manusia (*Human Approval*) sebelum dieksekusi melalui Application Layer ke Domain Aggregates.

---

## 2. Recommendation Control Flow

```text
┌─────────────────────────┐
│ AI Subsystem            │  Generates Recommendation (JSON Payload)
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Human Approval UI       │  Guru / Kepsek Review & Confirm Choice
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Application Layer       │  Executes Command / UseCase
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Domain Aggregate        │  Enforces Business Invariants & Emits Domain Event
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Infrastructure / DB     │  Persists State to PostgreSQL
└─────────────────────────┘
```

---

## 3. Sub-Domains of School Intelligence Platform
1. **`AI Teacher Assistant`**: Rekomendasi materi remedial & draft feedback kuis.
2. **`AI Parent Assistant`**: Rangkuman naratif bulanan perkembangan anak dari `ReportCard`.
3. **`AI Academic Principal Assistant`**: Penjelasan otomatis tren penurunan nilai atau presensi.
