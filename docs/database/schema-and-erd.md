# School OS — Database Schema & Architecture

> **Database Engine**: PostgreSQL 15+  
> **Migration Manager**: SQLx Migrations (`backend/migrations/`)

Dokumen ini menjelaskan struktur skema database PostgreSQL, kebijakan Row Level Security (RLS) multi-tenant, serta inventarisasi seluruh 22 file migrasi.

---

## 1. Multi-Tenant Architecture & Row Level Security (RLS)

Seluruh tabel entitas di platform School OS mengimplementasikan kolom wajib `tenant_id UUID NOT NULL`. Isolasi data antar-sekolah ditegakkan langsung di tingkatan database menggunakan **PostgreSQL Row Level Security (RLS)**:

```sql
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON students
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

Setiap transaksi query dari Rust backend mengatur variabel sesi `app.current_tenant_id` secara terisolasi.

---

## 2. Primary Key Standard: UUID v7

Semua primary key menggunakan **UUID v7** (time-ordered UUID) yang berurutan secara kronologis. Hal ini mengeliminasi masalah fragmentasi B-tree index pada PostgreSQL dibandingkan UUID v4 acak.

---

## 3. Inventarisasi File Migrasi (`backend/migrations/`)

| # | Nama File Migrasi | Deskripsi & Skema |
| :--- | :--- | :--- |
| `0001` | `0001_create_tenant_schema.sql` | Tabel `tenants` (Penyewa sistem) |
| `0002` | `0002_create_identity_schema.sql` | Tabel `users` (Kredensial & password hash) |
| `0003` | `0003_create_people_schema.sql` | Tabel `students`, `teachers`, `guardians`, `staff` |
| `0004` | `0004_create_academic_schema.sql` | Tabel `academic_years`, `classes`, `enrollments` |
| `0005` | `0005_create_school_schema.sql` | Tabel `schools` |
| `0006` | `0006_create_access_control_schema.sql` | Tabel `roles`, `permissions`, `role_permissions` |
| `20260708203000` | `alter_student_status.sql` | Enum & status siswa (`StudentStatus`) |
| `20260708203500` | `create_audit_logs.sql` | Tabel `audit_logs` (Audit trail immutable) |
| `20260708205700` | `create_idempotency_keys.sql` | Tabel `idempotency_keys` |
| `20260708210000` | `create_outbox_events.sql` | Tabel `outbox_events` (Transactional Outbox Pattern) |
| `20260708220000` | `create_curricula.sql` | Skema Kurikulum (Phase 2 Learning) |
| `20260708221000` | `create_syllabuses.sql` | Silabus Pembelajaran (Phase 2 Learning) |
| `20260708222000` | `create_learning_materials.sql` | Materi Pembelajaran (Phase 2 Learning) |
| `20260708223000` | `create_lessons.sql` | Pertemuan / Sesi Pembelajaran |
| `20260708224000` | `create_learning_sessions.sql` | Sesi Kelas Aktif |
| `20260708225000` | `create_assignments.sql` | Tugas Siswa & Pengumpulan |
| `20260708226000` | `create_quizzes.sql` | Kuis & Ujian |
| `20260708227000` | `create_assessment_rules.sql` | Aturan Penilaian Akademik |
| `20260708228000` | `create_student_progress.sql` | Progres & Rapor Pembelajaran |
| `20260708229000` | `create_achievements.sql` | Pencapaian & Lencana Siswa |
| `20260708230000` | `create_classroom_feeds.sql` | Feed Pengumuman Kelas |
| `20260708231000` | `create_notifications.sql` | Notifikasi Pengguna |
