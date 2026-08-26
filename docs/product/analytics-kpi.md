# School OS Analytics KPI Catalog — Phase 3.3 Specification

> Catalog resmi definisi KPI operasional & akademik sekolah untuk menjaga konsistensi backend, frontend, dan tim manajemen sekolah.

---

## KPI Definition Catalog

| KPI Name | Formula / Logika Perhitungan | Sumber Data Domain | Target Benchmark |
|---|---|---|:---:|
| **Attendance Rate** | `Present ÷ Total School Days × 100%` | Academic (`Attendance`) | ≥ 95.0% |
| **Assignment Completion Rate** | `Submitted Assignments ÷ Total Published Assignments × 100%` | Learning (`Assignment` & `Submission`) | ≥ 90.0% |
| **Quiz Pass Rate** | `Passed Attempts ÷ Total Attempts × 100%` | Learning (`Quiz` & `QuizAttempt`) | ≥ 80.0% |
| **Average Final Grade** | `Sum(FinalScore) ÷ Count(SubjectEntries)` | Assessment (`GradeBook`) | ≥ 80.0 (Grade B) |
| **Average Feedback Time** | `Avg(GradedAt - SubmittedAt)` dalam satuan jam | Learning (`Submission`) | ≤ 24 Jam |
| **Students At Risk** | Siswa dengan `Attendance Rate < 85%` ATAU `GPA < 75.0` | Reporting / Analytics Read Model | ≤ 5% Total Siswa |
| **Operational Health Index** | Composite `(Attendance Submission % + On-Time Grading %) / 2` | Academic & Learning | ≥ 95.0% |

---

## Analytics Read Model Hierarchy
```text
analytics/
├── school_overview     # High-level KPIs for Principals
├── class_summary       # Aggregated metrics per class
├── subject_summary     # Subject performance metrics
├── teacher_summary     # Operational feedback time & published counts
└── student_summary     # Student risk & grade trends
```
