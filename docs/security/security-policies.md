# School OS — Security Architecture & Policies

> Standar Keamanan dan Kebijakan Perlindungan Data Sistem.

---

## 1. Authentication & Password Security

1. **Password Hashing**: Menggunakan algoritma **Argon2id** (Memory: 19MB, Time: 2 iterations, Parallelism: 1) dengan salt 128-bit unik per pengguna.
2. **JSON Web Token (JWT)**:
   - Disetujui menggunakan algoritma `HS256` / `RS256`.
   - Masa berlaku (*expiration time*): **24 jam**.
   - Klaim JWT wajib menyertakan: `sub` (User UUID), `tenant_id` (Tenant UUID), `roles`, dan `exp`.

---

## 2. Authorization & RBAC Middleware

- Setiap request API melewati Axum Extractor `RequestContext` yang memvalidasi otentikasi token JWT.
- Akses endpoint diperiksa secara ketat oleh middleware `require_permission(&actor, Permission::...)`.
- Mengembalikan kode HTTP `401 Unauthorized` atau `403 Forbidden` jika pengguna tidak memiliki kredensial / izin yang sesuai.

---

## 3. Idempotency Protection

- Seluruh endpoint pembuat sumber daya (`POST`) mewajibkan header `Idempotency-Key`.
- Backend memvalidasi `Idempotency-Key` pada tabel `idempotency_keys` di database untuk mencegah terjadinya request ganda (*duplicate execution*) akibat gangguan jaringan.

---

## 4. Multi-Tenant Data Isolation

- Perlindungan tingkat pertama: PostgreSQL **Row Level Security (RLS)** pada setiap tabel.
- Perlindungan tingkat kedua: Filter klausa `WHERE tenant_id = $1` wajib diisikan pada seluruh query SQLx di layer infrastruktur.
- Menjamin tidak ada kebocoran data antar-institusi sekolah (*zero data leak guarantee*).
