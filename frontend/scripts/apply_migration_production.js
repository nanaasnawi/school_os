/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = "postgresql://postgres:ePssELIUrkhPIlsGqKvIgGvMuDodFsYM@altaria.proxy.rlwy.net:21200/railway";

async function applyProductionMigration() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log("Connected to Railway PostgreSQL Production.");

  try {
    await client.query("BEGIN;");
    console.log("--- EXECUTING PRODUCTION MIGRATION DDL ---");

    const migrationSqlPath = path.resolve(__dirname, '../../backend/migrations/20261009120000_timetable_hub_core_schema.sql');
    const sql = fs.readFileSync(migrationSqlPath, 'utf8');

    await client.query(sql);
    console.log("[SUCCESS] Migration DDL executed successfully.");

    // Verification 1: Check learning_sessions columns
    const columnsCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'learning_sessions'
        AND column_name IN ('session_type', 'schedule_id', 'subject_id', 'session_date', 'session_number', 'start_time', 'end_time', 'substitute_teacher_id', 'cancellation_reason')
      ORDER BY column_name;
    `);
    console.log(`[VERIFIED] learning_sessions columns present: ${columnsCheck.rows.length}/9`);
    if (columnsCheck.rows.length < 9) {
      throw new Error("Missing expected columns on learning_sessions!");
    }

    // Verification 2: Check quiz_token_attempts table
    const qtaCheck = await client.query(`
      SELECT count(*) as cnt FROM information_schema.tables WHERE table_name = 'quiz_token_attempts';
    `);
    if (parseInt(qtaCheck.rows[0].cnt) !== 1) {
      throw new Error("quiz_token_attempts table not found!");
    }
    console.log("[VERIFIED] quiz_token_attempts table exists.");

    // Verification 3: Check foreign key ON DELETE rule for session_attendances
    const fkCheck = await client.query(`
      SELECT rc.delete_rule, tc.constraint_name
      FROM information_schema.referential_constraints rc
      JOIN information_schema.table_constraints tc ON rc.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'session_attendances' AND tc.constraint_name = 'fk_session_attendances_session';
    `);
    if (fkCheck.rows.length === 0 || fkCheck.rows[0].delete_rule !== 'RESTRICT') {
      throw new Error(`Expected RESTRICT rule on fk_session_attendances_session, got: ${JSON.stringify(fkCheck.rows)}`);
    }
    console.log("[VERIFIED] fk_session_attendances_session delete rule is strictly RESTRICT.");

    // Verification 4: Check CHECK constraints
    const chkCheck = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'learning_sessions' AND constraint_type = 'CHECK'
        AND constraint_name IN ('chk_learning_sessions_type', 'chk_learning_sessions_time', 'chk_learning_sessions_context');
    `);
    console.log(`[VERIFIED] learning_sessions CHECK constraints present: ${chkCheck.rows.length}/3`);
    if (chkCheck.rows.length < 3) {
      throw new Error("Missing expected CHECK constraints on learning_sessions!");
    }

    // Verification 5: Check unique index
    const idxCheck = await client.query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'learning_sessions' AND indexname = 'uq_learning_sessions_schedule_date';
    `);
    if (idxCheck.rows.length === 0) {
      throw new Error("Missing partial unique index uq_learning_sessions_schedule_date!");
    }
    console.log("[VERIFIED] uq_learning_sessions_schedule_date index exists.");

    // COMMIT ALL CHANGES
    await client.query("COMMIT;");
    console.log("=================================================");
    console.log("PRODUCTION MIGRATION COMMITTED PERMANENTLY TO DB!");
    console.log("=================================================");
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("FATAL ERROR - MIGRATION ROLLED BACK:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyProductionMigration();
