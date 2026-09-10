import { Pool } from 'pg';

const DEFAULT_PRODUCTION_DB_URL =
  'postgresql://postgres:ePssELIUrkhPIlsGqKvIgGvMuDodFsYM@altaria.proxy.rlwy.net:21200/railway';

const connectionString = process.env.DATABASE_URL || DEFAULT_PRODUCTION_DB_URL;
const isCloudDb =
  connectionString.includes('railway') ||
  connectionString.includes('rlwy.net') ||
  process.env.NODE_ENV === 'production';

let pool: Pool;

declare global {
  // eslint-disable-next-line no-var
  var __schoolOsPool: Pool | undefined;
}

const poolConfig = {
  connectionString,
  ssl: isCloudDb && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1')
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
};

if (process.env.NODE_ENV === 'production') {
  pool = new Pool(poolConfig);
} else {
  if (!global.__schoolOsPool) {
    global.__schoolOsPool = new Pool(poolConfig);
  }
  pool = global.__schoolOsPool;
}

export default pool;
