
const { Client } = require("pg");
const client = new Client({ connectionString: "postgres://school_admin:secretpassword@localhost:5433/school_os" });
async function reset() {
  await client.connect();
  console.log("Connected to DB");
  const res = await client.query("TRUNCATE TABLE dapodik_sync_records, local_bridge_outbox_jobs, onboarding_tokens, enrollments, classes, guardians, students, user_roles, roles, users, academic_years, grade_levels, tenants CASCADE;");
  console.log("All tables truncated successfully.");
  await client.end();
}
reset().catch(console.error);

