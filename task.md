# Task Checklist: Phase 1 (School Foundation)

## Project Initialization
- [x] Initialize root monorepo
- [x] Initialize Backend (Rust - Cargo workspace)
  - [x] Setup DDD folders (presentation, application, domain, infrastructure)
- [ ] Initialize Frontend (Next.js)
  - [ ] Setup Tailwind CSS
  - [ ] Setup Next.js folder structure
- [ ] Setup Docker Compose for PostgreSQL Database

## Database Setup (PostgreSQL)
- [ ] Create Database schema for Tenant/School (Multi-tenant foundation)
- [ ] Create initial migrations setup

## Module: Identity (Backend)
- [ ] Domain Layer: Tenant & User Entities
- [ ] Infrastructure Layer: DB Repository
- [ ] Application Layer: Create Tenant Use Case
- [ ] Presentation Layer: API Endpoint (REST)

## Module: Foundation (Backend)
- [ ] Domain Layer: Academic Year Entity
- [ ] Infrastructure Layer: DB Repository
- [ ] Application Layer: Manage Academic Year Use Case

## Module: Frontend (Next.js)
- [ ] Setup UI Shell (Sidebar, Header, Layout)
- [ ] Implement Dashboard Admin Page
- [ ] Integrate API for Tenant Creation

## Verification
- [ ] Backend Unit & Integration Tests pass
- [ ] End-to-end basic testing (Create Tenant)
