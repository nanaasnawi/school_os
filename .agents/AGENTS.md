# Konstitusi Proyek (Engineering Constitution): School OS

Aturan ketat pengembangan teknis yang harus selalu diikuti oleh semua AI dan developer dalam proyek ini. Konstitusi ini memastikan arsitektur tetap konsisten dan tidak berubah menjadi *spaghetti code*.

## Aturan Arsitektur & Logika Bisnis
1. **Domain Murni (Tanpa Ketergantungan Framework)**
   Domain layer tidak boleh bergantung pada *framework* atau *library* eksternal. Rust hanyalah alat; aturan sekolah tetap murni sebagai *business logic*.
2. **Tidak Ada Business Logic di Frontend**
   Next.js murni bertindak sebagai *Presentation Layer*. Tanggung jawabnya hanya UI, validasi UX, *state management*, dan memanggil API. Seluruh logika akademik, perhitungan nilai, atau aturan kelulusan wajib diproses di Backend (Rust).
3. **Pemisahan Logika Bisnis di Backend**
   Tidak boleh ada satupun *business rule* di level Controller (REST API). Semua logika wajib berada di dalam `Engine` atau `Domain Service`.
4. **Batas Tanggung Jawab (Single Responsibility Engine)**
   Setiap *Engine* beroperasi secara independen. `Assessment Engine` tidak mengurus notifikasi; `Communication Hub` tidak menghitung nilai. Semua nama *module*, *entity*, dan *service* wajib menggunakan bahasa domain pendidikan, BUKAN nama halaman UI.
5. **Application Layer Gateway**
   Semua operasi dan interaksi lintas modul dari luar (seperti request dari REST API Frontend) harus melewati *Application Layer*. Jangan *bypass* langsung ke Domain atau Repository.

## Aturan Data & Infrastruktur
6. **Domain-Driven Database Schema**
   Desain skema dan penamaan tabel di PostgreSQL wajib mengikuti penamaan entitas domain (misal: `academic_years`, `enrollments`, `assessments`), BUKAN nama UI/Halaman (jangan gunakan nama seperti `tbl_dashboard` atau `tbl_input_nilai`).
7. **Event-Driven Architecture (EDA) Mutlak**
   Semua perubahan data yang berdampak luas wajib menghasilkan *Event* (misal: `StudentEnrolled`, `GradeUpdated`). Event Bus ini bersifat internal di dalam Rust, dan Frontend tidak perlu tahu tentang pertukaran pesan ini.
8. **Audit Log Sentralisasi**
   Setiap perubahan data kritis atau aksi penting wajib tercatat (Siapa, Mengubah Apa, Kapan, Berdasarkan apa) menggunakan `Audit Engine`.
9. **Visi Multi-Tenant Sejak Hari Pertama**
   Sistem dirancang untuk menampung banyak sekolah (Multi-Tenant). Anggap SDN 1 Siliasih hanya sebagai **laboratorium validasi**. Jika fitur yang diminta terlalu spesifik untuk satu sekolah, jadikan itu konfigurasi (di *School Rules Engine*) atau *plugin*, JANGAN mengotori *Core Platform*.

## Standar Mutu Enterprise
10. **Backward Compatibility**
    Perubahan pada API publik, Event, atau Database Schema tidak boleh memutus kompatibilitas tanpa melalui proses migrasi yang terdokumentasi (Migration Plan, Versioning, Deprecation Strategy).
11. **Explicit Contracts**
    Setiap komunikasi antar layer wajib menggunakan kontrak yang jelas (DTO -> Application -> Command/Query -> Domain -> Entity). Jangan pernah mengirim Entity langsung ke Frontend.
12. **Repository Isolation**
    Repository hanya boleh membaca dan menyimpan data. Repository TIDAK BOLEH menghitung nilai, menentukan kelulusan, atau membuat notifikasi.
13. **Engine Independence**
    Engine tidak boleh saling bergantung langsung secara *hard-coupled*. Jika `Notification Engine` mati, `Assessment Engine` (Input Nilai) harus tetap berhasil berjalan.
14. **Configuration over Code**
    Semua yang berpotensi berubah harus menjadi konfigurasi (KKM, Semester, Predikat, Kurikulum, Bobot Nilai, Hari Libur). Jangan di-*hardcode*.
15. **Security by Default**
    Pola semua endpoint harus: `Authenticate -> Authorize -> Validate -> Execute`. Bukan sebaliknya.
16. **Observability**
    Setiap Engine harus menghasilkan Log, Metric, Audit, dan Error Context yang jelas untuk penelusuran bug.
17. **Domain First**
    Setiap request fitur baru dijawab dengan "Masuk domain apa?", bukan "Halaman apa?". (Contoh: "Upload Materi" -> `Learning Engine`, bukan "Teacher Page").
18. **Testing Philosophy**
    Minimal setiap Engine memiliki Unit Test dan Integration Test. Jangan bergantung hanya pada End-to-End (E2E) Test.
19. **Documentation as Architecture**
    Dokumentasi tidak boleh hanya menjelaskan syntax, tetapi harus menjelaskan *WHY*, Trade-off, Decision, dan Impact.
20. **Platform Before Product**
    School OS dibangun sebagai Platform. SDN 1 Siliasih hanyalah implementasi pertama. Seluruh keputusan desain harus mempertimbangkan kemungkinan sistem digunakan oleh sekolah lain tanpa mengubah Core Platform.
21. **Simplicity Before Cleverness**
    Setiap solusi harus dipilih berdasarkan kesederhanaan yang tetap memenuhi kebutuhan. Jangan menggunakan pola desain, abstraksi, atau teknologi hanya karena terlihat canggih. Setiap lapisan, trait, interface, event, atau service harus memiliki alasan bisnis yang jelas.
