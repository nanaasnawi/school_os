# School OS Platform Capability Maturity Model (Levels 1 to 7)

> Roadmap kapabilitas platform School OS dari fondasi inti hingga ekosistem ekstensi enterprise.

---

## Maturity Levels

```text
Level 8: AI Assistance (Recommendation Copilot & Human-in-the-Loop Governance)
   ▲
Level 7: Ecosystem (Public Integration Layer, Public SDK, Webhooks, OAuth Client)
   ▲
Level 6: Automation (Background Job Queue, Workflow Engine, Scheduling & Document Domains)
   ▲
Level 5: Intelligence (Analytics Read Model Projections & Executive Decision Workspace)
   ▲
Level 4: Reporting (ReportCard Aggregate & Multi-Format PDF Exporter)
   ▲
Level 3: Collaboration (Communication Bounded Context, Parent Portal, Notifications)
   ▲
Level 2: Operations (Learning & Assessment Operations Workspaces)
   ▲
Level 1: Foundation (Identity, Multi-Tenant RLS, Academic Core, Clean Architecture)
```

---

## Modular Extension Architecture (Core vs Extensions)

### Core (Keep Small, Stable & Invariant-Protected)
- Identity & RBAC
- Academic Structure
- Learning Engine
- Assessment Engine
- Reporting Engine

### Modular Extensions (Pluggable Modules)
- `Finance` (SPP & Tuition Billing)
- `Library Management` (Buku & Sirkulasi Peminjaman)
- `Admissions / PPDB` (Penerimaan Peserta Didik Baru)
- `Dormitory & Counseling` (Asrama & Bimbingan Konseling)
- `Alumni & Extracurricular` (Ikatan Alumni & Ekstrakurikuler)
