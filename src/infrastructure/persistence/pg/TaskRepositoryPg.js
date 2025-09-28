import { query } from '../../../config/database.js';
import { TaskRepository } from '../../../domain/repositories/TaskRepository.js';

const SORT_WHITELIST = new Map([
  ['created_at', 't.created_at'],
  ['updated_at', 't.updated_at'],
  ['due_date', 't.due_date'],
  ['priority', 't.priority'],
  ['status', 't.status'],
]);

/** @implements {import('../../../domain/repositories/TaskRepository.js').TaskRepository} */
export class TaskRepositoryPg extends TaskRepository {
  async create(input) {
    try {
      const sql = `
      INSERT INTO tasks (title, description, project_id, assigned_to, created_by, priority, due_date, estimated_hours)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *;
    `;
      const params = [
        input.title,
        input.description ?? null,
        input.project_id ?? null,
        input.assigned_to ?? input.created_by,
        input.created_by,
        input.priority ?? 'medium',
        input.due_date ?? null,
        input.estimated_hours ?? null,
      ];
      const { rows } = await query(sql, params);
      return rows[0];
    } catch (error) {
      throw new Error(error);
    }
  }

  async list({ limit, offset, status, priority, assigned_to, project_id, sort_by, order }) {
    try {
      const sortCol = SORT_WHITELIST.get(String(sort_by || 'created_at')) || 't.created_at';
      const ord = String(order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const filters = [];
      const values = [];
      let i = 1;

      if (status) {
        filters.push(`t.status = $${i++}`);
        values.push(status);
      }
      if (priority) {
        filters.push(`t.priority = $${i++}`);
        values.push(priority);
      }
      if (assigned_to) {
        filters.push(`t.assigned_to = $${i++}`);
        values.push(assigned_to);
      }
      if (project_id) {
        filters.push(`t.project_id = $${i++}`);
        values.push(project_id);
      }

      const whereSql = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

      const totalSql = `SELECT COUNT(*)::int AS total FROM tasks t ${whereSql};`;
      const { rows: totalRows } = await query(totalSql, values);
      const total = totalRows[0]?.total ?? 0;
      const dataSql = `
      SELECT
        t.*,
        u1.username AS assigned_username,
        u1.first_name AS assigned_first_name,
        u1.last_name  AS assigned_last_name,
        u2.username   AS created_by_username,
        p.name        AS project_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      LEFT JOIN projects p ON t.project_id = p.id
      ${whereSql}
      ORDER BY ${sortCol} ${ord}
      OFFSET $${i} LIMIT $${i + 1};
    `;
      const { rows: items } = await query(dataSql, [...values, offset, limit]);

      return { total, items: items ?? [] };
    } catch (error) {
      throw new Error(error);
    }
  }

  async getById(id) {
    try {
      const sql = `
      SELECT
        t.*,
        u1.username  AS assigned_username,
        u1.first_name AS assigned_first_name,
        u1.last_name  AS assigned_last_name,
        u1.email      AS assigned_email,
        u2.username   AS created_by_username,
        p.name        AS project_name,
        p.description AS project_description
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = $1;
    `;
      const taskRes = await query(sql, [id]);
      if (!taskRes.rows.length) return null;

      const commentsRes = await query(
        `SELECT tc.*, u.username, u.first_name, u.last_name
       FROM task_comments tc JOIN users u ON tc.user_id = u.id
       WHERE tc.task_id = $1 ORDER BY tc.created_at ASC`,
        [id],
      );
      const task = taskRes.rows[0];
      task.comments = commentsRes.rows;
      return task;
    } catch (error) {
      throw new Error(error);
    }
  }

  async update(id, patch) {
    try {
      if (patch.status === 'completed' && !patch.completed_at) {
        patch.completed_at = new Date();
      }
      const fields = [];
      const params = [];
      let i = 1;
      for (const [k, v] of Object.entries(patch)) {
        fields.push(`${k} = $${i++}`);
        params.push(v);
      }
      params.push(id);
      const sql = `
      UPDATE tasks
      SET ${fields.join(', ')}, updated_at = now()
      WHERE id = $${i}
      RETURNING *;
    `;
      const { rows } = await query(sql, params);
      return rows[0] || null;
    } catch (error) {
      throw new Error(error);
    }
  }

  async remove(id) {
    try {
      const { rows } = await query('DELETE FROM tasks WHERE id = $1 RETURNING *;', [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(error);
    }
  }

  async addComment(taskId, userId, content) {
    try {
      const { rows } = await query(
        `INSERT INTO task_comments (task_id, user_id, content)
        VALUES ($1,$2,$3) RETURNING *;`,
        [taskId, userId, content],
      );
      return rows[0];
    } catch (error) {
      throw new Error(error);
    }
  }
}
