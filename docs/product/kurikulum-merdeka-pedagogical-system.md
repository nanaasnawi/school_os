# Spesifikasi Fungsional: Ekosistem Pedagogis Kurikulum Merdeka (RPP, CP, Asesmen, Kaldik, G7KAIH)

> **Status:** Disetujui (Approved)  
> **Target:** Guru, Tenaga Kependidikan, Siswa, Wali Murid, dan Pengawas Sekolah di Platform School OS / Akselerasi Edu

---

## 1. Pendahuluan

Modul ini mengintegrasikan lima instrumen utama tata kelola pembelajaran dan pendidikan karakter berbasis regulasi resmi Kemendikbudristek & Kemendikdasmen RI ke dalam satu alur kerja digital yang terpadu (*unified workflow*).

---

## 2. Rincian 5 Pilar Pedagogis

### 1. CP (Capaian Pembelajaran) & Alur Tujuan Pembelajaran (ATP)
* **Deskripsi:** Kompetensi esensial dan target pembelajaran terstruktur per Fase (Fase A hingga F).
* **Fungsi Sistem:**
  * Master data Capaian Pembelajaran Nasional per Jenjang (SD/SMP/SMA dan Paket A/B/C PKBM).
  * Fitur AI-Assisted TP Breakdown: Membantu guru merumuskan Tujuan Pembelajaran (TP) dari teks CP yang kompleks.
  * Penyusunan Alur Tujuan Pembelajaran (ATP) berjenjang per semester.

### 2. RPP / Modul Ajar Kurikulum Merdeka
* **Deskripsi:** Dokumen perencanaan pelaksanaan pembelajaran per pertemuan atau per lingkup materi yang terintegrasi secara relasional dan taat asas.
* **3 Aturan Arsitektur Kunci (Fase 3):**
  1. **Sinkronisasi Alokasi Waktu Kaldik (MEB Engine):** Alokasi jam pelajaran (JP) diverifikasi terhadap sisa alokasi JP efektif semester dari Kaldik (18 MEB Ganjil / 17 MEB Genap). Sistem menolak jika `alokasi_rpp_jp > sisa_jp_efektif_semester`.
  2. **Relasi Otoritatif TP PUBLISHED & Suspensi Reaktif:** RPP wajib terikat pada `learning_objectives(id)` berstatus `PUBLISHED`. Jika status TP induk diturunkan kembali ke `DRAFT` atau `REVIEWED`, seluruh RPP terikat otomatis beralih ke status `SUSPENDED` melalui trigger database.
  3. **Strategi Pembelajaran Berdiferensiasi 3-Pilar:** Menampung diferensiasi Konten, Proses (Visual, Auditori, Kinestetik, serta Scaffolding), dan Produk sebagai jembatan ke Asesmen Diagnostik.
* **Komponen Standar:**
  * **Identitas Modul:** Nama Guru, Satuan Pendidikan, Fase/Kelas, Alokasi Waktu, Mata Pelajaran.
  * **Target Profil Pelajar Pancasila (P3):** Mandiri, Bernalar Kritis, Gotong Royong, Kreatif, Kebinekaan Global, Beriman & Bertakwa.
  * **Sarana & Prasarana:** Media pembelajaran digital, buku rujukan Kemendikbud.
  * **Komponen Inti:** Tujuan Pembelajaran, Pemahaman Bermakna, Pertanyaan Pemantik, Kegiatan Pembelajaran Berdiferensiasi (Pendahuluan, Inti, Penutup), Refleksi Guru dan Peserta Didik.
  * **Lampiran:** LKPD (Lembar Kerja Peserta Didik), Bahan Bacaan Guru & Siswa, Glosarium, Rubrik Penilaian.
* **Integrasi:** Terhubung langsung dengan Materi Pembelajaran digital (Video YouTube, Buku SIBI PDF, Infografis) dan Tugas/Kuis yang sudah dibuat di workstation guru.

### 3. Asesmen Berkelanjutan (Diagnostik, Formatif, Sumatif)
* **Asesmen Diagnostik:**
  * Non-Kognitif: Mengetahui minat, gaya belajar (Visual, Auditori, Kinestetik), dan kondisi psikologis anak.
  * Kognitif: Menguji pengetahuan prasyarat awal materi.
* **Asesmen Formatif:**
  * Dilakukan selama proses belajar (Assessment *for* and *as* learning).
  * Berupa latihan mandiri, kuis harian, lembar cek observasi, dan refleksi berkala.
