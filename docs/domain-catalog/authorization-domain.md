# Authorization Domain Catalog

> **Domain Path**: `backend/school-core/src/authorization/` & `permission/`

Domain **Authorization** menyediakan mesin kontrol akses berbasis peran (**RBAC - Role-Based Access Control**) dan pendaftaran izin (*permission registry*).

---

## 1. Structure & Entities

### 1.1 `Permission` (Enum Registry)
Registry tipe izin eksplisit yang di-compile secara statis:

- `StudentCreate`, `StudentRead`, `StudentUpdate`, `StudentDelete`
- `TeacherCreate`, `TeacherRead`, `TeacherUpdate`, `TeacherDelete`
- `AcademicYearCreate`, `AcademicYearRead`
- `ClassCreate`, `ClassRead`
- `TenantManage`

### 1.2 `Role` (Aggregate Root)
Grup izin yang ditugaskan kepada pengguna.

- **ID**: `Uuid` (UUID v7)
- **Tenant ID**: `Uuid`
- **Name**: `String` (misal: `SuperAdmin`, `Teacher`, `Parent`, `Student`)
- **Permissions**: `Vec<Permission>`

---

## 2. API Middleware Integration

Di layer Axum `api-server`:
- `require_permission(&actor, Permission::TeacherCreate)` mengecek apakah aktor yang membuat request JWT memiliki izin tersebut.
- Mencegah akses tak berwenang di tingkat handler HTTP sebelum Use Case diproses.
