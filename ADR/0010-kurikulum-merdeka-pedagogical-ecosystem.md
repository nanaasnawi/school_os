# ADR 0010: Kurikulum Merdeka Pedagogical Ecosystem (RPP, CP, Asesmen, Kaldik, G7KAIH)

- **Status**: Accepted
- **Date**: 2026-10-10
- **Author**: Platform Architecture & Pedagogical Engineering Team

---

## Context

Platform School OS / Akselerasi Edu dikembangkan untuk satuan pendidikan formal dan non-formal (PKBM) di Indonesia yang mengadopsi standar **Kurikulum Merdeka** serta arahan penguatan karakter nasional terbaru dari **Kementerian Pendidikan Dasar dan Menengah (Kemendikdasmen RI)**.

Selama ini, guru dan sekolah menghadapi fragmentasi sistem administrasi akademik, di mana dokumen perencanaan, target kurikulum, evaluasi nilai, alokasi waktu tahun ajaran, dan pembiasaan karakter peserta didik tercatat secara terpisah. Dibutuhkan desain arsitektur domain terpadu yang memayungi 5 pilar pedagogis utama:

1. **RPP / Modul Ajar**: Perencanaan pembelajaran operasional per pertemuan/bab materi.
2. **CP (Capaian Pembelajaran)**: Standar kompetensi minimum per Fase (Fase A–F) yang diturunkan ke TP (Tujuan Pembelajaran) dan ATP (Alur Tujuan Pembelajaran).
3. **Asesmen (Assessment)**: Evaluasi multi-tahap (Diagnostik, Formatif, dan Sumatif).
4. **Kaldik (Kalender Pendidikan)**: Penjadwalan alokasi Minggu Efektif Belajar (MEB), Hari Efektif, dan agenda evaluasi semester.
5. **G7KAIH (Gerakan 7 Kebiasaan Anak Indonesia Hebat)**: Pembiasaan karakter harian siswa (Bangun Pagi, Beribadah, Berolahraga, Makan Sehat Bergizi, Gemar Belajar, Bermasyarakat, Tidur Tepat Waktu).

---

## Decision

Kami menetapkan arsitektur ekosistem pedagogis terpadu dengan relasi agregat domain dan aliran data terintegrasi:

```mermaid
graph TD
    CP[1. Capaian Pembelajaran (CP / Fase)] -->|Diturunkan via AI/Guru| TP[Tujuan Pembelajaran (TP & ATP)]
    KALDIK[4. Kalender Pendidikan (MEB & Agenda)] -->|Alokasi Pekan Mengajar| RPP[2. RPP / Modul Ajar]
    TP -->|Inti Pembelajaran| RPP
    RPP -->|Materi Terstruktur| LMS[LMS / Materi Digital (Video, PDF, Infografis)]
    RPP -->|Instrumen Evaluasi| ASESMEN[3. Asesmen (Diagnostik, Formatif, Sumatif)]
    ASESMEN -->|Rekap Nilai Otomatis| RAPOR[Buku Nilai & Rapor Kurikulum Merdeka]
    G7KAIH[5. Jurnal Karakter G7KAIH] -->|Catatan Sikap & Pembiasaan| RAPOR
```

### 1. Bounded Context CP (Capaian Pembelajaran) & Dekonstruksi TP/ATP
- Entitas: `LearningOutcome` (CP), `LearningObjective` (TP), `LearningObjectiveFlow` (ATP), `CurriculumAiCache`.
- **Prinsip Otoritas & Provenance**: CP adalah dokumen hukum otoritatif yang mengikat. AI dilarang mengarang atau mengubah teks CP resmi.
  * Status Verifikasi CP: `NATIONAL_VERIFIED` (dokumen resmi BSKAP/Kemendikdasmen), `SCHOOL_VERIFIED` (KOSP sekolah), atau `UNVERIFIED_DRAFT`. Default sistem selalu `UNVERIFIED`.
- **Lifecycle State Machine**: Seluruh hasil dekonstruksi TP dan susunan ATP dari AI berstatus awal `DRAFT`.
  * Alur: `DRAFT` -> Ditelaah/diedit guru (`REVIEWED`) -> Disahkan guru/tim kurikulum secara transaksional (`PUBLISHED`).
  * Modul Ajar (RPP), LMS, dan Asesmen hanya boleh mengonsumsi TP/ATP berstatus `PUBLISHED`.
- **Idempotency & Concurrency Cache**: Cache komposit berbasis `hash(tenant_id, cp_id, cp_version, grade, year, model, prompt_version)`. Regenerasi menghasilkan versi draf baru tanpa menimpa data yang telah dipublikasikan.
- **Relasi Kalender Sekolah**: Alokasi JP dan pekan pembelajaran ATP diikat secara relasional melalui tabel `learning_flow_calendar_events` ke agenda Kaldik satuan pendidikan masing-masing.