* **Asesmen Sumatif:**
  * Dilakukan di akhir lingkup materi atau akhir semester (Assessment *of* learning).
  * Berupa tes tulis CBT, ujian praktik, Penilaian Tengah Semester (PTS/STS), dan Penilaian Akhir Semester (PAS/SAS).
  * Data teragregasi otomatis ke dalam Buku Nilai (Gradebook) dan Rapor Semester.

### 4. Kalender Pendidikan (Kaldik)
* **Deskripsi:** Matriks jadwal akademik tahunan yang diterbitkan oleh Dinas Pendidikan Provinsi/Kabupaten/Kota.
* **Fungsi Sistem:**
  * Visualisasi Kalender Akademik per Semester (Juli – Desember dan Januari – Juni).
  * Perhitungan otomatis **Minggu Efektif Belajar (MEB)** dan **Hari Efektif Belajar (HEB)**.
  * Kategori event:
    * 🟢 Hari Efektif Belajar (HEB)
    * 🔴 Libur Nasional & Cuti Bersama
    * 🟡 Libur Semester & Libur Hari Raya
    * 🔵 Asesmen & Ujian (MPLS, PTS/STS, PAS/SAS, Ujian Sekolah)
    * 🟣 Pembagian Rapor & Rapat Dinas / IHT
    * 🟠 Peringatan Hari Besar Nasional & P5 / Karya Siswa
  * Sinkronisasi jadwal modul guru ke alokasi minggu efektif tahun ajaran aktif.

### 5. G7KAIH (Gerakan 7 Kebiasaan Anak Indonesia Hebat)
* **Deskripsi:** Inisiatif pembiasaan karakter peserta didik dari Kemendikdasmen RI menuju Indonesia Emas 2045.
* **7 Kebiasaan Harian yang Dicatat:**
  1. **Bangun Pagi:** Kedisiplinan bangun sebelum subuh/fajar dan merapikan tempat tidur.
  2. **Beribadah:** Ibadah tepat waktu sesuai keyakinan masing-masing.
  3. **Berolahraga:** Senam pagi, jalan sehat, atau olahraga minimal 15-30 menit.
  4. **Makan Sehat dan Bergizi:** Membiasakan sarapan sehat, minum air putih cukup, dan gizi seimbang.
  5. **Gemar Belajar:** Membaca buku non-pelajaran/pelajaran minimal 15 menit per hari.
  6. **Bermasyarakat:** Membantu orang tua di rumah, menyapa tetangga, dan gotong royong.
  7. **Tidur Cepat / Tepat Waktu:** Istirahat malam cukup dan tidak begadang dengan gawai.
* **Fungsi Sistem:**
  * Checklist Jurnal Pembiasaan Karakter di portal/aplikasi siswa.
  * Konfirmasi / verifikasi checklist oleh orang tua siswa.
  * Rekapitulasi perkembangan karakter untuk catatan sikap wali kelas pada buku rapor.

---

## 3. Prioritas Implementasi

| Fase | Modul | Status |
|:---:|---|:---:|
| **Fase 1** | **Kalender Pendidikan (Kaldik)** | **Selesai (Completed: Kaldik MEB Engine, Academic Calendar Events)** |
| **Fase 2** | **Master Data CP & Alur TP/ATP (AI On-Demand)** | **Selesai (Completed: Registry, NIM Synthesizer, Workstation UI)** |
| **Fase 3** | **RPP / Modul Ajar Generator & Hub** | **Selesai (Completed: Kaldik MEB Engine, TP Relational Guard & Cascade Trigger, Differentiated Strategies 3-Pilar)** |
| **Fase 4** | **Integrasi Taksonomi Asesmen (Diagnostik, Formatif, Sumatif)** | **Selesai (Completed: PPA Formula Engine, Hybrid Quantitative-Qualitative Schema, Pre-Calculated Snapshot Cache, Suspended Guard)** |
| **Fase 5** | **Jurnal Pembiasaan Karakter G7KAIH & Verifikasi Wali** | **Selesai (Completed: Single-Row JSONB Storage, 7-Day Fallback Window, Teacher Override Authority, Automated Attitude Narrative Engine)** |

---

## 4. Ekosistem Pedagogis Kurikulum Merdeka Resmi Berstatus Selesai (All 5 Pillars Completed)

Seluruh 5 pilar dalam rancangan arsitektur pedagogis Kurikulum Merdeka (Kemendikdasmen RI / BSKAP No. 033/H/KR/2024) telah diimplementasikan secara komprehensif, teruji secara integratif, serta siap melayani kegiatan akademik guru, siswa, dan orang tua.

