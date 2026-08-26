# School OS Master Event Catalog

> Katalogs murni seluruh Domain Events lintas Bounded Context di platform School OS.

---

## 1. Domain Events Summary

```text
Domain Event Catalog
├── Learning Domain
│   ├── LessonPublished
│   ├── AssignmentCreated
│   └── SubmissionSubmitted
├── Assessment Domain
│   ├── QuizAttemptCompleted
│   ├── GradeCalculated
│   └── GradeBookPublished
├── Reporting Domain
│   ├── ReportCardGenerated
│   └── ReportCardPublished
├── Communication Domain
│   └── AnnouncementPublished
└── Notification Domain
    └── NotificationQueued
```

---

## 2. Event Metadata Standards (Mandatory Attributes)
- `event_id`: UUID v7
- `event_type`: String (e.g. `"Learning.LessonPublished"`)
- `occurred_at`: ISO-8601 UTC Timestamp
- `tenant_id`: UUID v7
- `correlation_id`: UUID v7
- `source`: String (e.g. `"school-core/learning"`)
