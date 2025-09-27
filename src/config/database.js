import pkg from 'pg'
const { Pool } = pkg
import logger from '../utils/logger.js'

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'plurall_test',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export const connectDB = async () => {
  try {
    const client = await pool.connect()
    logger.info('✅ Conectado a PostgreSQL')
    client.release()
  } catch (error) {
    logger.error('❌ Error conectando a PostgreSQL:', error.message)
  }
}

export const query = async (text, params) => {
  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start
    logger.info(`Query executed in ${duration}ms: ${text.substring(0, 100)}...`)
    return result
  } catch (error) {
    logger.error('Database query error:', {
      query: text,
      params: params,
      error: error.message
    })
    throw error
  }
}

export const getClient = async () => {
  return await pool.connect()
}

process.on('SIGINT', () => {
  pool.end()
  process.exit(0)
})

export default pool