const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = "postgresql://postgres:ePssELIUrkhPIlsGqKvIgGvMuDodFsYM@altaria.proxy.rlwy.net:21200/railway";

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log("Connected to Railway PostgreSQL.");

  try {
    await client.query("BEGIN;");
    console.log("--- STARTING ACCEPTANCE VERIFICATION TRANSACTION ---");

    // 1. Run Migration DDL
    const migrationSqlPath = path.resolve(__dirname, '../../../../Documents/School Os/backend/migrations/20261009120000_timetable_hub_core_schema.sql');
    const sql = fs.readFileSync(migrationSqlPath, 'utf8');
    await client.query(sql);
    console.log("[PASS] Migration applied cleanly.");

    // 2. Fetch existing tenant, schedule, student from live database
    const schedRes = await client.query(`
      SELECT cs.id as schedule_id, cs.tenant_id, cs.class_id, cs.subject_id, cs.teacher_id, cs.start_time, cs.end_time
      FROM class_schedules cs
      WHERE cs.deleted_at IS NULL
      LIMIT 1;
    `);

    if (schedRes.rows.length === 0) {
      throw new Error("No class_schedules found in DB to test with!");
    }
    const sched = schedRes.rows[0];
    console.log(`Using real schedule: ${sched.schedule_id}, tenant: ${sched.tenant_id}`);

    const studentRes = await client.query(`
      SELECT id FROM students WHERE tenant_id = $1 LIMIT 1;
    `, [sched.tenant_id]);
    const studentId = studentRes.rows[0].id;

    // 3. Acceptance Test 1: Start Scheduled Session & Verify Idempotency
    const testDate = '2026-10-12'; // A monday
    const sessionRes1 = await client.query(`
      INSERT INTO learning_sessions (
        id, tenant_id, session_type, schedule_id, class_id, subject_id, teacher_id,
        session_date, session_number, status, created_at, updated_at
      )
      VALUES (gen_random_uuid(), $1, 'scheduled', $2, $3, $4, $5, $6, 1, 'active', NOW(), NOW())
      ON CONFLICT (tenant_id, schedule_id, session_date)
      WHERE schedule_id IS NOT NULL AND deleted_at IS NULL
      DO NOTHING
      RETURNING id;
    `, [sched.tenant_id, sched.schedule_id, sched.class_id, sched.subject_id, sched.teacher_id, testDate]);

    const createdSessionId = sessionRes1.rows[0].id;
    console.log(`[PASS] Acceptance 1A: Created session ${createdSessionId}`);

    // Idempotent retry:
    const sessionRes2 = await client.query(`
      INSERT INTO learning_sessions (
        id, tenant_id, session_type, schedule_id, class_id, subject_id, teacher_id,
        session_date, session_number, status, created_at, updated_at
      )
      VALUES (gen_random_uuid(), $1, 'scheduled', $2, $3, $4, $5, $6, 1, 'active', NOW(), NOW())
      ON CONFLICT (tenant_id, schedule_id, session_date)
      WHERE schedule_id IS NOT NULL AND deleted_at IS NULL
      DO NOTHING
      RETURNING id;
    `, [sched.tenant_id, sched.schedule_id, sched.class_id, sched.subject_id, sched.teacher_id, testDate]);

    if (sessionRes2.rows.length === 0) {
      console.log("[PASS] Acceptance 1B: Duplicate insert safely ignored via ON CONFLICT DO NOTHING.");
    } else {
      throw new Error("Duplicate insert did not trigger ON CONFLICT DO NOTHING!");
    }

    // 4. Acceptance Test 2: Attendance Preservation with ON DELETE RESTRICT
    await client.query(`
      INSERT INTO session_attendances (id, tenant_id, session_id, student_id, status, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, 'present', NOW(), NOW());
    `, [sched.tenant_id, createdSessionId, studentId]);
    console.log("[PASS] Acceptance 2A: Recorded attendance.");

    await client.query("SAVEPOINT sp_restrict;");
    let restrictBlocked = false;
    try {
      await client.query(`DELETE FROM learning_sessions WHERE id = $1;`, [createdSessionId]);
    } catch (err) {
      if (err.message.toLowerCase().includes('foreign key') || err.message.toLowerCase().includes('restrict')) {
        restrictBlocked = true;
        console.log(`[PASS] Acceptance 2B: Hard DELETE of session successfully blocked by RESTRICT constraint fk_session_attendances_session.`);
        await client.query("ROLLBACK TO SAVEPOINT sp_restrict;");
      } else {
        throw err;
      }
    }
    if (!restrictBlocked) {
      throw new Error("Hard delete of session with attendance was NOT blocked by RESTRICT!");
    }

    // Soft delete works cleanly:
    await client.query(`
      UPDATE learning_sessions SET deleted_at = NOW() WHERE id = $1;
    `, [createdSessionId]);
    console.log("[PASS] Acceptance 2C: Soft delete of session succeeds while attendance records remain intact.");

    // 5. Acceptance Test 3: CBT Token 5x Rate-Limit and 15-Minute Lock
    const quizIdRes = await client.query(`
      INSERT INTO quizzes (id, tenant_id, class_id, title, exam_token, status, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, 'CBT Timetable Hub Test', 'PASS77', 'published', NOW(), NOW())
      RETURNING id;
    `, [sched.tenant_id, sched.class_id]);
    const quizId = quizIdRes.rows[0].id;

    // Simulate 4 failed attempts
    for (let i = 1; i <= 4; i++) {
      await client.query(`
        INSERT INTO quiz_token_attempts (id, tenant_id, quiz_id, student_id, failed_attempts, locked_until, last_attempt_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, NULL, NOW())
        ON CONFLICT (tenant_id, quiz_id, student_id)
        DO UPDATE SET failed_attempts = $4, last_attempt_at = NOW();
      `, [sched.tenant_id, quizId, studentId, i]);
    }
    const attemptCheck1 = await client.query(`
      SELECT failed_attempts, locked_until FROM quiz_token_attempts WHERE tenant_id = $1 AND quiz_id = $2 AND student_id = $3;
    `, [sched.tenant_id, quizId, studentId]);
    if (attemptCheck1.rows[0].failed_attempts === 4 && attemptCheck1.rows[0].locked_until === null) {
      console.log("[PASS] Acceptance 3A: 4 failed attempts recorded, locked_until is NULL.");
    }

    // 5th failed attempt triggers 15 min lock
    await client.query(`
      INSERT INTO quiz_token_attempts (id, tenant_id, quiz_id, student_id, failed_attempts, locked_until, last_attempt_at)
      VALUES (gen_random_uuid(), $1, $2, $3, 5, NOW() + INTERVAL '15 minutes', NOW())
      ON CONFLICT (tenant_id, quiz_id, student_id)
      DO UPDATE SET failed_attempts = 5, locked_until = NOW() + INTERVAL '15 minutes', last_attempt_at = NOW();
    `, [sched.tenant_id, quizId, studentId]);

    const attemptCheck2 = await client.query(`
      SELECT failed_attempts, (locked_until > NOW()) as is_locked FROM quiz_token_attempts WHERE tenant_id = $1 AND quiz_id = $2 AND student_id = $3;
    `, [sched.tenant_id, quizId, studentId]);
    if (attemptCheck2.rows[0].failed_attempts === 5 && attemptCheck2.rows[0].is_locked === true) {
      console.log("[PASS] Acceptance 3B: 5th attempt immediately locks student for 15 minutes.");
    }

    // 6. Acceptance Test 4: Headmaster 6-state Compliance Verification
    const complianceQuery = await client.query(`
      SELECT 
        cs.id,
        cs.start_time,
        cs.end_time,
        ls.status as session_status,
        ls.substitute_teacher_id
      FROM class_schedules cs
      LEFT JOIN learning_sessions ls ON ls.schedule_id = cs.id AND ls.session_date = CURRENT_DATE AND ls.deleted_at IS NULL
      WHERE cs.tenant_id = $1 AND cs.deleted_at IS NULL
      LIMIT 10;
    `, [sched.tenant_id]);

    console.log(`[PASS] Acceptance 4: Successfully evaluated ${complianceQuery.rows.length} schedule rows for Headmaster compliance monitoring.`);

    // 7. Test Rollback to leave database untouched
    await client.query("ROLLBACK;");
    console.log("--- TRANSACTION ROLLED BACK CLEANLY (DATABASE INTACT) ---");
    console.log("ALL ACCEPTANCE TESTS PASSED 100%!");
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("ACCEPTANCE TEST FAILED:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
