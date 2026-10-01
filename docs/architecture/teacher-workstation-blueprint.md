# Teacher Workstation: Architecture Blueprint & Implementation Specification

> **Dokumen Resmi Arsitektur & Spesifikasi Portal Guru School OS**  
> Mengacu pada [ADR-0008: Teacher Web Workstation Modular Architecture](file:///c:/Users/USER/Documents/School%20Os/ADR/0008-teacher-workstation-modular-frontend.md) dan [ADR-0006: Frontend Feature-Sliced Design](file:///c:/Users/USER/Documents/School%20Os/ADR/0006-frontend-feature-sliced-design.md).

---

## 1. Filosofi & Strategi Produk

Dalam ekosistem School OS, peran web dan mobile dibagi berdasarkan ergonomi kerja guru di lapangan:

```text
                           ┌────────────────────────┐
                           │   School OS Core API   │
                           │     (Rust / Axum)      │
                           └───────────┬────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
     TEACHER WEB WORKSTATION                       TEACHER MOBILE COMPANION
          (Desktop / PC)                               (Android Tablet/Phone)
─────────────────────────────────             ─────────────────────────────────
• Workspace pekerjaan berat                   • Operasional harian & mobilitas
• Koreksi esai massal (keyboard-first)        • Presensi QR siswa di pintu kelas
• Pembuat kuis & manajemen bank soal          • Push notifikasi tugas & kuis masuk
• Buku nilai spreadsheet & rekap rapor        • Chat instan & diskusi kelas kilat
• Teacher Analytics & Action Center           • Cek jadwal mengajar saat di jalan
• Kurasi materi & Buku Nasional Kemdikbud     • Quick review status pengumpulan tugas
```

### Prinsip "Zero Divergence"
Logika bisnis, validasi, rumus kalkulasi nilai, dan otorisasi RBAC **100% tersentralisasi di backend Rust Axum**. Web dan Android hanya berbeda dalam hal presentasi UI dan alur interaksi pengguna (*user ergonomics*).

---

## 2. Peta 11 Modul Teacher Workstation

```text
TEACHER WORKSTATION
│
├── 1. Dashboard (Teacher Action Center)
│   ├── Jadwal Mengajar Hari Ini & Jam Pelajaran
│   ├── Kelas yang Diampu & Rombel Aktif
│   ├── Action Center: "Siapa Siswa yang Perlu Ditindaklanjuti Hari Ini?"
│   │   ├── Belum membaca materi (tertinggal > X halaman)
│   │   ├── Menunggak tugas / belum submit
│   │   └── Nilai di bawah KKM (perlu remedial)
│   ├── Tugas Menunggu Koreksi (Shortcut ke Mass Grader)
│   └── Kuis / CBT Aktif
│
├── 2. Kelas Saya
│   ├── Daftar Rombel & Jenjang
│   ├── Daftar Siswa per Kelas
│   ├── Detail Profil Siswa, Kehadiran, & Riwayat Tugas
│   └── Ringkasan Progress Belajar Kelas
│
├── 3. Materi Pembelajaran & Buku Nasional
│   ├── Buat Materi Baru (Rich text, video embed, file attachment)
│   ├── Integrasi Katalog Perpustakaan Buku Nasional Kemendikbud
│   ├── Penugasan Membaca (*Assign Reading Material*)
│   ├── Target Rombel & Jadwal Publikasi
│   └── Preview Format Siswa
│
├── 4. Tugas Siswa (Workstation Assignment)
│   ├── Pembuat Tugas Terstruktur (PG + Esai + Rubrik)
│   ├── Pengaturan Batas Waktu & Bobot Nilai
│   └── **Mass Essay Grader (Koreksi Massal)**
│       ├── Split-screen: Lembar Jawaban Digital Siswa vs Panel Penilaian
│       ├── Input Skor per Soal Esai + Feedback Cepat
│       └── Keyboard Shortcut (`Alt + Panah Kanan` untuk siswa berikutnya)
│
├── 5. Kuis & CBT
│   ├── Bank Soal Sekolah & Bank Soal Pribadi Guru
│   ├── Pembuat Assessment (Pilihan Ganda, Esai, Pembahasan)
│   ├── Timer, Acak Soal, & Token Akses
│   └── Analisis Butir Soal (Daya pembeda, tingkat kesulitan)
│
├── 6. Penilaian & Buku Nilai (Gradebook)
│   ├── Grid Spreadsheet Nilai per Kelas
│   ├── Komponen Tugas, Kuis, Formatif, Sumatif
│   ├── Rekap Rata-Rata Nilai Harian
│   └── Ekspor Nilai ke Excel & Rapor
│
├── 7. Kehadiran & Presensi
│   ├── Monitoring Presensi Kelas Harian
│   ├── Rekap Persentase Kehadiran per Siswa
│   └── Riwayat Absensi
│
├── 8. Tanya Guru & Diskusi Materi (Inquiry)
│   ├── Thread Pertanyaan Siswa Berdasarkan Materi
│   ├── Filter Pertanyaan Belum Dijawab
│   └── Penyelesaian Diskusi (*Mark as Resolved*)
│
├── 9. Teacher Analytics (Monitoring Pembelajaran)
│   ├── Matriks Reading Progress (Halaman terbaca, waktu baca)
│   ├── Task & Quiz Completion Rate
│   ├── Radar Penguasaan Kompetensi Materi
│   └── Deteksi Dini Risiko Akademik Siswa
│
├── 10. Notifikasi & Pengumuman
│   ├── Notifikasi Pengumpulan Tugas & Kuis Siswa
│   ├── Pesan Inquiry Baru dari Siswa
│   └── Pengumuman Sekolah
│
└── 11. Profil & Pengaturan Guru
    ├── Profil GTK (NIP, NUPTK, Mata Pelajaran)
    └── Preferensi Notifikasi & Password
```

---

## 3. Standar Arsitektur Modular Frontend

Untuk menjamin skalabilitas, kemudahan *maintenance*, dan mencegah *file bloat*, modul guru dibangun dengan struktur folder berikut:

```text
frontend/src/
│
├── features/teacher/                         <── MODUL DOMAIN ISOLATED
│   ├── api/                                  # API Client Calls (Pure Fetchers)
│   │   ├── teacher-api.ts                    # Profil guru, rombel diampu, jadwal
│   │   ├── action-center-api.ts              # Data agregasi siswa berisiko & pending tasks
│   │   ├── mass-grading-api.ts               # Submit batch scores & feedback
│   │   ├── reading-analytics-api.ts          # Integrasi reading_progress & library
│   │   └── inquiry-api.ts                    # Diskusi tanya guru per materi
│   │
│   ├── types/                                # Type Definitions (Strict, No 'any')
│   │   ├── teacher-workstation.ts            # Tipe jadwal, rombel, profil
│   │   ├── action-center.ts                  # DTO siswa berisiko & rekomendasi tindakan
│   │   ├── mass-grading.ts                   # DTO submission, lembar kerja, & skor esai
│   │   └── reading-analytics.ts              # DTO matriks membaca materi & buku
│   │
│   ├── hooks/                                # Custom Hooks (State & Data Orchestration)
│   │   ├── use-teacher-action-center.ts      # Fetcher & filter siswa perlu perhatian
│   │   ├── use-mass-grader.ts                # State navigasi siswa, draft skor, shortcut
│   │   ├── use-reading-analytics.ts          # Perhitungan persentase bacaan kelas
│   │   └── use-teacher-classes.ts            # Filter dan pemilihan rombel aktif
│   │
│   ├── components/                           # Sub-Komponen Ringkas (<200 baris)
│   │   ├── action-center/                    # Modul Dashboard Action Center
│   │   │   ├── ActionCenterHeader.tsx
│   │   │   ├── AtRiskStudentsWidget.tsx      # Widget siswa tertinggal/perlu perhatian
│   │   │   ├── PendingGradingWidget.tsx      # Widget antrean koreksi tugas
│   │   │   ├── TodayScheduleWidget.tsx       # Widget jadwal mengajar hari ini
│   │   │   └── action-center.module.css
│   │   │
│   │   ├── mass-grader/                      # Modul Koreksi Esai Massal
│   │   │   ├── MassGraderWorkspace.tsx       # Layout container split-screen
│   │   │   ├── StudentSubmissionSidebar.tsx  # Sidebar list siswa & status koreksi
│   │   │   ├── DigitalWorksheetViewer.tsx    # Viewer lembar jawaban digital PKBM
│   │   │   ├── EssayScoreFeedbackPanel.tsx   # Panel input nilai & komentar cepat
│   │   │   └── mass-grader.module.css
│   │   │
│   │   ├── analytics/                        # Modul Teacher Analytics
│   │   │   ├── ReadingProgressMatrix.tsx     # Tabel progress baca buku/materi
│   │   │   ├── TaskCompletionChart.tsx       # Grafik persentase tugas terkumpul
│   │   │   ├── RiskRadarCard.tsx             # Kartu deteksi dini akademik
│   │   │   └── analytics.module.css
│   │   │
│   │   └── shared/                           # Komponen Reusable
│   │       ├── TeacherWorkspaceHeader.tsx    # Header seragam workstation
│   │       ├── RiskBadge.tsx                 # Badge status risiko (Tinggi/Sedang/Aman)
│   │       └── StatMetricBox.tsx             # Kotak metrik ringkas
│   │
│   └── index.ts                              # Public Exports
│
└── app/(dashboard)/dashboard/teacher/        <── NEXT.JS APP ROUTER (THIN PAGES ONLY)
    ├── page.tsx                              # Thin (~40 baris): renders <TeacherActionCenterView />
    ├── classes/
    │   └── page.tsx                          # Thin (~40 baris): renders <TeacherClassesView />
    ├── grading/
    │   └── page.tsx                          # Thin (~40 baris): renders <MassGraderView />
    ├── analytics/
    │   └── page.tsx                          # Thin (~40 baris): renders <TeacherAnalyticsView />
    └── inquiry/
        └── page.tsx                          # Thin (~40 baris): renders <TeacherInquiryView />
```

---

## 4. Aturan Penulisan Kode (Coding Guidelines)

1. **Thin Page Rule**: File di dalam `app/**/page.tsx` **dilarang memuat state kompleks atau styling besar**. Fungsinya murni sebagai router dan penyusun (*composer*) komponen dari `features/teacher/`.
2. **Component Size Rule**: Komponen maksimal **200–250 baris**. Jika lebih, pisahkan menjadi sub-komponen terisolasi.
3. **No Cross-Pollution**: Dilarang mengedit atau mengubah struktur modul lain (`dapodik`, `students`, `academic-years`) kecuali saat mendaftarkan menu navigasi di [`layout.tsx`](file:///c:/Users/USER/Documents/School%20Os/frontend/src/app/%28dashboard%29/layout.tsx).
4. **Endpoint Reusability**: Mengonsumsi endpoint yang sudah ada di backend Rust tanpa membuat duplikasi logika:
   - `/api/v1/learning/materials` & `/library`
   - `/api/v1/learning/assignments` & `/submissions`
   - `/api/v1/learning/quizzes` & `/attempts`
   - `/api/v1/learning/inquiries`
   - `/api/v1/learning/progress`
   - `/api/v1/classes`
   - `/api/v1/grading`
