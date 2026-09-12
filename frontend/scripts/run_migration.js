const fs = require('fs');
const { Client } = require('pg');

const envFile = fs.readFileSync('C:/Users/USER/Documents/School Os/backend/.env', 'utf8');
const dbUrlMatch = envFile.match(/DATABASE_URL=([^\n]+)/);
if (!dbUrlMatch) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}
const dbUrl = dbUrlMatch[1].trim();

const client = new Client({
  connectionString: dbUrl,
});

async function run() {
  await client.connect();
  try {
    await client.query(`ALTER TABLE schools ADD COLUMN dapodik_url VARCHAR(255) DEFAULT 'http://localhost:5774'`);
    await client.query(`ALTER TABLE schools ADD COLUMN dapodik_token VARCHAR(255)`);
    console.log("Migration successful");
  } catch(e) {
    console.error("Migration failed:", e.message);
  } finally {
    await client.end();
  }
}
run();
