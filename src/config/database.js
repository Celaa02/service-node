// src/config/db.js
import pkg from 'pg';
const { Pool } = pkg;
import logger from '../utils/logger.js';

const {
  DATABASE_URL,
  DB_HOST = 'db',
  DB_PORT = '5432',
  DB_NAME = 'plurall_test',
  DB_USER = 'appuser',
  DB_PASSWORD = 'appsecret',
} = process.env;

const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  : new Pool({
      host: DB_HOST,
      port: Number(DB_PORT),
      database: DB_NAME,
      user: DB_USER,
      password: DB_PASSWORD,
      ssl: false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    logger.info('✅ Conectado a PostgreSQL');
    client.release();
  } catch (error) {
    logger.error(`❌ Error conectando a PostgreSQL: ${error.message}`);
    throw error;
  }
};

export const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.info(`Query executed in ${duration}ms: ${text.slice(0, 80)}...`);
    return result;
  } catch (error) {
    logger.error('Database query error:', {
      query: text,
      params,
      error: error.message,
    });
    throw error;
  }
};

export default pool;
