# School OS — Domain Catalog

> Katalog domain resmi untuk platform School OS. Dokumen ini mendeskripsikan setiap domain, Aggregate Root, Entity, Value Object, dan Repository Interface dalam sistem.

---

## Overview Domain Architecture

School OS dibangun menggunakan prinsip **Domain-Driven Design (DDD)** dan **Clean Architecture**. Setiap domain bersifat otonom dan mengisolasi logika bisnisnya sendiri di `backend/school-core/src/<domain>/`.

```
backend/school-core/src/
├── identity/          # Authentication, User Management, Tenant Provisioning
├── people/            # Entity lifecycle: Student, Teacher, Guardian, Staff
├── academic/          # AcademicYear, Class, Enrollment, Subject, Term
├── audit/             # Audit Trail & Log Storage
├── authorization/     # Role-Based Access Control (RBAC) & Policy Engine
└── learning/          # Curriculum, Syllabuses, Lessons, Assignments, Quizzes
```

---

## Daftar Katalog Domain

| Domain Catalog | Deskripsi | Aggregate Roots / Key Entities |
| :--- | :--- | :--- |
| 🔑 [Identity Domain](identity-domain.md) | Otentikasi, pembuatan JWT token, dan isolasi tenant. | `User`, `Tenant`, `School` |
| 👥 [People Domain](people-domain.md) | Pengelolaan profil dan siklus hidup civitas akademika. | `Student`, `Teacher`, `Guardian`, `Staff` |
| 📚 [Academic Domain](academic-domain.md) | Struktur akademik, kelas, pendaftaran siswa, dan kurikulum. | `AcademicYear`, `Class`, `Enrollment`, `Subject`, `Term` |
| 🛡️ [Audit Domain](audit-domain.md) | Pencatatan Jejak Audit (Audit Trail) dari event domain. | `AuditLog` |
| 🔐 [Authorization Domain](authorization-domain.md) | Sistem kontrol akses peran (RBAC) & registry izin. | `Role`, `Permission` |

---

## Aturan Komunikasi Antar Domain

1. **Strict Decoupling**: Domain layer TIDAK BOLEH mengimpor domain layer lain secara langsung.
2. **Event-Driven**: Komunikasi lintas domain WAJIB melalui `EventBus` (mempublikasikan dan berlangganan `DomainEvent`).
3. **Read Models**: Query lintas domain menggunakan Read Model atau DTO terpisah, bukan Aggregate Root langsung.
