const { Client } = require('pg');
const fs = require('fs');

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
    console.log("Dropping schema public...");
    await client.query(`DROP SCHEMA public CASCADE;`);
    console.log("Recreating schema public...");
    await client.query(`CREATE SCHEMA public;`);
    console.log("Database successfully emptied!");
  } catch(e) {
    console.error("Failed to empty database:", e.message);
  } finally {
    await client.end();
  }
}
run();
