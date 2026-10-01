# ADR-0009: Dynamic Name-Based Usernames & Role-Aware Authentication

## Status
**Accepted** (Implemented & Verified on Live Database & Codebase)

## Context
Di School OS, siswa, guru, dan wali sebelumnya menggunakan pengenal panjang atau kode teknis untuk login manual (misal NIK 16 digit `3209025505010002`, NISN 10 digit, atau handle `ibu_0051617261`) di samping QR Code. Hal ini menyulitkan pengguna non-teknis terutama di perangkat mobile Android dan browser desktop saat QR scanner tidak dapat digunakan.

Tuntutan kebutuhan:
1. Menghasilkan handle `username` ramah pengguna berbasis nama asli (`full_name`) tanpa gelar akademik (misal `surafatih`, `ikin.baihaki`).
2. Jika ditemukan nama identik/duplikat dalam tenant yang sama, pembedaan dilakukan secara dinamis menggunakan imbuhan angka (`marpuah` -> `marpuah1`, `marpuah2`, dll.).
3. **Tanpa Hardcode**: Logika pengecekan dan resolusi tabrakan (collision) harus dinamis membaca database PostgreSQL per-tenant, bukan daftar statis atau percabangan `if-else`.
4. **Pengecualian Khusus Admin**: Akun `Administrator`, `Super Admin`, `Operator/Staff`, dan `Kepala Sekolah` **wajib** tetap menggunakan email resmi (`username` diset `NULL`, dan query login mengunci autentikasi admin hanya melalui email).

## Decision
1. **Dynamic Normalization & Base Slug**:
   - Menghapus gelar akademik & kehormatan (`S.Pd`, `S.Pd.SD`, `S.Ag`, `M.Pd`, `S.Kom`, `Drs`, `Dra`, `H.`, `Hj.`).
   - Normalisasi huruf kecil, menghapus karakter non-alfanumerik, dan mengganti spasi menjadi titik (`.`).
   - Format: `ikin.baihaki`, `surafatih`, `eha.meida.kartika`.

2. **Database-Driven Collision Disambiguation**:
   - Backend Rust mengeksekusi query dinamis per-tenant:
     ```sql
     SELECT LOWER(username) 
     FROM users 
     WHERE tenant_id = $1 
       AND username IS NOT NULL
       AND ($2::uuid IS NULL OR id != $2)
       AND (
         LOWER(username) = LOWER($3)
         OR LOWER(username) ~ ('^' || LOWER($3) || '[0-9]+$')
       )
     ```
   - Jika `base` belum terpakai, gunakan `base`.
   - Jika sudah terpakai, secara dinamis mencari imbuhan angka terendah yang belum ada (`base1`, `base2`, dst.).

3. **Role-Enforced Login Query in `pg_user_repository.rs`**:
   - **Admin / Super Admin / Kepala Sekolah**: Dikunci dengan klausa `EXISTS (...) AND u.email ILIKE $2`. Tidak dapat dibobol menggunakan pencarian nama.
   - **Regular Users (Guru, Siswa, Wali)**: Mendukung `@username`, username tanpa titik (`ikinbaihaki`), email, NIP, NISN, atau no HP.
   - Menggunakan prioritas bertingkat (`ORDER BY CASE WHEN u.email ... THEN 1 WHEN u.username ... THEN 2 ... LIMIT 1`) untuk menjamin determinisme 100%.

4. **Multi-Platform Integration**:
   - **Backend API**: DTO `LoginResponse`, `UserQrStatusDto`, dan `BatchGenerateQrItemDto` mengembalikan properti `username`.
   - **Frontend Web**: Form login diperbarui menerima email maupun username, dilengkapi panduan peran.
   - **ID Card & QR Center**: Preview kartu cetak dan canvas generator menampilkan `@username` sebagai opsi login manual di samping QR Code.

## Consequences
- **Positive**: Pengguna (siswa, guru, wali) memiliki identitas login yang manusiawi dan mudah diingat. Tabrakan nama ditangani secara otomatis dan terisolasi per sekolah/tenant. Keamanan akun pimpinan/admin tetap terjaga ketat dengan email.
- **Verification**: Terverifikasi pada live Railway DB (581 akun: 578 user berhasil digenerate username, 4 tabrakan nama berhasil dipisahkan dengan angka, 3 akun kepala sekolah/admin terjaga strictly email).
