# School OS — Learning & Communication Hardening Plan

> Revisi roadmap fitur School OS untuk memperkuat pengalaman belajar, komunikasi, notifikasi, keamanan data kelas, assessment, dan akses materi.

---

## 1. Learning Access Control & Data Isolation — P0

### Tujuan

Memastikan **materi, tugas, kuis, dan CBT tidak pernah dapat diakses oleh siswa dari kelas lain**, meskipun mereka mengetahui UUID/resource ID.

### Resource yang wajib memiliki scope

```text
Tenant / Sekolah
    ↓
Tahun Ajaran
    ↓
Kelas / Rombel
    ↓
Mata Pelajaran
    ↓
Guru / Pengampu
    ↓
Resource
    ├── Materi
    ├── Tugas
    ├── Kuis
    └── CBT
```

### Backend Authorization

Security tidak boleh hanya dilakukan di frontend.

```text
Request
   ↓
Authentication
   ↓
Identify Tenant
   ↓
Identify User
   ↓
Identify Enrollment / Class
   ↓
Check Resource Scope
   ↓
┌───────────────┐
│ Authorized?   │
└───────┬───────┘
     YES│NO
        │
        ├──→ Allow
        │
        └──→ 403 Forbidden
```

### Acceptance Criteria

* Siswa hanya dapat melihat resource kelasnya.
* Siswa tidak dapat mengakses resource kelas lain dengan mengganti UUID.
* Guru hanya dapat mengelola kelas yang menjadi tanggung jawab/pengampunya.
* Tenant sekolah tidak boleh dapat mengakses data tenant lain.
* Semua authorization dilakukan di backend.
* Frontend hanya menjadi layer UX, bukan security boundary.

---

# 2. Communication Engine — P0/P1

## 2.1 Persistent Chat — P0

### Masalah

Chat saat ini tidak persisten/hilang ketika aplikasi ditutup atau dibuka kembali.

### Arsitektur

```text
Android
   ↓
POST /conversations/{id}/messages
   ↓
Rust API
   ↓
PostgreSQL
   ↓
Persistent Message
```

### Data Model

```text
conversations
├── id
├── tenant_id
├── created_at
└── ...

conversation_members
├── conversation_id
├── user_id
└── ...

messages
├── id
├── conversation_id
├── sender_id
├── content
├── created_at
└── ...

message_reads
├── message_id
├── user_id
└── read_at
```

### Requirement

* Chat tersimpan di server.
* Histori tetap tersedia setelah aplikasi ditutup.
* Histori tetap tersedia setelah login ulang.
* Support pagination.
* Support unread message.
* Support recovery setelah koneksi terputus.
* WebSocket/realtime boleh digunakan, tetapi persistence tetap berasal dari database.

---

## 2.2 Chat UX & Debouncing — P1

### Masalah

Siswa sering mengetik pesan dengan menekan Enter berkali-kali:

```text
Pak
Pak ini
Pak saya
Pak saya mau
Pak saya mau tanya
```

### UX

```text
Text Area

Enter
  ↓
New Line

Shift + Enter
  ↓
New Line

Send Button
  ↓
Send Message
```

### Backend / Client Grouping

Tambahkan mekanisme debounce/grouping untuk pesan yang dikirim sangat berdekatan apabila desain chat memang mengizinkannya.

Tujuan:

```text
5 pesan dalam 3 detik
        ↓
Tidak dianggap sebagai
5 event percakapan terpisah
```

---

# 3. Deep Linking — P0/P1

Notification harus membawa informasi mengenai resource yang menjadi tujuan.

### Contoh

```text
Notification:

"Tugas Fisika baru dari Pak Joko"
```

Ketika siswa menekan notification:

```text
Notification
     ↓
Deep Link Resolver
     ↓
Entity Type
     ↓
Entity ID
     ↓
Compose Navigation
     ↓
AssignmentDetailScreen
```

### Payload

```json
{
  "type": "assignment",
  "entity_id": "assignment_uuid",
  "route": "/assignments/{assignment_uuid}"
}
```

### Target Resource

Deep linking harus dapat digunakan untuk:

```text
Assignment
Material
Quiz
CBT
Chat
Announcement
Reading Assignment
```

### Acceptance Criteria

