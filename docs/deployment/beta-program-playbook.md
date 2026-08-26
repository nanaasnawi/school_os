# Beta Program Rollout Playbook — Phase 2.5 Operational Readiness

## 1. Executive Summary
Uji coba bertahap (*Gradual Controlled Beta*) dengan kelompok pengguna nyata terkecil sebelum ekspansi penuh ke seluruh sekolah.

---

## 2. Beta Cohort Structure

```text
Phase 2.5 Controlled Cohort
┌─────────────────────────────────────────┐
│ 1 Kepala Sekolah (Admin Tenant)        │
│ 2 Guru (Learning & Assessment Users)    │
│ 10 Siswa (Active Learners)              │
│ 5 Orang Tua (Parent Portal Preview)     │
└─────────────────────────────────────────┘
```

---

## 3. Rollout Stages

### Stage 1: Single Tenant Onboarding (Week 1)
- Provisioning tenant via `/api/v1/tenants/provision`
- Konfigurasi `AcademicYear` dan `Classes`
- Registrasi 2 akun Guru dan 10 akun Siswa

### Stage 2: Learning & Operations Workflow (Week 2)
- Guru mengunggah 5 Materi Pembelajaran (`PDF` / `Video`)
- Guru menyusun 2 Modul Lesson dan mempublikasikannya
- Guru membuat 1 Assignment (Batas Waktu: +7 Hari)
- 10 Siswa mengunggah Submission Attempt

### Stage 3: Assessment & Grading Review (Week 3)
- Guru memberikan nilai dan feedback di *Submission Review Workspace*
- Siswa mengerjakan 1 Quiz Auto-Graded
- Guru mengevaluasi kalkulasi nilai akhir di *Spreadsheet GradeBook*
- Publikasi GradeBook ke Notification Center

---

## 4. Telemetry & Tele-Feedback Metrics
- **HTTP Latency Target**: P95 < 150ms, P99 < 300ms
- **API Success Rate**: > 99.9%
- **User Satisfaction (CSAT)**: > 4.5 / 5.0
