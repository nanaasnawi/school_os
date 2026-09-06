const { Client } = require('pg');
const client = new Client('postgres://school_admin:secretpassword@localhost:5433/school_os');

async function main() {
    await client.connect();
    const res = await client.query(`
        SELECT u.id, u.email, u.full_name, u.password_hash,
               r.name as role_name,
               q.raw_token, q.is_active as qr_active
        FROM users u
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        LEFT JOIN roles r ON r.id = ur.role_id
        LEFT JOIN user_qr_tokens q ON q.user_id = u.id
        WHERE r.name ILIKE '%Guru%' OR r.name ILIKE '%Teacher%'
        LIMIT 5;
    `);
    console.log(JSON.stringify(res.rows, null, 2));
    await client.end();
}

main().catch(console.error);