### 2. Bounded Context RPP / Modul Ajar
- Entitas: `ModulAjar` (tabel `modul_ajar`), `LearningObjective` (FK), `AcademicCalendarEvent`.
- Komponen inti: Identitas, Target Profil Pelajar Pancasila, Rumusan TP, Pemahaman Bermakna, Pertanyaan Pemantik, Kegiatan Pembelajaran Berdiferensiasi, Rencana Asesmen, dan Lampiran LKPD.
- **Aturan 1 (Sinkronisasi Alokasi Waktu Kaldik - MEB Engine)**:
  * Alokasi jam pelajaran (JP) Modul Ajar wajib dikunci terhadap alokasi Minggu Efektif Belajar (MEB: 18 Pekan Ganjil / 17 Pekan Genap) dari Kaldik Fase 1.
  * Formula batas: `Kapasitas Semester = MEB * JP_Mingguan_Mapel`.
  * Validasi keras: Sistem menolak pembuatan dan aktivasi RPP jika `alokasi_rpp_jp + sum(rpp_aktif_semester) > Kapasitas_Semester`.
- **Aturan 2 (Relasi Otoritatif TP PUBLISHED & Suspensi Reaktif)**:
  * RPP tidak boleh berupa teks bebas mengambang. RPP wajib memegang FK `learning_objective_id` ke TP yang berstatus `PUBLISHED`.
  * *Suspensi Reaktif (Cascade Trigger)*: Ketika status TP diturunkan kembali ke `DRAFT` atau `REVIEWED`, PostgreSQL trigger otomatis mengubah seluruh RPP yang terikat menjadi `SUSPENDED` beserta `suspension_reason` untuk menjaga integritas kurikulum.
- **Aturan 3 (Strategi Pembelajaran Berdiferensiasi 3-Pilar)**:
  * Struktur JSONB `differentiation_strategies` memisahkan:
    1. *Konten* (Variasi sumber: teks ringkas, infografis visual, podcast audio, bahan manipulatif konkret).
    2. *Proses* (Sintaks scaffolding berjenjang: kelompok bimbingan intensif, kelompok mandiri kolaboratif, kelompok tantangan pengayaan).
    3. *Produk* (Pilihan asesmen unjuk kerja: laporan tertulis, mind-map infografis, video/presentasi demonstrasi, produk fisik).
  * Berfungsi sebagai jembatan langsung ke Asesmen Diagnostik Fase 4.
- Berelasi langsung dengan materi pembelajaran digital (`LearningMaterial`) dan tugas/kuis.

### 3. Bounded Context Asesmen (Taksonomi Kurikulum Merdeka)
- Entitas: `PedagogicalAssessment` (tabel `pedagogical_assessments`), `AssessmentStudentResult` (tabel `assessment_student_results`), `KKTPCriteria`.
- **Taksonomi 3-Tingkat Berkelanjutan**:
  1. **Asesmen Diagnostik (Awal Pembelajaran)**:
     * *Non-Kognitif*: Pemetaan gaya belajar (Visual, Auditori, Kinestetik) dan minat siswa.
     * *Kognitif*: Pengujian kesiapan prasyarat awal materi.
     * *Output Jembatan*: Menghasilkan pengelompokan 3-tier (*Needs Guidance*, *Regular*, *Advanced*) yang langsung menjadi input pembagian stasiun belajar pada Modul Ajar Fase 3.
  2. **Asesmen Formatif (Sepanjang Pembelajaran - Assessment FOR & AS Learning)**:
     * Memantau perkembangan Indikator Ketercapaian Tujuan Pembelajaran (IKTP).
     * Berbasis rubrik kualitatif: *Perlu Bimbingan (0-65)*, *Cukup (66-75)*, *Baik (76-85)*, *Sangat Baik (86-100)*.
     * Berfungsi sebagai dasar refleksi dan intervensi scaffolding, **bukan penentu nilai akhir rapor**.
  3. **Asesmen Sumatif (Akhir Lingkup Materi & Akhir Semester - Assessment OF Learning)**:
     * *Sumatif Lingkup Materi*: Wajib terikat ke `learning_objectives(id)` berstatus `PUBLISHED`.
     * *Sumatif Akhir Semester (SAS)*: Terikat secara relasional ke jadwal `academic_calendar_events(id)` dari Kaldik.
     * *Formula KKTP & Rapor*: Menggantikan KKM kaku tradisional. Menghitung nilai akhir semester dari rata-rata sumatif TP dan SAS, serta otomatis menghasilkan **Narasi Deskripsi Capaian Tertinggi** dan **Capaian yang Perlu Ditingkatkan** untuk e-Rapor resmi Kemendikdasmen RI.