* Notification tugas membuka detail tugas.
* Notification materi membuka materi.
* Notification kuis membuka kuis.
* Notification chat membuka conversation terkait.
* Resource yang sudah tidak tersedia menghasilkan halaman/error state yang sesuai.
* Authorization tetap dilakukan setelah deep link dibuka.

---

# 4. Smart Notification Engine — P1

## 4.1 Smart Reminder untuk Guru

### Tujuan

Menghindari notification spam dan memberikan reminder berdasarkan kondisi sebenarnya.

### Logic

```text
Scheduler
    ↓
Cari jadwal pelajaran
    ↓
Apakah 15 menit sebelum kelas?
    ↓
Cari materi untuk:
    ├── Teacher
    ├── Class
    ├── Subject
    └── Session
    ↓
┌────────────────────────────┐
│ Materi sudah tersedia?     │
└─────────────┬──────────────┘
              │
        ┌─────┴─────┐
        │           │
       YES          NO
        │           │
        ▼           ▼
Konfirmasi       Reminder
kalem            pengisian
```

### Jika materi belum tersedia

```text
"Jam pelajaran X MIPA 1 mulai
15 menit lagi, jangan lupa isi
materi ya, Pak/Bu."
```

### Jika materi sudah tersedia

```text
"Materi Fisika X MIPA 1 akan
otomatis ter-publish 15 menit lagi."
```

### Prinsip

Guru yang sudah menyelesaikan pekerjaannya **tidak perlu mendapatkan reminder yang sama**.

---

## 4.2 Notification Deduplication

Scheduler/retry tidak boleh menghasilkan notification ganda.

Gunakan notification key:

```text
notification_key =
    teacher_id
    +
    schedule_id
    +
    session_date
    +
    notification_type
```

Contoh:

```text
teacher-123
schedule-456
2026-09-16
MATERIAL_REMINDER
```

Harus menghasilkan maksimal satu notification untuk event tersebut.

---

# 5. Quiet Hours — P1

### Tujuan

Mencegah notification mengganggu guru/siswa pada malam hari.

Contoh policy:

```text
21:00 — 06:00
      ↓
Quiet Hours
```

Jika guru meng-upload tugas pukul:

```text
02:00
```

maka:

```text
Create Notification Event
          ↓
Notification Queue
          ↓
Quiet Hours?
          ↓
YES
          ↓
scheduled_at = 06:00
          ↓
Delivery
```

### Jangan menggunakan

```text
cron
  ↓
sleep(...)
```

### Gunakan

```text
Notification Event
      ↓
Queue
      ↓
scheduled_at
      ↓
Worker
      ↓
Delivery
```

Dengan demikian event tetap tercatat walaupun delivery ditunda.

---

# 6. Parent Notification / Akun Ibu — P1

School OS memiliki akun khusus:

```text
ibu_<nisn>
```

Akun ini tidak perlu menerima seluruh aktivitas siswa.

### Notification Policy

```text
PARENT_CRITICAL
├── H-1 tugas belum dikerjakan
├── Nilai kuis tersedia
└── Event akademik penting

PARENT_NORMAL
├── Materi baru
├── Pengumuman biasa
└── Aktivitas rutin
```

### Default

```text
CRITICAL = ON
NORMAL   = OFF
```

### Contoh

```text
"Ibu, Budi belum mengerjakan
Tugas Fisika yang tenggatnya
jam 23.59 malam ini."
```

Tujuannya adalah memberikan informasi yang relevan kepada orang tua tanpa menjadikan akun orang tua sebagai target notification spam.

---

# 7. Unified Assessment Engine — P0

## Assignment: Pilihan Ganda + Esai

Assignment tidak dibuat sebagai dua sistem terpisah.

### Struktur

```text
Assignment
    │
    └── AssignmentQuestion
            │
            ├── MULTIPLE_CHOICE
            │      └── options[]
            │
            └── ESSAY
```

### Contoh

```text
Tugas Fisika
│
├── Soal 1
│   └── Multiple Choice
│
├── Soal 2
│   └── Multiple Choice
│
├── Soal 3
│   └── Essay
│
└── Soal 4
    └── Essay
```

---

## Question Bank

Struktur question engine sebaiknya dirancang reusable:

```text
Question Bank
      │
      ├── Assignment
      │
      ├── Quiz
      │
      └── CBT
```

Dengan demikian School OS tidak perlu memiliki tiga sistem question engine berbeda.

### Keuntungan

