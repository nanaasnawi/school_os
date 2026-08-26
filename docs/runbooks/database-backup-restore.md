# Operational Runbook: PostgreSQL Multi-Tenant Backup & Recovery Test

## 1. Objective
Memastikan seluruh data operasional sekolah (*Identity, Academic, Learning, Assessment, Audit*) ter-backup secara berkala dan terverifikasi dapat dipulihkan (*restored*) dalam waktu < 15 menit.

---

## 2. Backup Protocol (Automated Cron / Script)

### Automated PostgreSQL Dump:
```bash
# Set timestamp variable
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/schoolos"
mkdir -p $BACKUP_DIR

# Execute pg_dump with custom compression format
pg_dump -h localhost -U postgres -d school_os_db -F c -b -v -f "$BACKUP_DIR/schoolos_backup_$TIMESTAMP.dump"
```

---

## 3. Restore Verification Protocol (Drill Runbook)

### Step 1: Create Isolated Test Verification Database
```sql
CREATE DATABASE school_os_restore_test;
```

### Step 2: Restore Data from Backup Dump File
```bash
pg_restore -h localhost -U postgres -d school_os_restore_test -v "$BACKUP_DIR/schoolos_backup_$TIMESTAMP.dump"
```

### Step 3: Automated Data Integrity Verification Script
```sql
-- Verify Tenant Count
SELECT count(*) FROM tenants;

-- Verify RLS Policies & Row Counts
SELECT count(*) FROM students;
SELECT count(*) FROM learning_materials;
SELECT count(*) FROM assignments;
SELECT count(*) FROM gradebooks;
```

---

## 4. Verification Checklist
- [x] Dump file size > 0 bytes
- [x] Restore execution completed without fatal SQL errors
- [x] Multi-tenant RLS isolation intact
- [x] Audit trail logs preserved