- Nilai teragregasi otomatis ke `GradeBook` dan `ReportCard`.

### 4. Bounded Context Kalender Pendidikan (Kaldik)
- Entitas: `academic_calendar_events` (PostgreSQL), `CalendarEvent`, `EffectiveWeekAllocation`.
- Menghitung otomatis Minggu Efektif Belajar (MEB: 18 Ganjil + 17 Genap = 35 Pekan) dan Hari Efektif Belajar (HEB: ~175-180 Hari) per semester.
- **Integrasi Teacher Workstation**:
  * Tampil di sidebar Teacher Workstation (`/dashboard/teacher/calendar`).
  * Widget `TeacherCalendarWidget` terpasang di **Action Center Dashboard Guru** (`/dashboard/teacher`) untuk memantau sisa pekan efektif dan timeline asesmen (STS/SAS/ANBK) secara real-time.
  * Mengunci timeline pelaksanaan asesmen dan sinkronisasi agenda mengajar guru sebagai acuan penyusunan Prota, Promes, dan RPP/Modul Ajar.

### 5. Bounded Context G7KAIH (Karakter & Pembiasaan)
- Entitas: `HabitTrackerEntry` (tabel `habit_tracker_entries`), `Notification`, `GradeBookSnapshot`.
- **7 Indikator Kebiasaan Pokok (Kemendikdasmen RI)**:
  1. *Bangun Pagi* (`bangun_pagi`)
  2. *Beribadah* (`beribadah`)
  3. *Berolahraga* (`berolahraga`)
  4. *Makan Sehat & Bergizi* (`makan_sehat`)
  5. *Gemar Belajar & Membaca* (`gemar_belajar`)
  6. *Bermasyarakat & Gotong Royong* (`bermasyarakat`)
  7. *Tidur Tepat Waktu* (`tidur_tepat_waktu`)
- **Pola Penyimpanan Hemat (Single-Row JSONB Architecture)**:
  * 1 baris per siswa per tanggal (`uq_habit_entry_student_date`), mencegah ledakan baris data database secara eksponensial.
  * Status kebiasaan disimpan dalam kolom JSONB `habits` dengan GIN indexing.
  * Pre-computed columns `completed_count` (0-7) dan `compliance_rate` (0.00-100.00%) dihitung secara instan melalui trigger `trg_calculate_habit_metrics` pada level database PostgreSQL.
- **Aturan Fallback Window 7 Hari & Otoritas Override Wali Kelas**:
  * Mengatasi tantangan orang tua yang pasif atau belum melek teknologi.
  * Fungsi tersimpan `fn_expire_stale_habit_entries` menandai entri `PENDING` yang berumur > 7 hari menjadi `SYSTEM_EXPIRED`.
  * Wali Kelas memiliki hak otoritas legal (*Teacher Override*) untuk menyetujui jurnal siswa secara massal berlandaskan pengamatan nyata di sekolah (`verification_status = 'TEACHER_OVERRIDE'`), sehingga tidak ada nilai sikap rapor anak yang kosong saat kenaikan kelas.
- **Mesin Sintesis Narasi Sikap e-Rapor Otomatis**:
  * Menghitung persentase kepatuhan semester per indikator:
    - $\ge 85\%$: *Sangat Membudaya* (Konsistensi Sangat Baik)
    - $70\% - 84.99\%$: *Berkembang Sesuai Harapan* (Mulai Membudaya)
    - $< 70\%$: *Perlu Bimbingan & Penguatan*
  * Merangkai paragraf kesimpulan kualitatif resmi e-Rapor Kurikulum Merdeka yang menonjolkan kekuatan karakter unggulan serta fokus kolaborasi bimbingan orang tua dan guru.
  * Mendukung injeksi langsung ke cache `gradebook_snapshots` untuk cetak rapor massal instan tanpa lag.
- **Digest Notifikasi Mingguan**:
  * Menghubungkan entri pending ke `notifications` dan antrean WhatsApp gateway (`local_bridge_outbox_jobs`) guna mengirimkan pengingat ramah kepada orang tua siswa.

---

## Consequences

- **Positif**:
  - Guru menghemat waktu administratif hingga 80% melalui alur data otomatis antar dokumen.
  - Sesuai dengan regulasi Kemendikbudristek & Kemendikdasmen RI terkini.
  - Sekolah memiliki transparansi menyeluruh dari perencanaan, kalender waktu, pelaksanaan materi, hingga evaluasi karakter siswa.
- **Negatif**:
  - Diperlukan master data kurikulum yang akurat dan modul UI yang mudah digunakan oleh guru dengan tingkat literasi digital beragam.
