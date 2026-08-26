# Frontend Engineering Constitution — School OS

> Konstitusi engineering frontend yang wajib dipatuhi oleh seluruh developer dan agen AI.
> Dokumen ini memanifestasikan prinsip arsitektur bahwa Frontend adalah **Presentation Layer**, bukan tempat business logic berpindah dari backend.

---

## 1. Core Architecture Laws

```text
frontend/src/
├── app/                  # Next.js App Router (Routes & Layouts only)
├── features/             # Feature-Sliced Business Domains
│   └── <feature_name>/   # E.g. material, lesson, assignment, quiz, gradebook
│       ├── api/          # Feature API callers (using @hey-api generated SDK)
│       ├── components/   # Business-specific components (e.g. LessonCard, MaterialForm)
│       ├── hooks/        # Feature custom hooks (e.g. useLesson, usePublishLesson)
│       ├── pages/        # Page view containers
│       ├── queries/      # TanStack Query query hooks
│       ├── mutations/    # TanStack Query mutation hooks
│       ├── schemas/      # Zod validation schemas for forms
│       ├── types/        # Feature TypeScript definitions
│       └── index.ts      # Public API boundary for the feature
├── shared/               # Domain-agnostic reusable foundation
│   ├── api/              # API Client configuration
│   ├── ui/               # Pure UI Components (Button, Table, Badge, Modal, Skeleton)
│   ├── hooks/            # Generic hooks (useDebounce, useMediaQuery)
│   ├── utils/            # Helper utilities
│   ├── auth/             # Permission & Auth Context
│   └── types/            # Shared TypeScript types
├── layouts/              # App Layout containers (Sidebar, Header, AppShell)
└── providers/            # React Context Providers (QueryClientProvider, AuthProvider)
```

---

## 2. Inviolable Engineering Rules

1. **No Direct Fetching in Presentational Components**:
   - DILARANG menggunakan `fetch()`, `axios`, atau `useEffect` untuk data fetching di dalam komponen UI.
   - SEMUA data fetching WAJIB melalui **TanStack Query hooks** di `features/<feature>/queries/` yang mengonsumsi SDK auto-generated `@hey-api/client-fetch`.

2. **Feature-Sliced Boundary**:
   - Komponen dalam `features/lesson/` TIDAK BOLEH mengimpor langsung dari internal `features/assignment/`. Jika membutuhkan interaksi, gunakan shared types atau event-driven state.

3. **Domain-Agnostic `shared/ui`**:
   - Komponen di `src/shared/ui/` (Button, Input, Table, Dialog, Badge, Skeleton) TIDAK BOLEH mengetahui entitas bisnis sekolah (misal: dilarang ada props `studentName` atau `lessonId` di `shared/ui`).

4. **Type Safety & Form Standard**:
   - Semua form WAJIB menggunakan **React Hook Form + Zod Schema**.
   - Zod Schema WAJIB selaras dengan DTO dari `frontend/openapi.json`.

5. **Permission-aware UI (No Hardcoded Roles)**:
   - DILARANG menggunakan pengecekan role secara kasar (`if (role === 'admin')`).
   - Pengecekan WAJIB menggunakan granular RBAC permissions:
     ```tsx
     <Can permission="LearningLessonPublish">
       <PublishButton onClick={handlePublish} />
     </Can>
     ```

6. **UX Standards (Skeleton -> Data -> Empty State)**:
   - Hindari spinner generik di tengah layar. Komponen loading WAJIB menggunakan **Skeleton Loader**.
   - Setiap tabel atau list WAJIB memiliki **Empty State** visual yang informatif.

---

## 3. Data Flow

```text
Page Container
      │
      ▼
Feature Hook (e.g., useLesson)
      │
      ▼
TanStack Query (useQuery / useMutation)
      │
      ▼
Auto-generated SDK (@hey-api/client-fetch)
      │
      ▼
Backend Axum API (/api/v1/...)
```
