# People Domain Catalog

> **Domain Path**: `backend/school-core/src/people/`

Domain **People** mengelola entitas manusia di lingkungan sekolah, meliputi Siswa (*Student*), Guru (*Teacher*), Wali (*Guardian*), dan Staf Administrasi (*Staff*).

---

## 1. Aggregates & Entities

### 1.1 `Student` (Aggregate Root)
Entitas siswa sekolah.

- **ID**: `Uuid` (UUID v7)
- **Tenant ID**: `Uuid`
- **User ID**: `Option<Uuid>` (Link ke entitas User jika siswa punya akses login)
- **NISN**: `String` (Nomor Induk Siswa Nasional - Unik)
- **Full Name**: `String`
- **Guardian ID**: `Option<Uuid>`
- **Status**: `StudentStatus` (`Pending`, `Active`, `Inactive`, `Graduated`, `Transferred`, `Archived`)
- **Created At / Updated At**: `DateTime<Utc>`

#### State Transitions (`StudentStatus`)
- `Pending` → `Active` (Pendaftaran dikonfirmasi)
- `Active` → `Graduated` (Lulus)
- `Active` → `Transferred` (Pindah sekolah)
- `Active` → `Inactive` (Non-aktif / Cuti)

### 1.2 `Teacher` (Aggregate Root)
Entitas guru / tenaga pengajar.

- **ID**: `Uuid` (UUID v7)
- **Tenant ID**: `Uuid`
- **User ID**: `Option<Uuid>`
- **NIP**: `String` (Nomor Induk Pegawai / Guru - Unik)
- **Full Name**: `String`
- **Is Active**: `bool`

### 1.3 `Guardian` (Aggregate Root)
Orang tua atau wali dari siswa.

- **ID**: `Uuid` (UUID v7)
- **Tenant ID**: `Uuid`
- **Full Name**: `String`
- **Phone**: `String`
- **Relationship**: `String` (Father, Mother, Relative)

### 1.4 `Staff` (Aggregate Root)
Tenaga kependidikan non-guru.

- **ID**: `Uuid` (UUID v7)
- **Tenant ID**: `Uuid`
- **Full Name**: `String`
- **Role Title**: `String`

---

## 2. Read Models

Untuk optimasi query tampilan (CQRS Read Path):
- `StudentSummary`: Digunakan pada tabel list siswa (`id`, `nisn`, `full_name`, `status`).
- `StudentDetail`: Digunakan pada halaman profil siswa lengkap.

---

## 3. Primary Use Cases

1. **`CreateStudent`**: Menambahkan siswa baru & mempublikasikan `StudentCreatedEvent`.
2. **`UpdateStudent`**: Mengubah NISN / Nama Siswa & mempublikasikan `StudentUpdatedEvent`.
3. **`ListStudents`**: Mengambil daftar siswa terpaginasi (`Page<StudentSummary>`) dengan filter `search`, `status`, dan `date_range`.
4. **`CreateTeacher`**: Mendaftarkan guru baru & mempublikasikan `TeacherCreatedEvent`.
5. **`ListTeachers`**: Query daftar guru terpaginasi.
