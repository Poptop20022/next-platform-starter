// src/db/connection.ts
import { Pool } from 'pg';
import { logger } from '../utils/logger.js';

// Определяем конфигурацию пула
let poolConfig: any;

if (process.env.DATABASE_URL) {
  // Используем DATABASE_URL (для Railway, Neon, Render и т.д.)
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.DATABASE_URL.includes('sslmode=require') ||
      process.env.DATABASE_URL.includes('neon.tech')
        ? { rejectUnauthorized: false }
        : undefined,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
} else {
  // Резерв: индивидуальные переменные (для локальной разработки)
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'tenderhub',
    user: process.env.DB_USER || 'tenderhub',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.DB_SSL === 'require' ? { rejectUnauthorized: false } : undefined,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

// Создаём пул подключений
const pool = new Pool(poolConfig);

// Обработка ошибок на "холодном" клиенте
pool.on('error', (err: Error) => {
  logger.error('Unexpected error on idle client', err);
  // Не вызываем process.exit(-1), чтобы не падать в Railway
  // (в PaaS лучше перезапускать через health-check)
});

// Функция инициализации (проверка подключения)
export async function initDatabase() {
  try {
    await pool.query('SELECT NOW()');
    logger.info('Database connection established');
  } catch (error) {
    logger.error('Database connection failed', error);
    throw error;
  }
}

// Экспортируем пул для использования в других модулях
export { pool };