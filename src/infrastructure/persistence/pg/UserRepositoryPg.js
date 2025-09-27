import { query } from '../../../config/database.js';
import { UserRepository } from '../../../domain/repositories/UserRepository.js';

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
}
