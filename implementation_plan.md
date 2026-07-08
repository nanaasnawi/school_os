# Implementation Plan: School OS (Ekosistem Digital)

Visi proyek telah berevolusi! Bukan lagi sekadar "Sistem Administrasi", melainkan **Platform Operasional Sekolah + Pembelajaran (School OS)** dengan filosofi arsitektur modular yang kuat dan sangat fleksibel.

Platform ini akan menggunakan **Rust (Backend)**, **Next.js + Tailwind CSS (Frontend)**, dan **PostgreSQL (Database)**.

## User Review Required

> [!IMPORTANT]
> **Persetujuan Visi & Roadmap Baru**
> Visi Anda sangat brilian dan membedakan sistem ini dari aplikasi biasa. Untuk mencapainya tanpa membuat sistem berantakan (spaghetti code), kita harus membangunnya secara bertahap (per fase).
> 
> Mohon tinjau **Roadmap** di bawah ini. Jika Anda setuju dengan urutan pengerjaannya, silakan klik **Proceed** agar saya bisa mereset checklist dan mulai membangun *Core Foundation* di repositori kita!

## Roadmap School OS (Menuju Ekosistem Sempurna)

Membangun ekosistem raksasa membutuhkan fondasi yang kokoh. Kita tidak bisa langsung melompat membuat kuis (LMS) jika data sekolah dan guru belum terdaftar.

Berikut adalah urutan pembangunannya:

### Phase 1: Core Platform & Identity (Fondasi Mutlak)
*Membangun pondasi agar sistem bisa dipakai bertahun-tahun dan di sekolah manapun.*
- Setup struktur *Monorepo* dan Database PostgreSQL.
- **Tenant Management**: Agar sistem bisa dipakai SDN 1 Siliasih, lalu direplikasi ke sekolah lain.
- **Identity & Role**: Login dinamis untuk Kepala Sekolah, Guru, Siswa, dan Orang Tua.
- **Academic Foundation**: Tahun Ajaran & Profil Sekolah.

### Phase 2: Academic & People Management
- Master Data: Pendaftaran Guru, Siswa, Kelas, dan Mata Pelajaran.
- Absensi Engine (Guru & Siswa).
- Jadwal Pelajaran Dasar.

### Phase 3: Learning Center & Workspaces (Visi Utama)
- **Teacher Workspace**: Ruang kerja guru untuk upload materi (Video, PDF), buat tugas, dan kuis.
- **Student Center**: Dashboard gamifikasi siswa (Siswa melihat jadwal hari ini, *to-do list* kuis, dan materi).
- Interkoneksi dasar (Siswa submit tugas, Guru menerima notifikasi).

### Phase 4: Assessment Engine & Automation
- *The Magic Interconnection*: Siswa selesai Kuis -> *Event Bus* terpicu -> Nilai masuk Assessment Engine -> Leger & Rapor terupdate otomatis.
- Implementasi Badge Prestasi Siswa.

### Phase 5: Analytics & Parent Portal
- **Principal Dashboard**: Analitik 30-detik (Guru hadir 100%, Siswa Hadir 96%, Kelas belum dinilai).
- **Parent Portal**: Pantauan *real-time* absensi dan nilai anak tanpa perlu chat WA ke wali kelas.

## Technical Strategy (Rust + Event-Driven)

Untuk menjamin agar:
> "Setiap modul berdiri sendiri tetapi saling terhubung"

Kita akan menggunakan **Event-Driven Architecture (EDA)** di dalam aplikasi Rust kita.
Saat ada sebuah aksi (misalnya Kuis Selesai), modul tidak langsung menembak database rapor. Modul LMS akan berteriak (Publish Event): *"Siswa A dapat nilai 90 di Kuis Matematika!"*. Kemudian, Modul Assessment yang akan mendengar teriakan tersebut dan memasukkannya ke kalkulasi nilai secara mandiri. Ini memastikan *School OS* tidak mudah *crash* saat fitur bertambah.

## Verification Plan
1. Memastikan kerangka kerja Rust dirancang mendukung *Message / Event Bus* internal.
2. Memastikan struktur UI Next.js diatur berdasarkan Layout *Role* (Teacher Workspace memiliki navigasi berbeda total dengan Student Center).
