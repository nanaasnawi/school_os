import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgres://school_admin:secretpassword@localhost:5433/school_os';

let pool: Pool;

declare global {
  // eslint-disable-next-line no-var
  var __schoolOsPool: Pool | undefined;
}

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
  });
} else {
  if (!global.__schoolOsPool) {
    global.__schoolOsPool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  pool = global.__schoolOsPool;
}

export default pool;
