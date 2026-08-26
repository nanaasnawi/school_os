# Product Specification: Reporting Bounded Context — Phase 3.1

## 1. Overview
Reporting Bounded Context berfungsi sebagai penyusun (*composer*) dan penyaji informasi akademik formal (*Report Card, Academic Transcript, Progress Report*). Reporting **tidak melakukan perhitungan nilai**, melainkan membaca data agregasi yang sudah dihitung oleh domain `Assessment` (*GradeBook*) dan `Academic` (*Attendance*).

---

## 2. Reporting Pipeline

```text
GenerateReportCard
        │
        ├── 1. Fetch GradeBook Summary (Assessment Domain)
        ├── 2. Fetch Attendance Totals (Academic Domain)
        ├── 3. Fetch Student Profile & NISN (People Domain)
        ├── 4. Fetch Homeroom Teacher Info (People Domain)
        └── 5. Compose ReportCard Aggregate
                │
                ├── Export PDF (PDF Renderer)
                ├── Export HTML / Print
                └── Publish to Parent Portal & Student App
```

---

## 3. Data Invariants & Output Formats
1. **GPA Calculation**: `GPA = Sum(FinalScore) / Count(Subjects)`.
2. **Immutability on Publish**: Ketika `ReportCard` berstatus `Published`, isi nilai terkunci dan dicatat di Audit Log.
3. **Multi-Format Renderers**:
   - `PDF` (Informal & Official Stamped Report)
   - `JSON` (API Response for Parent Portal)
   - `Excel / CSV` (School Admin Archival)
