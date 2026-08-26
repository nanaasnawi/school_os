const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({ connectionString: 'postgres://school_admin:secretpassword@localhost:5433/school_os' });

async function run() {
  await client.connect();
  try {
    const migrationsDir = 'C:/Users/USER/Documents/School Os/backend/migrations';
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    
    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query(sql);
    }
    console.log("All migrations applied successfully!");
  } catch(e) {
    console.error("Failed to run migrations:", e);
  } finally {
    await client.end();
  }
}
run();
