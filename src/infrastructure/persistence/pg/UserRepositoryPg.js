import { query } from '../../../config/database.js';
import { UserRepository } from '../../../domain/repositories/UserRepository.js';

const SORT_MAP = {
  username: 'u.username ASC',
  '-username': 'u.username DESC',
  email: 'u.email ASC',
  '-email': 'u.email DESC',
  created_at: 'u.created_at ASC',
  '-created_at': 'u.created_at DESC',
  role: 'u.role ASC',
  '-role': 'u.role DESC',
};

/** @implements {import('../../../domain/repositories/UserRepository.js').UserRepository} */
export class UserRepositoryPg extends UserRepository {
  async findByEmail(emailLower) {
    try {
      const sql = `
      SELECT id, username, email, password_hash, role, first_name, last_name, is_active
      FROM users
      WHERE LOWER(email) = $1
      LIMIT 1;
    `;
      const { rows } = await query(sql, [emailLower]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(error);
    }
  }

  async existsByEmailOrUsername({ emailLower, username }) {
    try {
      const sql = `SELECT 1 FROM users WHERE LOWER(email) = $1 OR username = $2 LIMIT 1;`;
      const { rows } = await query(sql, [emailLower, username]);
      return rows.length > 0;
    } catch (error) {
      throw new Error(error);
    }
  }

  async createUser({ username, emailLower, passwordHash, firstName = null, lastName = null }) {
    try {
      const sql = `
      INSERT INTO users (username, email, password_hash, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, first_name, last_name, role, created_at;
    `;
      const { rows } = await query(sql, [username, emailLower, passwordHash, firstName, lastName]);
      return rows[0];
    } catch (error) {
      throw new Error(error);
    }
  }

  async getProfileById(userId) {
    try {
      const sql = `
      SELECT id, username, email, first_name, last_name, role, is_active,
             email_verified, last_login, created_at
      FROM users
      WHERE id = $1;
    `;
      const { rows } = await query(sql, [userId]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(error);
    }
  }

  async updateLastLogin(userId) {
    try {
      await query(`UPDATE users SET last_login = now() WHERE id = $1;`, [userId]);
    } catch (error) {
      throw new Error(error);
    }
  }
  async searchUsersRepo({ q, role, is_active, page = 1, limit = 20, sort = 'username' }) {
    try {
      const values = [];
      const where = [];

      if (q) {
        values.push(`%${q.toLowerCase()}%`);
        where.push(
          `(LOWER(u.username) LIKE $${values.length} OR LOWER(u.email) LIKE $${values.length} OR LOWER(u.first_name) LIKE $${values.length} OR LOWER(u.last_name) LIKE $${values.length})`,
        );
      }
      if (typeof is_active === 'boolean') {
        values.push(is_active);
        where.push(`u.is_active = $${values.length}`);
      }
      if (role) {
        values.push(role);
        where.push(`u.role = $${values.length}`);
      }

      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const orderSql = SORT_MAP[sort] ?? SORT_MAP.username;

      const totalSql = `SELECT COUNT(*)::int AS total FROM users u ${whereSql};`;
      const totalRes = await query(totalSql, values);
      const total = totalRes.rows[0]?.total ?? 0;

      const offset = (page - 1) * limit;
      const dataSql = `
      SELECT u.id, u.username, u.email, u.role, u.first_name, u.last_name, u.is_active, u.created_at, u.updated_at
      FROM users u
      ${whereSql}
      ORDER BY ${orderSql}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2};
    `;
      const dataRes = await query(dataSql, [...values, limit, offset]);

      return { items: dataRes.rows, total };
    } catch (error) {
      throw new Error(error);
    }
  }
}
