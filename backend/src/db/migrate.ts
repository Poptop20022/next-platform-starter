import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from './connection.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrate() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Read migration file
    const migrationPath = join(__dirname, 'migrations', '001_initial_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Execute migration
    await client.query(migrationSQL);
    
    await client.query('COMMIT');
    logger.info('Migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Migration failed', error);
    throw error;
  } finally {
    client.release();
  }
}

migrate()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Migration error', error);
    process.exit(1);
  });

