# ADR 0008: Teacher Web Workstation Modular Architecture & Mobile Companion Separation

- **Status**: Accepted
- **Date**: 2026-10-01
- **Author**: Platform Architecture & Frontend Engineering Team

## Context

Platform School OS telah berkembang menjadi sistem berskala enterprise dengan berbagai peran (Admin, Operator Sekolah, Guru, Siswa, Wali Murid). Seiring penambahan fitur pembelajaran (*Learning, Assessment, Gradebook, Reading Progress, Inquiry*), terdapat dua risiko arsitektural utama:

1. **Parity Anti-Pattern (Menyamakan Web & Mobile 100%)**: Memposisikan Web Teacher Portal sekadar sebagai "Android versi desktop" menurunkan produktivitas guru saat menggunakan laptop/PC untuk pekerjaan administratif berat (koreksi puluhan lembar esai, pembuatan bank soal, kurasi kurikulum, dan rekap nilai).
2. **Monolithic Page Anti-Pattern**: Pembuatan halaman Next.js raksasa (1.000–1.500 baris kode per file) yang mencampuradukkan data fetching, form state, canvas renderer, dan ribuan baris styling mengakibatkan *technical debt*, *merge conflict*, dan risiko regresi yang tinggi saat ada pembaruan fitur.

## Decision

Kami menetapkan arsitektur **Teacher Workstation vs Mobile Companion** dengan pembagian tanggung jawab dan aturan modularitas frontend berikut:

### 1. Pembagian Peran Klien (Workstation vs Companion)

| Dimensi | Desktop Web (Teacher Workstation) | Mobile App (Teacher Companion) |
|---|---|---|
| **Fokus Utama** | Pekerjaan berat, input data massal, analitik mendalam | Cepat, mobilitas, operasional lapangan |
| **Koreksi Tugas** | **Koreksi Esai Massal** (split-screen worksheet, rubrik, keyboard shortcuts) | Review ringkas & feedback singkat |
| **Bank Soal & Kuis** | **Penyusun Bank Soal Lengkap** (PG, Esai, pembahasan, timer) | Pemantau status kuis berlangsung |
| **Buku Nilai** | Spreadsheet rekap nilai per kelas, bobot, ekspor resmi | Pengecekan nilai per siswa |
| **Analitik & Action Center** | **Teacher Action Center Lengkap** (Reading progress, XP, radar siswa berisiko) | Alert ringkas notifikasi |
| **Presensi & Akses** | Monitoring rekap kehadiran kelas | **Scan QR Presensi Siswa & Kelas** |

### 2. Aturan Backend Tunggal (Zero Business Logic Divergence)

- Tidak boleh ada logika bisnis, otorisasi, atau perhitungan nilai yang berbeda antara Web dan Android.
- Keduanya mengonsumsi backend Rust Axum (`school-core` & `api-server`) dan database PostgreSQL yang sama secara multi-tenant.
- Autentikasi dan otorisasi RBAC sepenuhnya ditegakkan di backend via JWT bearer tokens.

### 3. Standar Modularitas Frontend (Feature-Sliced Isolation)

Untuk mencegah kerapuhan kode di Next.js:

1. **Thin Route Rule (`frontend/src/app/(dashboard)/dashboard/teacher/`)**:
   - File `page.tsx` **dibatasi maksimal 50–80 baris**.
   - `page.tsx` hanya bertindak sebagai URL parameter parser dan orchestrator container view. Nol kalkulasi bisnis atau state raksasa di `page.tsx`.
2. **Feature Isolation (`frontend/src/features/teacher/`)**:
   - Seluruh kode portal guru terisolasi dalam folder:
     - `api/`: Endpoint fetchers terisolasi (`teacher-api.ts`, `action-center-api.ts`, `grading-api.ts`).
     - `types/`: Kontrak data & DTO TypeScript ketat (*zero `any`*).
     - `hooks/`: Business logic, filtering, dan server state orchestration (`useTeacherActionCenter`, `useMassGrader`, `useReadingAnalytics`).
     - `components/`: UI components berukuran ringkas terbagi per domain (`action-center/`, `mass-grader/`, `analytics/`, `shared/`).
     - `index.ts`: Public API barrel.
3. **Component File Size Limit**:
   - Maksimal **200–250 baris** per file `.tsx`. Jika mendekati batas, komponen wajib didekomposisi menjadi sub-komponen terpisah.
4. **Scoped CSS Isolation**:
   - Setiap sub-modul memiliki file `.module.css` sendiri yang terisolasi. Dilarang menumpuk ribuan baris styling ke satu file CSS global.
5. **Non-Destructive Principle**:
   - Modul admin, Dapodik, master siswa, dan layout yang sudah ada tidak boleh diotak-atik tanpa kebutuhan langsung dengan integrasi workstation guru.

## Consequences

- **Positive**:
  - Arsitektur sangat modular, bersih, dan mudah dirawat jangka panjang.
  - Penambahan fitur baru (misal: rubrik penilaian kustom, bank soal nasional) cukup menambahkan file baru di `features/teacher/` tanpa risiko merusak kode lain.
  - Pengalaman guru di laptop menjadi jauh lebih ergonomis dan produktif.
- **Negative**:
  - Membutuhkan disiplin dalam pembuatan sub-komponen, hooks terpisah, dan CSS modules spesifik.
