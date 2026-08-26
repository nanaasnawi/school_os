# 10–15 Year Architecture Horizon & Platform Roadmap — School OS

> Cetak biru evolusi kapabilitas platform School OS dari fondasi inti v1.0 hingga Ekosistem Infrastruktur Pendidikan L8.

---

## 1. 8-Level Platform Capability Maturity Model

```text
Level 8: AI Assistance (Recommendation Copilot & Human-in-the-Loop Governance)
   ▲
Level 7: Ecosystem (Integration Layer, Public SDK, Webhook, Dapodik/Google/Teams Adapters)
   ▲
Level 6: Automation (Background Job Workers, Workflow Engine, Document Domain, Search Context, Scheduling Context)
   ▲
Level 5: Intelligence (Analytics Projections & Executive Decision Workspace)
   ▲
Level 4: Reporting (ReportCard Aggregate & Multi-Format Exporter)
   ▲
Level 3: Collaboration (Communication Bounded Context, Parent Portal, Notifications)
   ▲
Level 2: Operations (Learning Operations & Assessment Workspaces)
   ▲
Level 1: Foundation (Identity, Multi-Tenant RLS, Academic Core, Architecture Charter v1)
```

---

## 2. Strategic Bounded Context Additions for Level 6 & Level 7

### 1. `Scheduling Context` (Jantung Operasional Sekolah)
- `AcademicCalendar`, `TeachingSchedule`, `RoomAllocation`, `ExamSchedule`, `SchoolEvents`.

### 2. `Document Management Domain` (Universal File Handling)
- `Document` Aggregate Root (`DocumentId`, `Owner`, `StorageProvider`, `Checksum`, `VirusScanStatus`, `RetentionPolicy`).
- Mendukung domain Learning, Reporting, Finance, dan Library tanpa duplikasi logika storage.

### 3. `Search Context` (Isolated Search Indexer)
- Separate Read Model Indexer (`SearchProjection`, `FullTextSearch`, `AutoSuggest`).

### 4. `Public Integration Layer` (Ecosystem Adapters)
- Adapters untuk `Dapodik`, `Google Classroom`, `Microsoft Teams`, `Zoom`, `Payment Gateways`.
