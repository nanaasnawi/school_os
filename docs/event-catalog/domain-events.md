# Domain Events Catalog

Dokumen ini berisi spesifikasi rinci seluruh event domain yang ada di sistem School OS, skema payload JSON, pemicu (*triggers*), dan daftar subscriber.

---

## 1. People Domain Events

### 1.1 `StudentCreatedEvent`
- **Pemicu**: Dipublish saat siswa baru berhasil terdaftar via `CreateStudentCommand`.
- **Publisher**: `people::domain::student::Student`
- **Subscribers**: `AuditSubscriber`, `NotificationSubscriber`

#### Payload JSON Schema
```json
{
  "metadata": {
    "event_id": "019112ab-cdef-7000-8000-000000000001",
    "event_type": "StudentCreated",
    "occurred_at": "2026-08-03T10:15:30Z",
    "tenant_id": "019112ab-1111-7000-8000-000000000000",
    "correlation_id": "req-998877",
    "source": "school-core::people"
  },
  "student_id": "019112ab-cdef-7000-8000-000000000001",
  "nisn": "0012345678",
  "full_name": "Budi Santoso",
  "status": "Active"
}
```

---

### 1.2 `StudentUpdatedEvent`
- **Pemicu**: Dipublish saat data profil siswa diubah via `UpdateStudentCommand`.
- **Publisher**: `people::domain::student::Student`
- **Subscribers**: `AuditSubscriber`

#### Payload JSON Schema
```json
{
  "metadata": {
    "event_id": "019112ab-cdef-7000-8000-000000000002",
    "event_type": "StudentUpdated",
    "occurred_at": "2026-08-03T11:20:00Z",
    "tenant_id": "019112ab-1111-7000-8000-000000000000",
    "correlation_id": "req-998878",
    "source": "school-core::people"
  },
  "student_id": "019112ab-cdef-7000-8000-000000000001",
  "updated_fields": ["full_name", "nisn"]
}
```

---

### 1.3 `TeacherCreatedEvent`
- **Pemicu**: Dipublish saat guru baru didaftarkan via `CreateTeacherCommand`.
- **Publisher**: `people::domain::teacher::Teacher`
- **Subscribers**: `AuditSubscriber`

#### Payload JSON Schema
```json
{
  "metadata": {
    "event_id": "019112ab-cdef-7000-8000-000000000003",
    "event_type": "TeacherCreated",
    "occurred_at": "2026-08-03T12:00:00Z",
    "tenant_id": "019112ab-1111-7000-8000-000000000000",
    "correlation_id": "req-998879",
    "source": "school-core::people"
  },
  "teacher_id": "019112ab-cdef-7000-8000-000000000003",
  "nip": "198501012010011001",
  "full_name": "Dr. Alexander Wright, M.Pd."
}
```

---

## 2. Academic Domain Events

### 2.1 `AcademicYearCreatedEvent`
- **Pemicu**: Dipublish saat tahun ajaran baru dibuat.
- **Publisher**: `academic::domain::academic_year::AcademicYear`
- **Subscribers**: `AuditSubscriber`

### 2.2 `StudentEnrolledEvent`
- **Pemicu**: Dipublish saat siswa didaftarkan ke dalam kelas pada tahun ajaran aktif.
- **Publisher**: `academic::domain::enrollment::Enrollment`
- **Subscribers**: `AuditSubscriber`, `AnalyticsSubscriber`

---

## 3. Identity Domain Events

### 3.1 `TenantProvisionedEvent`
- **Pemicu**: Dipublish saat proses provisi tenant baru dan sekolah selesai disiapkan.
- **Publisher**: `identity::domain::tenant::Tenant`
- **Subscribers**: `AuditSubscriber`, `SystemSetupSubscriber`
