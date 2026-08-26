# ADR 0007: Assessment & Learning Bounded Context Decoupling

- **Status**: Accepted
- **Date**: 2026-08-04
- **Author**: Engineering Architecture Team

## Context

Domain Assessment (*AssessmentRule*, *GradeBook*, *FinalGradeCalculator*) perlu mengkalkulasi nilai akhir siswa berdasarkan tugas (*Submission*) dan kuis (*QuizAttempt*). Panggilan fungsi langsung (*direct coupling*) antar domain akan merusak batas Bounded Context dan menyulitkan pemisahan mikroservis di masa depan.

## Decision

Memisahkan Bounded Context `Learning` dan `Assessment` secara murni via **Domain Event Subscriptions**:

1. Domain `Learning` mempublikasikan event `SubmissionGraded` dan `QuizAttemptSubmitted` ke `EventBus`.
2. Domain `Assessment` memiliki `AssessmentEventListener` yang menangkap event tersebut secara asynchronous dan memperbarui `GradeBook` aggregate.
3. Service `FinalGradeCalculator` mengevaluasi persentase bobot *AssessmentRule* (Assignment 25%, Quiz 25%, Midterm 20%, Final 30%) dengan *invariance total weight = 100.0%*.

## Consequences

- **Positive**: Decoupling penuh antar bounded context, tidak ada query SQLx silang antar domain, scalable secara horizontal.
- **Negative**: Konsistensi data bersifat *eventual consistency*.
