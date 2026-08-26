# Academic Domain Catalog

> **Domain Path**: `backend/school-core/src/academic/`

Domain **Academic** mengatur struktur pembelajaran sekolah, mencakup Tahun Ajaran (*AcademicYear*), Kelas (*Class*), Pendaftaran (*Enrollment*), Mata Pelajaran (*Subject*), dan Tingkat Kelas (*GradeLevel*).

---

## 1. Aggregates & Entities

### 1.1 `AcademicYear` (Aggregate Root)
Siklus kalender akademik sekolah.

- **ID**: `Uuid` (UUID v7)
- **Tenant ID**: `Uuid`
- **Name**: `String` (misal: "2025/2026")
- **Start Date**: `NaiveDate`
- **End Date**: `NaiveDate`
- **Is Active**: `bool`

### 1.2 `Class` (Aggregate Root)
Rombongan belajar / kelas siswa.

- **ID**: `Uuid` (UUID v7)
- **Tenant ID**: `Uuid`
- **Academic Year ID**: `Uuid`
- **Grade Level ID**: `Uuid`
- **Name**: `String` (misal: "X IPA 1")
- **Homeroom Teacher ID**: `Option<Uuid>` (Guru Wali Kelas)

### 1.3 `Enrollment` (Entity)
Penempatan siswa pada kelas di tahun ajaran tertentu.

- **ID**: `Uuid` (UUID v7)
- **Tenant ID**: `Uuid`
- **Student ID**: `Uuid`
- **Class ID**: `Uuid`
- **Academic Year ID**: `Uuid`
- **Is Active**: `bool`

### 1.4 `Subject` & `GradeLevel` (Entities)
- **`Subject`**: Mata pelajaran (misal: "Matematika", "Fisika").
- **`GradeLevel`**: Tingkat pendidikan (misal: "Kelas 10", "Kelas 11").

---

## 2. Constraints & Rules

1. **Unique Active Enrollment**: Seorang siswa hanya boleh memiliki 1 enrollment aktif dalam 1 tahun ajaran.
2. **Homeroom Teacher Integrity**: Wali kelas harus terdaftar sebagai Teacher aktif pada tenant tersebut.

---

## 3. Primary Use Cases

1. **`CreateAcademicYear`**: Mendaftarkan tahun ajaran baru.
2. **`CreateClass`**: Membuat kelas baru yang terikat pada tahun ajaran dan tingkat kelas.
3. **`EnrollStudent`**: Memasukkan siswa ke dalam kelas & mempublikasikan `StudentEnrolledEvent`.