* Reuse soal.
* Reuse validation.
* Reuse scoring.
* Reuse question metadata.
* Mempermudah pengembangan CBT.
* Mengurangi duplikasi backend.

---

# 8. Teacher Learning Library — P1/P2

## Tujuan

Mempermudah guru memberikan materi bacaan tanpa harus membuat materi dari nol.

### Konsep

Guru memilih:

```text
📚 Buku
↓
Bab
↓
Halaman mulai
↓
Halaman akhir
↓
Kelas
↓
Mapel
```

Contoh:

```text
Buku:
Fisika Kelas X

Bab:
Gerak Lurus

Halaman:
34 — 41

Kelas:
X IPA 1

Instruksi:
"Baca halaman 34–41."
```

---

## Reading Assignment

Materi yang dipilih guru menjadi sebuah reading assignment.

```text
Reading Assignment
├── book_id
├── start_page
├── end_page
├── class_id
├── subject_id
├── teacher_id
├── instructions
└── deadline
```

### Tampilan siswa

```text
┌─────────────────────────┐
│ 📖 Materi Bacaan        │
│                         │
│ Fisika Kelas X          │
│ Halaman 34 — 41         │
│                         │
│ [ Mulai Membaca ]       │
└─────────────────────────┘
```

---

## Reading Progress

Tambahkan tracking:

```text
reading_started
reading_progress
last_page
reading_completed
```

Contoh dashboard guru:

```text
27 siswa ditugaskan

21 sudah mulai
17 selesai membaca
6 belum mulai
```

---

# 9. Notification Architecture

Seluruh notification sebaiknya menggunakan satu pipeline:

```text
Application Event
       ↓
Notification Engine
       ↓
Policy Engine
       ↓
┌───────────────────────────────┐
│ Recipient                     │
│ Quiet Hours                   │
│ Deduplication                 │
│ Notification Preference       │
│ Resource Authorization        │
└───────────────┬───────────────┘
                ↓
        Notification Queue
                ↓
           Worker
                ↓
         Push Provider
                ↓
             Android
                ↓
          Deep Linking
```

Dengan begitu Smart Reminder, Parent Notification, Assignment Notification, Quiz Notification, dan Chat Notification tidak menjadi sistem terpisah-pisah.

---

# 10. Prioritas Implementasi

## PHASE A — FOUNDATION

```text
[P0]
├── Class/Tenant Authorization
├── Resource Scope
├── Chat Persistence
└── Unified Question Model
```

↓

## PHASE B — STUDENT EXPERIENCE

```text
[P0/P1]
├── Deep Linking
├── Assignment PG + Essay
├── Chat UX
├── Chat Grouping/Debouncing
└── Notification Inbox
```

↓

## PHASE C — SMART NOTIFICATION

```text
[P1]
├── Smart Teacher Reminder
├── Notification Deduplication
├── Quiet Hours
├── Notification Queue
└── Parent Critical Notification
```

↓

## PHASE D — LEARNING LIBRARY

```text
[P1/P2]
├── Teacher Library
├── Book/Page Selection
├── Reading Assignment
├── Reading Progress
└── Teacher Reading Analytics
```

↓

## PHASE E — HARDENING & QA

```text
[P0]
├── Cross-Class Isolation Test
├── Cross-Tenant Isolation Test
├── Assignment Authorization Test
├── Quiz Authorization Test
├── CBT Authorization Test
├── Chat Persistence Test
├── Deep Link Test
├── Notification Deduplication Test
├── Quiet Hours Test
└── Concurrent Sync/Notification Test
```

---

# 11. Final Target Architecture

```text
                         SCHOOL OS CLOUD
                              │
                    ┌─────────┴─────────┐
                    │    Rust Backend   │
                    │      Railway      │
                    └─────────┬─────────┘
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
       ▼                      ▼                      ▼
  Learning Engine       Communication Engine   Notification Engine
       │                      │                      │
       │                      │                      │
 ┌─────┼─────┐          ┌─────┼─────┐          ┌─────┼─────┐
 │     │     │          │     │     │          │     │     │
 ▼     ▼     ▼          ▼     ▼     ▼          ▼     ▼     ▼
Materi Tugas Quiz      Chat  Parent Deep     Smart Quiet Queue
 │      │     │                    Link      Reminder Hours
 └──────┴─────┴──────┐
                     ▼
                Question Bank
                     │
                     ▼
                    CBT


                 SCHOOL LOCAL
                     │
                     ▼
              Native Bridge
                     │
                     ▼
                  Dapodik
```

