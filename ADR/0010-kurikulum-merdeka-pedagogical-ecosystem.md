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

### 1. Bounded Context CP (Capaian Pembelajaran)
- Entitas: `LearningOutcome` (CP), `LearningObjective` (TP), `LearningObjectiveFlow` (ATP).
- Menyediakan master data CP resmi per jenjang, fase, dan mata pelajaran.
- Integrasi generative AI untuk dekonstruksi CP menjadi indikator ketercapaian tujuan pembelajaran.

### 2. Bounded Context RPP / Modul Ajar
- Entitas: `LessonPlan` (Modul Ajar).
- Komponen inti: Identitas, Target Profil Pelajar Pancasila, Tujuan Pembelajaran, Pemahaman Bermakna, Pertanyaan Pemantik, Kegiatan Pembelajaran Berdiferensiasi, Asesmen, dan Lampiran LKPD.
- Berelasi langsung dengan materi pembelajaran digital (`LearningMaterial`) dan tugas/kuis.

### 3. Bounded Context Asesmen
- Entitas: `AssessmentSession`, `AssessmentItem`, `AssessmentRubric`.
- Diklasifikasikan dalam 3 taksonomi:
  * **Diagnostik**: Kognitif & non-kognitif awal bab.
  * **Formatif**: Lembar observasi, kuis interaktif, dan tugas refleksi berkala.
  * **Sumatif**: Ulangan harian lingkup materi, Penilaian Tengah Semester (PTS/STS), Penilaian Akhir Semester (PAS/SAS).
- Nilai diagregasikan ke `GradeBook` dan `ReportCard`.

### 4. Bounded Context Kalender Pendidikan (Kaldik)
- Entitas: `academic_calendar_events` (PostgreSQL), `CalendarEvent`, `EffectiveWeekAllocation`.
- Menghitung otomatis Minggu Efektif Belajar (MEB: 18 Ganjil + 17 Genap = 35 Pekan) dan Hari Efektif Belajar (HEB: ~175-180 Hari) per semester.
- **Integrasi Teacher Workstation**:
  * Tampil di sidebar Teacher Workstation (`/dashboard/teacher/calendar`).
  * Widget `TeacherCalendarWidget` terpasang di **Action Center Dashboard Guru** (`/dashboard/teacher`) untuk memantau sisa pekan efektif dan timeline asesmen (STS/SAS/ANBK) secara real-time.
  * Mengunci timeline pelaksanaan asesmen dan sinkronisasi agenda mengajar guru sebagai acuan penyusunan Prota, Promes, dan RPP/Modul Ajar.

### 5. Bounded Context G7KAIH (Karakter & Pembiasaan)
- Entitas: `HabitTrackerEntry`, `HabitCategory`, `ParentVerification`.
- 7 Indikator Kebiasaan:
  1. *Bangun Pagi*
  2. *Beribadah*
  3. *Berolahraga*
  4. *Makan Sehat & Bergizi*
  5. *Gemar Belajar*
  6. *Bermasyarakat*
  7. *Tidur Tepat Waktu*
- Dilengkapi mekanisme verifikasi orang tua dan pembina/wali kelas sebagai data catatan sikap rapor.

---

## Consequences

- **Positif**:
  - Guru menghemat waktu administratif hingga 80% melalui alur data otomatis antar dokumen.
  - Sesuai dengan regulasi Kemendikbudristek & Kemendikdasmen RI terkini.
  - Sekolah memiliki transparansi menyeluruh dari perencanaan, kalender waktu, pelaksanaan materi, hingga evaluasi karakter siswa.
- **Negatif**:
  - Diperlukan master data kurikulum yang akurat dan modul UI yang mudah digunakan oleh guru dengan tingkat literasi digital beragam.
