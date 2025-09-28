import { query } from '../../../config/database.js';

export class ProjectRepositoryPg {
  async getProjectRepo(projectId) {
    const sql = `
    SELECT p.id, p.name, p.status, p.start_date, p.end_date, p.owner_id
    FROM projects p
    WHERE p.id = $1
    LIMIT 1;
  `;
    const res = await query(sql, [projectId]);
    return res.rows[0] || null;
  }

  async getProjectTaskAggRepo(projectId) {
    const sql = `
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
      COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
      COUNT(*) FILTER (WHERE status = 'done')::int AS done,
      COALESCE(SUM(estimated_hours), 0)::numeric AS total_estimated_hours,
      COALESCE(SUM(actual_hours), 0)::numeric AS total_actual_hours,
      MAX(updated_at) AS last_activity
    FROM tasks
    WHERE project_id = $1;
  `;
    const res = await query(sql, [projectId]);
    return res.rows[0];
  }

  async getTopContributorsRepo(projectId, limit = 5) {
    const sql = `
    SELECT
      t.assigned_to AS user_id, u.username, u.first_name, u.last_name, COUNT(*)::int AS completed_tasks
    FROM tasks t
    JOIN users u ON u.id = t.assigned_to
    WHERE t.project_id = $1 AND t.status = 'done'
    GROUP BY t.assigned_to, u.username, u.first_name, u.last_name
    ORDER BY completed_tasks DESC
    LIMIT $2;
  `;
    const res = await query(sql, [projectId, limit]);
    return res.rows;
  }
}
