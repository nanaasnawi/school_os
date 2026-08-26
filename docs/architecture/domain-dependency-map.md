# Domain Dependency Map & Unidirectional Flow Guarantee

## 1. Unidirectional Dependency Graph

```text
Identity Bounded Context
        │
        ▼
Academic Bounded Context
        │
        ▼
Learning Bounded Context ───────────────┐
        │                               │
        ▼                               ▼
Assessment Bounded Context      Communication Bounded Context
        │                               │
        ▼                               ▼
Reporting Bounded Context       Notification Bounded Context
        │
        ▼
Analytics Projection Read Models
        │
        ▼
Executive Decision Workspace
```

---

## 2. Core Principles
1. **Unidirectional Downstream Dependency**: Dependensi hanya diperbolehkan mengarah ke bawah. Dilarang keras membuat dependensi sirkular antar domain.
2. **Cross-Domain Communication via EventBus**: Komunikasi antar domain yang tidak hierarkis (misal: Learning ➔ Assessment) **WAJIB** menggunakan EventBus asynchronous.
3. **Read Model Decoupling**: Analytics & Executive Workspaces tidak memanggil domain operasional langsung, melainkan membaca *Read Model Projections*.