# 12. Definition of Done

Fitur dianggap selesai apabila:

```text
□ Data antar kelas terisolasi
□ Data antar tenant terisolasi
□ Backend authorization sudah diuji
□ Chat tidak hilang setelah app ditutup
□ Chat dapat recovery setelah reconnect
□ Assignment mendukung PG + esai
□ Question engine dapat digunakan kembali
□ Notification membuka halaman tujuan
□ Smart Reminder tidak spam
□ Notification memiliki deduplication
□ Quiet Hours berjalan
□ Parent hanya menerima notification yang relevan
□ Teacher dapat membuat Reading Assignment
□ Siswa dapat membaca rentang halaman
□ Progress membaca tercatat
□ Cross-class penetration test berhasil
□ Notification retry tidak menghasilkan duplikasi
```

**Prioritas absolutnya:**

```text
SECURITY
   ↓
PERSISTENCE
   ↓
CORE LEARNING
   ↓
DEEP LINKING
   ↓
NOTIFICATION ENGINE
   ↓
LIBRARY
   ↓
ANALYTICS & POLISH
```


Ini revisi penting, karena kalau Library dijadikan satu-satunya cara mengisi materi, malah bisa membatasi guru.

Konsep finalnya harus:

> **Teacher Library = opsi percepatan, bukan pengganti pengisian materi manual.**

Jadi gue revisi bagian Learning Library menjadi seperti ini:

```markdown
# 8. Teacher Learning Library — OPTIONAL

## Prinsip Utama

Fitur Perpustakaan Guru merupakan **opsi tambahan** untuk mempermudah
guru mengisi atau memberikan materi.

Fitur ini **tidak menggantikan** fitur pengisian materi manual yang
sudah tersedia.

Guru tetap bebas memilih:

1. Menggunakan materi/buku dari Perpustakaan Guru.
2. Mengisi materi secara manual seperti mekanisme sebelumnya.

---

## Teacher Material Flow

Guru memilih:

┌──────────────────────────────┐
│      Tambah / Isi Materi     │
└──────────────┬───────────────┘
               ↓
       ┌───────────────────┐
       │ Pilih sumber      │
       │ materi             │
       └─────────┬─────────┘
                 ↓
        ┌────────┴─────────┐
        │                  │
        ▼                  ▼
   📚 PERPUSTAKAAN      ✍️ MANUAL
        │                  │
        │                  │
        ▼                  ▼
 Pilih buku/materi      Tulis / input
        │               materi seperti
        │               mekanisme biasa
        ▼                  │
 Pilih halaman             │
 mulai–akhir               │
        │                  │
        └────────┬─────────┘
                 ↓
          Preview Materi
                 ↓
       Pilih Kelas / Rombel
                 ↓
          Publish / Schedule
```

---

## Mode 1 — Perpustakaan Guru

Jika materi atau buku yang dibutuhkan tersedia:

```text
📚 Perpustakaan
      ↓
Pilih Buku
      ↓
Pilih Bab
      ↓
Halaman Mulai
      ↓
Halaman Akhir
      ↓
Preview
      ↓
Assign ke Kelas
```

Contoh:

```text
Buku:
Fisika Kelas X

Bab:
Gerak Lurus

Halaman:
34 — 41

Kelas:
X IPA 1
```

Siswa kemudian mendapatkan:

```text
📖 Materi Bacaan

Fisika Kelas X
Gerak Lurus
Halaman 34–41

[ Mulai Membaca ]
```

---

## Mode 2 — Pengisian Materi Manual

Jika buku atau materi **tidak tersedia di Perpustakaan**, guru
tetap dapat menggunakan fitur pengisian materi seperti sebelumnya.

Contoh:

```text
✍️ Buat Materi Manual

Judul:
Hukum Newton

Deskripsi:
Materi pembelajaran tentang ...

Isi Materi:
[ Rich Text Editor ]

Lampiran:
[ Upload File ]

Video:
[ URL / Upload ]

Kelas:
X IPA 1

Mapel:
Fisika
```

Kemudian:

```text
[ Simpan Draft ]
[ Jadwalkan ]
[ Publish ]
```

Tidak boleh ada kondisi:

> "Materi tidak tersedia di Library → guru tidak bisa membuat materi."

