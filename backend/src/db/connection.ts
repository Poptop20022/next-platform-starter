import pg from 'pg';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

// Support both DATABASE_URL (connection string) and individual variables
let poolConfig: any;

if (process.env.DATABASE_URL) {
  // Use connection string (for Neon, Railway, etc.)
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('sslmode=require') || process.env.DATABASE_URL.includes('neon.tech') 
      ? { rejectUnauthorized: false } 
      : undefined,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
} else {
  // Use individual variables (fallback)
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'tenderhub',
    user: process.env.DB_USER || 'tenderhub',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.DB_SSL === 'require' ? { rejectUnauthorized: false } : undefined,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

const pool = new Pool(poolConfig);

pool.on('error', (err: Error) => {
  logger.error('Unexpected error on idle client', err);
});

export async function initDatabase() {
  try {
    await pool.query('SELECT NOW()');
    logger.info('Database connection established');
  } catch (error) {
    logger.error('Database connection failed', error);
    throw error;
  }
}

export { pool };

