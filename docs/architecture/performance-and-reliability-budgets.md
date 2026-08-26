# Performance & Reliability Budgets Specification — School OS

> Kontrak performa non-fungsional dan SLA keandalan operasional platform.

---

## 1. Performance Budgets (SLA Targets)

| Endpoint / Operation | Target P95 Latency | Target P99 Latency | Max Throughput Target |
|---|:---:|:---:|:---:|
| **Parent Awareness Dashboard** | < 150 ms | < 300 ms | 5,000 req/sec |
| **Executive Decision Workspace** | < 250 ms | < 500 ms | 1,000 req/sec |
| **Spreadsheet GradeBook Load** | < 350 ms | < 700 ms | 2,000 req/sec |
| **Create Assignment / Submission** | < 200 ms | < 400 ms | 3,000 req/sec |
| **Analytics Read Model Projection Delay** | < 5.0 sec | < 10.0 sec | Asynchronous Worker |
| **Official PDF Report Card Generator** | < 5.0 sec | < 10.0 sec | Background Worker |

---

## 2. Reliability Budgets & SLAs

- **Platform Availability**: `99.9%` (Max downtime < 8.76 jam/tahun)
- **Recovery Time Objective (RTO)**: `30 Menit`
- **Recovery Point Objective (RPO)**: `5 Menit`
- **Database Backup Frequency**: Automated Daily + Point-in-time Recovery
- **Restore Verification Drill**: Bulanan (Monthly Automated Restore Drill)