Guru **selalu** memiliki jalur manual.

---

## Library sebagai Accelerated Workflow

Tujuan utama Library:

```text
Materi sudah tersedia
        ↓
Guru tidak perlu membuat
materi dari nol
        ↓
Pilih buku
        ↓
Pilih halaman
        ↓
Assign
        ↓
Selesai
```

Sedangkan manual:

```text
Materi belum tersedia
        ↓
Guru membuat materi sendiri
        ↓
Simpan / Draft
        ↓
Publish / Schedule
```

---

## Optional Library Flow

Library tidak boleh menjadi dependency dari Material Engine.

Arsitektur:

```
                MATERIAL ENGINE
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
         📚 LIBRARY          ✍️ MANUAL
              │                 │
              ▼                 │
      Reading Assignment       │
              │                 │
              └────────┬────────┘
                       ▼
                MATERIAL SYSTEM
                       │
                ┌──────┴──────┐
                ▼             ▼
             Schedule       Publish
                │             │
                └──────┬──────┘
                       ▼
                     SISWA
```

Library hanya salah satu sumber materi.

````

---

## Database / Domain Principle

Jangan membuat `Material` bergantung pada `LibraryBook`.

Contoh yang lebih aman:

```text
Material
├── id
├── tenant_id
├── teacher_id
├── class_id
├── subject_id
├── title
├── content
├── source_type
├── published_at
└── ...
````

`source_type` dapat berupa:

```text
MANUAL
LIBRARY
```

Untuk materi Library, dapat ditambahkan metadata:

```text
library_book_id
start_page
end_page
```

Dengan begitu:

```text
MANUAL
→ library_book_id = NULL

LIBRARY
→ library_book_id = ...
→ start_page = 34
→ end_page = 41
```

---

## Acceptance Criteria

### Manual

* Guru tetap dapat membuat materi tanpa Library.
* Guru dapat membuat materi ketika buku yang dibutuhkan tidak tersedia.
* Semua kemampuan pengisian materi sebelumnya tetap tersedia.

### Library

* Guru dapat memilih buku/materi yang tersedia.
* Guru dapat memilih rentang halaman.
* Guru dapat menentukan kelas tujuan.
* Guru dapat menjadwalkan atau publish materi.
* Siswa mendapatkan akses sesuai scope kelas.

### Security

Library maupun Manual tetap tunduk pada:

```text
Tenant
  ↓
Academic Period
  ↓
Class / Rombel
  ↓
Subject
  ↓
Teacher Authorization
```

Library **tidak boleh menjadi jalur bypass authorization**.

---

## UX Recommendation

Pada halaman guru:

┌─────────────────────────────────────────┐
│           + TAMBAH MATERI               │
├─────────────────────────────────────────┤
│                                         │
│  📚 Gunakan Perpustakaan                │
│  Pilih buku & halaman yang tersedia     │
│                                         │
│                 ATAU                    │
│                                         │
│  ✍️ Buat Materi Manual                   │
│  Tulis materi sendiri seperti biasa     │
│                                         │
└─────────────────────────────────────────┘

Dengan pola ini guru tidak merasa:

> "School OS memaksa saya menggunakan Library."

Tetapi:

> "Kalau sudah ada bukunya, tinggal pilih. Kalau belum ada, saya
> tetap bisa membuat materi sendiri."

---

# Final Principle

📚 **Library = shortcut**

✍️ **Manual = fallback sekaligus jalur utama yang tetap tersedia**

Keduanya masuk ke:

```text
                MATERIAL ENGINE
                      │
             ┌────────┴────────┐
             │                 │
          LIBRARY            MANUAL
             │                 │
             └────────┬────────┘
                      ▼
              SCHOOL OS MATERIAL
                      │
             ┌────────┴────────┐
             ▼                 ▼
         SCHEDULE            PUBLISH
             │                 │
             └────────┬────────┘
                      ▼
                    SISWA
```

**Jadi Library menambah kemudahan tanpa mengurangi fleksibilitas guru.**

```

Nah, **ini gue setuju banget untuk dijadikan prinsip desain final**. Kalau guru punya buku yang sudah tersedia, pekerjaan bisa dipangkas drastis. Kalau bukunya tidak ada, guru tetap punya kontrol penuh untuk membuat materi sendiri. Itu membuat fitur Library benar-benar menjadi **accelerator**, bukan dependency.
```

