# Diagram Sistem Administrasi Akademik SDN 1 Siliasih

Berikut adalah rancangan awal untuk **Flowchart Utama Sistem** dan **Sequence Diagram** (contoh kasus: Input Nilai oleh Guru) untuk Sistem Administrasi Akademik Digital.

## 1. Flowchart Utama Sistem

Flowchart ini menggambarkan alur kerja umum berdasarkan peran pengguna (Admin, Guru, dan Siswa/Wali Murid).

```mermaid
flowchart TD
    A([Start]) --> B[Halaman Login]
    B --> C{Autentikasi & Cek Role}
    
    C -- Gagal --> B
    
    C -- Berhasil: Admin --> D[Dashboard Admin]
    C -- Berhasil: Guru --> E[Dashboard Guru]
    C -- Berhasil: Siswa/Wali --> F[Dashboard Siswa]
    
    D --> G[Kelola Data Master]
    G --> G1(Data Siswa)
    G --> G2(Data Guru)
    G --> G3(Data Kelas & Jadwal)
    
    E --> H[Manajemen Akademik]
    H --> H1(Input Absensi)
    H --> H2(Input Nilai)
    
    F --> I[Informasi Akademik]
    I --> I1(Lihat Jadwal)
    I --> I2(Lihat Absensi & Nilai)
    
    G1 --> Z([Logout])
    G2 --> Z
    G3 --> Z
    H1 --> Z
    H2 --> Z
    I1 --> Z
    I2 --> Z
    
    Z --> End([Selesai])
```

## 2. Sequence Diagram (Skenario: Input Nilai oleh Guru)

Sequence diagram ini menjelaskan interaksi antar komponen sistem ketika seorang Guru memasukkan nilai untuk siswa.

```mermaid
sequenceDiagram
    actor Guru
    participant Aplikasi (Client)
    participant Server API
    participant Database

    Guru->>Aplikasi (Client): Buka menu "Input Nilai"
    Aplikasi (Client)->>Server API: GET /api/kelas-ajar
    Server API->>Database: Query jadwal & kelas guru
    Database-->>Server API: Return data kelas
    Server API-->>Aplikasi (Client): Data kelas JSON
    Aplikasi (Client)-->>Guru: Tampilkan daftar kelas
    
    Guru->>Aplikasi (Client): Pilih kelas tertentu
    Aplikasi (Client)->>Server API: GET /api/siswa?kelas_id=XYZ
    Server API->>Database: Query data siswa
    Database-->>Server API: Return data siswa
    Server API-->>Aplikasi (Client): Data siswa JSON
    Aplikasi (Client)-->>Guru: Tampilkan form input nilai siswa

    Guru->>Aplikasi (Client): Masukkan nilai & klik "Simpan"
    Aplikasi (Client)->>Server API: POST /api/nilai (Data Nilai)
    Server API->>Server API: Validasi data
    Server API->>Database: Insert/Update tabel nilai
    Database-->>Server API: Sukses tersimpan
    Server API-->>Aplikasi (Client): Status 200 OK
    Aplikasi (Client)-->>Guru: Tampilkan notifikasi "Nilai berhasil disimpan"
```
