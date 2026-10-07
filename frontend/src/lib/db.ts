import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:ePssELIUrkhPIlsGqKvIgGvMuDodFsYM@altaria.proxy.rlwy.net:21200/railway';

// Global singleton pool to prevent connection exhaustion in serverless/dev reload
declare global {
  // eslint-disable-next-line no-var
  var __schoolOsDbPool: Pool | undefined;
}

export function getDbPool(): Pool {
  if (!global.__schoolOsDbPool) {
    global.__schoolOsDbPool = new Pool({
      connectionString,
      ssl: false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return global.__schoolOsDbPool;
}
