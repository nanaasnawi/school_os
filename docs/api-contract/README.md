# School OS — REST API Contract Specification

> **Base URL**: `/api/v1`  
> **Format**: JSON (`Content-Type: application/json`)

Dokumen ini mendokumentasikan spesifikasi resmi kontrak REST API untuk platform School OS. Semua endpoint dikembangkan menggunakan **Axum** di Rust backend (`api-server`).

---

## 1. Authentication & Headers

- **JWT Bearer Token**: Semua endpoint memerlukan header `Authorization: Bearer <token>` kecuali `/health` dan `/api/v1/auth/login`.
- **Idempotency Key**: Endpoint pembuat sumber daya (`POST`) mewajibkan header `Idempotency-Key: <UUID>` untuk mencegah eksekusi duplikat.
- **Tenant Context**: `tenant_id` diekstrak secara otomatis dari klaim JWT dan diisikan ke dalam `RequestContext`.

---

## 2. Standard Response Envelope (`ApiResponse<T>`)

Semua endpoint mengembalikan struktur envelope yang seragam:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "page": 1,
    "page_size": 10,
    "total_items": 42,
    "total_pages": 5
  },
  "request_id": "req-12345678",
  "timestamp": "2026-08-03T10:15:30Z",
  "version": "v1"
}
```

### Error Detail (`ApiErrorDetail`)

Jika `success` bernilai `false`, field `error` diisi dengan detail kesalahan:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "AUTH_PERMISSION_DENIED",
    "message": "Insufficient permissions for this operation",
    "details": null,
    "trace_id": "req-12345678"
  }
}
```

---

## 3. Core API Endpoints

### 3.1 Authentication & Tenant
| Method | Endpoint | Deskripsi | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/auth/login` | Otentikasi pengguna & mengembalikan JWT access token | ❌ |
| `POST` | `/api/v1/tenants/provision` | Provisi tenant & sekolah baru (Memerlukan `Idempotency-Key`) | ✅ |

### 3.2 People Domain
| Method | Endpoint | Deskripsi | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/students` | Ambil daftar siswa terpaginasi (Filter: `search`, `status`, `page`) | ✅ |
| `POST` | `/api/v1/students` | Pendaftaran siswa baru | ✅ |
| `GET` | `/api/v1/students/{id}` | Ambil detail profil siswa berdasarkan UUID | ✅ |
| `PATCH` | `/api/v1/students/{id}` | Update profil siswa | ✅ |
| `GET` | `/api/v1/teachers` | Ambil daftar guru terpaginasi | ✅ |
| `POST` | `/api/v1/teachers` | Pendaftaran guru baru | ✅ |
| `GET` | `/api/v1/guardians` | Ambil daftar orang tua / wali siswa | ✅ |
| `POST` | `/api/v1/guardians` | Pendaftaran wali baru | ✅ |
| `GET` | `/api/v1/staff` | Ambil daftar staf kependidikan | ✅ |
| `POST` | `/api/v1/staff` | Pendaftaran staf baru | ✅ |

### 3.3 Academic Domain
| Method | Endpoint | Deskripsi | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/academic/academic-years` | Ambil daftar tahun ajaran | ✅ |
| `POST` | `/api/v1/academic/academic-years` | Tambah tahun ajaran baru | ✅ |
| `GET` | `/api/v1/academic/classes` | Ambil daftar rombongan belajar / kelas | ✅ |
| `POST` | `/api/v1/academic/classes` | Buat kelas baru | ✅ |
| `GET` | `/api/v1/academic/enrollments` | Ambil daftar penempatan kelas siswa | ✅ |
| `POST` | `/api/v1/academic/enrollments` | Daftarkan siswa ke dalam kelas | ✅ |

### 3.4 Health Check
| Method | Endpoint | Deskripsi | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/health` | Health check endpoint untuk load balancer / k8s probe | ❌ |
