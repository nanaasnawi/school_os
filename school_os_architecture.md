# Arsitektur School OS: Ekosistem Digital Terintegrasi

School OS adalah platform terpusat yang dirancang dengan **Domain-Driven Design (DDD)** dan **Event-Driven Architecture (EDA)**. Platform ini merepresentasikan operasi sekolah di dunia nyata, bukan sekadar formulir digital.

## 1. Top-Level Domain Architecture

Arsitektur ini menggunakan penamaan berdasarkan **Domain Pendidikan**, bukan berdasarkan antarmuka pengguna (UI).

```mermaid
mindmap
  root((School OS))
    Core Platform
      Identity Service
      Tenant Management
      Audit & Security
    Engines (The Brain)
      School Rules Engine
      Workflow Engine
      Assessment Engine
      Attendance Engine
      Learning Engine
    Operations & Admin
      Academic Calendar
      Promotion Engine
      Document Center
      School Operation
    Communication
      Communication Hub
      Notification Center
    Workspaces (UI/Presentation)
      Teacher Workspace
      Student Center
      Parent Portal
      Analytics Engine
```

## 2. School Rules Engine & Workflow Engine

Dua komponen pembeda utama yang menjadikan School OS sebagai platform tingkat *Enterprise*.

### School Rules Engine
Pusat kebenaran (*Single Source of Truth*) untuk seluruh regulasi akademik. Tidak ada *hardcode* KKM atau aturan kelulusan di dalam kode. Jika kurikulum berubah (misal dari K13 ke Kurikulum Merdeka), kita hanya mengubah konfigurasi di Rules Engine.
- Kurikulum & Bobot Nilai
- Syarat Kenaikan Kelas (Promotion Rules)
- KKM & Skala Penilaian

### Workflow Engine
Mengatur rantai persetujuan (*approval chain*) layaknya birokrasi nyata di sekolah namun secara digital dan transparan.

```mermaid
sequenceDiagram
    actor Guru
    participant Work as Workflow Engine
    participant Assess as Assessment Engine
    participant Audit as Audit Log
    actor Kepsek as Kepala Sekolah

    Guru->>Work: Ajukan Koreksi Nilai Siswa A
    Work->>Kepsek: Push Approval Request
    Kepsek->>Work: Approve
    Work->>Assess: Execute Grade Change
    Assess->>Audit: Log "Grade changed by approval #123"
```

## 3. Event-Driven Interconnection (Decoupled)

Semua *Engine* berdiri secara independen. Mereka berkomunikasi melalui *Event Bus*. 

```mermaid
sequenceDiagram
    participant Learn as Learning Engine
    participant Event as Event Bus
    participant Assess as Assessment Engine
    participant Rules as School Rules Engine
    participant Hub as Communication Hub

    Learn->>Event: Publish "QuizCompleted"
    Event->>Assess: Consume Event
    Assess->>Rules: Query "What is the weight for this quiz?"
    Rules-->>Assess: Return "Bobot 20% (Kurikulum Merdeka)"
    Assess->>Assess: Calculate Final Score
    Assess->>Event: Publish "GradeUpdated"
    Event->>Hub: Trigger Notification to Parent Portal
```

## 4. Konsep Multi-Tenant (Implementasi Skala Luas)

Sistem menggunakan *Row-Level Security (RLS)* di PostgreSQL. Semua sekolah di bawah satu dinas pendidikan bisa menggunakan sistem ini secara bersamaan tanpa kebocoran data antar sekolah.

```mermaid
flowchart LR
    DB[(PostgreSQL Single DB)]
    DB --> |Tenant ID: 1| SD(SDN 1 Siliasih)
    DB --> |Tenant ID: 2| SMP(SMPN 2)
    DB --> |Tenant ID: 3| SMA(SMAN 1)
```
