# Identity Domain Catalog

> **Domain Path**: `backend/school-core/src/identity/`

Domain **Identity** mengelola registrasi pengguna, enkripsi kata sandi, provisi penyewa (*tenant provisioning*), penerbitan token JWT, serta pembuatan identitas terpadu menggunakan **UUID v7**.

---

## 1. Aggregates & Entities

### 1.1 `User` (Aggregate Root)
Menyimpan kredensial otentikasi pengguna sistem.

- **ID**: `Uuid` (UUID v7)
- **Tenant ID**: `Uuid`
- **Email**: `String` (Unik per tenant)
- **Password Hash**: `String` (Di-hash menggunakan `Argon2id`)
- **Status**: `UserStatus` (`Active`, `Inactive`, `Suspended`)
- **Created At**: `DateTime<Utc>`
- **Updated At**: `DateTime<Utc>`

### 1.2 `Tenant` (Entity)
Menyajikan batas isolasi (*tenant boundary*) untuk multi-sekolah.

- **ID**: `Uuid` (UUID v7)
- **Name**: `String`
- **Code**: `String` (Slug unik)
- **Status**: `TenantStatus` (`Active`, `Suspended`)

### 1.3 `School` (Entity)
Informasi institusi sekolah yang terikat pada suatu tenant.

- **ID**: `Uuid` (UUID v7)
- **Tenant ID**: `Uuid`
- **Name**: `String`
- **NPSN**: `Option<String>`

---

## 2. Value Objects

- `Email`: Memvalidasi format email standar RFC 5322.
- `PasswordHash`: Membungkus hash Argon2id dengan salt unik.

---

## 3. Repository Interfaces

```rust
#[async_trait]
pub trait UserRepository: Send + Sync {
    async fn save(&self, user: &User) -> Result<(), InfrastructureError>;
    async fn find_by_email(&self, tenant_id: Uuid, email: &str) -> Result<Option<User>, InfrastructureError>;
    async fn find_by_id(&self, tenant_id: Uuid, id: Uuid) -> Result<Option<User>, InfrastructureError>;
}
```

---

## 4. Primary Use Cases

1. **`LoginUser`**: Memverifikasi email & password, mengembalikan `JWT Token` (Masa berlaku 24 jam).
2. **`ProvisionTenant`**: Membuat `Tenant`, `School`, dan akun `Admin User` pertama secara atomik (dengan dukungan header `Idempotency-Key`).
