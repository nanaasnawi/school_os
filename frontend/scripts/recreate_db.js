const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgres://school_admin:secretpassword@localhost:5433/postgres' });
  await client.connect();
  try {
    console.log("Dropping database school_os...");
    // Terminate existing connections
    await client.query(`SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = 'school_os' AND pid <> pg_backend_pid();`);
    await client.query(`DROP DATABASE IF EXISTS school_os;`);
    console.log("Creating database school_os...");
    await client.query(`CREATE DATABASE school_os;`);
    console.log("Database successfully recreated!");
  } catch(e) {
    console.error("Failed to recreate DB:", e);
  } finally {
    await client.end();
  }
}
run();
