const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://school_admin:secretpassword@localhost:5433/school_os' });
client.connect().then(() => client.query(`SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name IN ('teachers', 'staff', 'classes', 'students')`))
.then(res => {
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
