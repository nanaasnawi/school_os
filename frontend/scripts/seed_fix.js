const { Client } = require('pg');

const client = new Client({ connectionString: 'postgres://school_admin:secretpassword@localhost:5433/school_os' });

async function run() {
  await client.connect();
  try {
    // Insert tenant
    await client.query(`
      INSERT INTO tenants (id, name, domain, is_active, created_at, updated_at, npsn)
      VALUES (
        '0075ab67-450e-47af-9653-671891a12e45', 
        'My Default School', 
        'schoolos.com', 
        true, 
        NOW(), 
        NOW(),
        '00000000'
      ) ON CONFLICT (id) DO NOTHING;
    `);

    // Insert user
    await client.query(`
      INSERT INTO users (id, tenant_id, email, password_hash, full_name, is_active, created_at, updated_at)
      VALUES (
        '01a014a2-3ab7-7380-9b45-857d5ce638b4', 
        '0075ab67-450e-47af-9653-671891a12e45', 
        'admin@schoolos.com', 
        '$argon2id$v=19$m=19456,t=2,p=1$A08/422yL+lT+Q+O/6QYVw$rWkPq6MvS28eKz1V3Yq0oJ/tQv5Z+u+13Xz/2s4zXoM', 
        'System Admin', 
        true, 
        NOW(), 
        NOW()
      ) ON CONFLICT (id) DO NOTHING;
    `);

    // Add roles (operator and kepsek seeds already exist in migration 20260818203500)
    console.log("Seeded user admin@schoolos.com with password 'secretpassword'");
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
