# Architecture Specification: Analytics Projection & Read Model Pipeline

## 1. Executive Summary
Untuk mencegah query OLTP yang berat pada tabel transaksi (*Submission*, *QuizAttempt*, *GradeBook*) saat sekolah memiliki jutaan baris data, query **Analytics & Executive Decision Workspace** mengonsumsi **Asynchronous Read Model Projections**.

---

## 2. Projection Architecture Pipeline

```text
Transactional OLTP (Write Model)
   │
   ├── SubmissionGraded Event
   ├── QuizAttemptCompleted Event
   └── GradeBookPublished Event
           │
           ▼
     EventBus (Domain Events)
           │
           ▼
Analytics Projection Consumers (Async Worker)
           │
           ▼
Materialized Views & Read Models (Read Model OLAP / Cache)
   ├── analytics_school_overview
   ├── analytics_class_summary
   ├── analytics_subject_summary
   └── analytics_teacher_summary
           │
           ▼
Analytics API & Executive Decision Workspace (/dashboard/analytics)
```

---

## 3. Benefits
- **OLTP Isolation**: Transaksi operasional harian guru & siswa tidak terganggu oleh query agregasi eksekutif.
- **Sub-10ms Dashboard Response**: Query read model membaca tabel proyeksi terindeks tanpa `JOIN` berat.
