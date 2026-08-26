# School OS Architecture Charter v1.0

> Piagam Resmi Prinsip Arsitektur Permanen Platform School OS.

---

### 1. Business Rules Live in the Domain
Seluruh aturan bisnis berada di Aggregate, Domain Service, atau Domain Policy. Presentation, Repository, dan Infrastructure tidak boleh menjadi tempat lahirnya business rule.

### 2. Dependencies Always Point Inward
Clean Architecture bukan preferensi, melainkan aturan. Domain tidak mengetahui keberadaan HTTP, SQL, Framework, UI, atau Storage.

### 3. Events Represent Facts
Domain Event hanya merepresentasikan sesuatu yang sudah benar-benar terjadi (`LessonPublished`, `AssignmentSubmitted`, `QuizAttemptCompleted`, `GradeCalculated`, `ReportCardPublished`).

### 4. Aggregates Protect Consistency
Aggregate bertugas menjaga invariant. Repository bertugas menyimpan. Application bertugas mengorkestrasi. Controller bertugas menerjemahkan HTTP.

### 5. Read Models Are Disposable
Projection, cache, analytics, dan dashboard boleh dibangun ulang kapan saja. Single Source of Truth tetap berada pada Aggregate dan Event.

### 6. AI Never Owns the Domain
AI tidak pernah membuat Aggregate, mengubah Entity, melewati invariant, atau mengakses database secara langsung. AI hanya menghasilkan rekomendasi. Keputusan tetap berada pada manusia atau Application Layer.

### 7. Platform Before Product
School OS dibangun sebagai platform. Produk-produk seperti Parent Portal, Teacher Portal, Student App, Library, Finance, dan Admissions adalah aplikasi yang berdiri di atas platform tersebut.

### 8. Documentation Is Part of the Architecture
Kode tanpa dokumentasi arsitektur bukanlah sistem yang selesai. ADR, RFC, Runbook, Product Specification, dan Governance merupakan bagian dari artefak perangkat lunak.

### 9. Automation Protects Quality
Kualitas tidak dijaga melalui ingatan, melainkan melalui CI/CD, Fitness Functions, Static Analysis, Unit Tests, Integration Tests, dan Contract Tests.

### 10. Simplicity Wins
Jika dua solusi sama-sama benar, pilih yang lebih sederhana. Kompleksitas hanya ditambahkan ketika benar-benar diperlukan oleh kebutuhan bisnis, bukan karena teknologi memungkinkan.
