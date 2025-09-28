import { query } from '../../../config/database.js';
import { ReportRepository } from '../../../domain/repositories/ReportRepository.js';
import { toCSV } from '../../../utils/toCSV.js';
import fs from 'fs';
import csvParser from 'csv-parser';
import logger from '../../../utils/logger.js';

/** @implements {import('../../../domain/repositories/ReportRepository.js').ReportRepository} */
export class ReportRepositoryPg extends ReportRepository {
  async getDashboardStats() {
    try {
      const q1 = 'SELECT COUNT(*)::int AS total FROM users WHERE is_active = TRUE';
      const q2 = 'SELECT COUNT(*)::int AS total FROM projects';
      const q3 = 'SELECT COUNT(*)::int AS total FROM tasks';
      const q4 = "SELECT COUNT(*)::int AS total FROM tasks WHERE status = 'completed'";
      const [a, b, c, d] = await Promise.all([query(q1), query(q2), query(q3), query(q4)]);
      return {
        total_users: a.rows[0].total,
        total_projects: b.rows[0].total,
        total_tasks: c.rows[0].total,
        completed_tasks: d.rows[0].total,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  async getUserProductivity({ start = null, end = null, limit = 10, offset = 0 }) {
    try {
      const sql = `
      WITH base AS (
        SELECT
          u.id, u.username, u.first_name, u.last_name,
          COUNT(t.id) AS total_tasks,
          COUNT(CASE WHEN t.status='completed'   THEN 1 END) AS completed_tasks,
          COUNT(CASE WHEN t.status='in_progress' THEN 1 END) AS in_progress_tasks,
          AVG(CASE WHEN t.status='completed' AND t.estimated_hours>0
              THEN t.actual_hours::float / NULLIF(t.estimated_hours,0) END) AS efficiency_ratio,
          SUM(CASE WHEN t.status='completed' THEN COALESCE(t.actual_hours,0) ELSE 0 END) AS total_hours_worked
        FROM users u
        LEFT JOIN tasks t
          ON t.assigned_to = u.id
         AND ($1::timestamptz IS NULL OR t.created_at >= $1)
         AND ($2::timestamptz IS NULL OR t.created_at <= $2)
        WHERE u.is_active = TRUE
        GROUP BY u.id, u.username, u.first_name, u.last_name
      ), ranked AS (
        SELECT * FROM base
        ORDER BY completed_tasks DESC, total_hours_worked DESC
      )
      SELECT
        (SELECT COUNT(*) FROM ranked) AS total,
        (SELECT jsonb_agg(row_to_json(r))
         FROM (SELECT * FROM ranked OFFSET $3 LIMIT $4) r) AS items;
    `;
      const { rows } = await query(sql, [start, end, offset, limit]);
      return { total: Number(rows[0].total), items: rows[0].items ?? [] };
    } catch (error) {
      throw new Error(error);
    }
  }

  async getUserRanking({ start = null, end = null, limit = 10, page = 1 }) {
    try {
      page = Number.isFinite(+page) && +page > 0 ? +page : 1;
      limit = Number.isFinite(+limit) && +limit > 0 && +limit <= 100 ? +limit : 20;
      const offset = (page - 1) * limit;

      const totalSql = `SELECT COUNT(*)::int AS total FROM users u WHERE u.is_active = TRUE;`;
      const totalRes = await query(totalSql, []);
      const total = totalRes.rows[0]?.total ?? 0;

      const dataSql = `
        WITH base AS (
          SELECT
            u.id, u.username, u.first_name, u.last_name,
            COUNT(t.id)::int AS total_tasks,
            COUNT(*) FILTER (WHERE t.status = 'done')::int         AS completed_tasks,
            COUNT(*) FILTER (WHERE t.status = 'in_progress')::int  AS in_progress_tasks,
            AVG(CASE
                  WHEN t.status='done' AND COALESCE(t.estimated_hours,0) > 0
                  THEN t.actual_hours::float / NULLIF(t.estimated_hours,0)
                END) AS efficiency_ratio, -- double precision
            SUM(CASE WHEN t.status='done' THEN COALESCE(t.actual_hours,0) ELSE 0 END)::numeric AS total_hours_worked
          FROM users u
          LEFT JOIN tasks t
            ON t.assigned_to = u.id
          AND ($1::timestamptz IS NULL OR t.created_at >= $1)
          AND ($2::timestamptz IS NULL OR t.created_at <= $2)
          WHERE u.is_active = TRUE
          GROUP BY u.id, u.username, u.first_name, u.last_name
        )
        SELECT
          id, username, first_name, last_name,
          total_tasks, completed_tasks, in_progress_tasks,
          COALESCE(ROUND(efficiency_ratio::numeric, 2), 1) AS efficiency_ratio,
          total_hours_worked,
          ROUND( (
            completed_tasks*2
            + COALESCE(in_progress_tasks,0)*0.5
            + COALESCE(efficiency_ratio,1)
          )::numeric, 2) AS score
        FROM base
        ORDER BY score DESC, completed_tasks DESC, id ASC
        OFFSET $3 LIMIT $4;
      `;
      const dataRes = await query(dataSql, [start, end, offset, limit]);

      return {
        total,
        total_pages: total ? Math.ceil(total / limit) : 1,
        page,
        limit,
        items: dataRes.rows,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  async getProjectReport({ status = null, ownerId = null }) {
    try {
      let where = 'WHERE 1=1';
      const params = [];
      let i = 1;
      if (status) {
        where += ` AND p.status = $${i++}`;
        params.push(status);
      }
      if (ownerId) {
        where += ` AND p.owner_id = $${i++}`;
        params.push(ownerId);
      }

      const sql = `
      SELECT
        p.id, p.name, p.description, p.status, p.start_date, p.end_date, p.budget,
        u.username AS owner_username,
        COUNT(t.id) AS total_tasks,
        COUNT(CASE WHEN t.status='completed'   THEN 1 END) AS completed_tasks,
        COUNT(CASE WHEN t.status='pending'     THEN 1 END) AS pending_tasks,
        COUNT(CASE WHEN t.status='in_progress' THEN 1 END) AS in_progress_tasks,
        ROUND(
          COUNT(CASE WHEN t.status='completed' THEN 1 END)::numeric /
          NULLIF(COUNT(t.id),0) * 100, 2
        ) AS completion_percentage,
        SUM(COALESCE(t.estimated_hours,0)) AS total_estimated_hours,
        SUM(COALESCE(t.actual_hours,0))    AS total_actual_hours,
        CASE
          WHEN SUM(COALESCE(t.estimated_hours,0)) > 0
          THEN ROUND((SUM(COALESCE(t.actual_hours,0))::numeric / NULLIF(SUM(COALESCE(t.estimated_hours,0)),0)) * 100, 2)
          ELSE 0
        END AS time_efficiency_percentage
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN tasks t ON p.id = t.project_id
      ${where}
      GROUP BY p.id, p.name, p.description, p.status, p.start_date, p.end_date, p.budget, u.username
      ORDER BY p.created_at DESC;
    `;
      const { rows } = await query(sql, params);
      return rows;
    } catch (error) {
      throw new Error(error);
    }
  }

  async getProjectTimeline({ projectId = null, start = null, end = null }) {
    try {
      const sql = `
      WITH milestones AS (
        SELECT p.id::uuid AS project_id, p.name::text AS project_name,
               p.start_date::timestamptz AS event_date, 'project_start'::text AS event_type,
               NULL::uuid AS task_id, NULL::text AS task_title
        FROM projects p WHERE ($1::uuid IS NULL OR p.id = $1)
        UNION ALL
        SELECT p.id::uuid, p.name::text, p.end_date::timestamptz, 'project_end'::text, NULL::uuid, NULL::text
        FROM projects p WHERE ($1::uuid IS NULL OR p.id = $1)
        UNION ALL
        SELECT t.project_id::uuid, p.name::text, t.due_date::timestamptz, 'task_due'::text, t.id::uuid, t.title::text
        FROM tasks t JOIN projects p ON p.id = t.project_id
        WHERE t.due_date IS NOT NULL AND ($1::uuid IS NULL OR t.project_id = $1)
        UNION ALL
        SELECT t.project_id::uuid, p.name::text, t.completed_at::timestamptz, 'task_completed'::text, t.id::uuid, t.title::text
        FROM tasks t JOIN projects p ON p.id = t.project_id
        WHERE t.completed_at IS NOT NULL AND ($1::uuid IS NULL OR t.project_id = $1)
      ), filtered AS (
        SELECT * FROM milestones
        WHERE event_date IS NOT NULL
          AND ($2::timestamptz IS NULL OR event_date >= $2)
          AND ($3::timestamptz IS NULL OR event_date <= $3)
      ), progress AS (
        SELECT p.id::uuid AS project_id, p.name::text AS project_name,
               COUNT(t.id) AS total_tasks,
               COUNT(CASE WHEN t.status='completed' THEN 1 END) AS completed_tasks,
               ROUND(COUNT(CASE WHEN t.status='completed' THEN 1 END)::numeric / NULLIF(COUNT(t.id),0) * 100, 2)
               AS completion_percentage
        FROM projects p
        LEFT JOIN tasks t ON t.project_id = p.id
        WHERE ($1::uuid IS NULL OR p.id = $1)
        GROUP BY p.id, p.name
      )
      SELECT f.project_id, f.project_name, f.event_date, f.event_type, f.task_id, f.task_title,
             pr.total_tasks, pr.completed_tasks, pr.completion_percentage
      FROM filtered f
      LEFT JOIN progress pr ON pr.project_id = f.project_id
      ORDER BY f.project_id, f.event_date;
    `;
      const { rows } = await query(sql, [projectId, start, end]);
      return rows;
    } catch (error) {
      throw new Error(error);
    }
  }

  async getWorkloadDistribution({ scope = 'user', status = null }) {
    try {
      const byUser = scope === 'user';
      const sql = byUser
        ? `
      SELECT u.id AS owner_id, u.username AS owner_name,
             COUNT(t.id) AS total_tasks,
             COUNT(CASE WHEN t.status='pending'     THEN 1 END) AS pending_tasks,
             COUNT(CASE WHEN t.status='in_progress' THEN 1 END) AS in_progress_tasks,
             COUNT(CASE WHEN t.status='completed'   THEN 1 END) AS completed_tasks,
             SUM(COALESCE(t.estimated_hours,0)) AS total_estimated_hours,
             SUM(COALESCE(t.actual_hours,0))    AS total_actual_hours
      FROM users u
      LEFT JOIN tasks t
        ON t.assigned_to = u.id
       AND ($1::text IS NULL OR t.status = $1)
      WHERE u.is_active = TRUE
      GROUP BY u.id, u.username
      ORDER BY total_tasks DESC;
    `
        : `
      SELECT p.id AS owner_id, p.name AS owner_name,
             COUNT(t.id) AS total_tasks,
             COUNT(CASE WHEN t.status='pending'     THEN 1 END) AS pending_tasks,
             COUNT(CASE WHEN t.status='in_progress' THEN 1 END) AS in_progress_tasks,
             COUNT(CASE WHEN t.status='completed'   THEN 1 END) AS completed_tasks,
             SUM(COALESCE(t.estimated_hours,0)) AS total_estimated_hours,
             SUM(COALESCE(t.actual_hours,0))    AS total_actual_hours
      FROM projects p
      LEFT JOIN tasks t
        ON t.project_id = p.id
       AND ($1::text IS NULL OR t.status = $1)
      GROUP BY p.id, p.name
      ORDER BY total_tasks DESC;
    `;
      const { rows } = await query(sql, [status]);
      return rows;
    } catch (error) {
      throw new Error(error);
    }
  }

  async exportData({ type = 'productivity', format = 'csv', filters = {} }) {
    const { start_date = null, end_date = null } = filters || {};
    let sql, params;

    if (type === 'productivity') {
      sql = `
        SELECT
          u.id, u.username, u.first_name, u.last_name,
          COUNT(t.id) AS total_tasks,
          COUNT(CASE WHEN t.status='completed' THEN 1 END) AS completed_tasks,
          COUNT(CASE WHEN t.status='in_progress' THEN 1 END) AS in_progress_tasks,
          AVG(
            CASE WHEN t.status='completed' AND t.estimated_hours>0
              THEN t.actual_hours::float / t.estimated_hours
            END
          ) AS efficiency_ratio,
          SUM(CASE WHEN t.status='completed' THEN t.actual_hours ELSE 0 END) AS total_hours_worked
        FROM users u
        LEFT JOIN tasks t
          ON t.assigned_to = u.id
         AND ($1::timestamptz IS NULL OR t.created_at >= $1)
         AND ($2::timestamptz IS NULL OR t.created_at <= $2)
        WHERE u.is_active = TRUE
        GROUP BY u.id, u.username, u.first_name, u.last_name
        ORDER BY completed_tasks DESC, total_hours_worked DESC;
      `;
      params = [start_date, end_date];
    } else if (type === 'projects') {
      sql = `
        SELECT
          p.id, p.name, p.status, p.start_date, p.end_date, p.budget,
          COUNT(t.id) AS total_tasks,
          COUNT(CASE WHEN t.status='completed' THEN 1 END) AS completed_tasks,
          COUNT(CASE WHEN t.status='pending' THEN 1 END)   AS pending_tasks,
          COUNT(CASE WHEN t.status='in_progress' THEN 1 END) AS in_progress_tasks,
          ROUND(
            COUNT(CASE WHEN t.status='completed' THEN 1 END)::numeric /
            NULLIF(COUNT(t.id),0) * 100, 2
          ) AS completion_percentage,
          SUM(t.estimated_hours) AS total_estimated_hours,
          SUM(t.actual_hours)    AS total_actual_hours
        FROM projects p
        LEFT JOIN tasks t ON t.project_id = p.id
        GROUP BY p.id, p.name, p.status, p.start_date, p.end_date, p.budget
        ORDER BY p.created_at DESC;
      `;
      params = [];
    } else if (type === 'time') {
      sql = `
        SELECT
          te.id, te.user_id, te.task_id, te.start_time, te.end_time, te.hours_logged, te.description
        FROM time_entries te
        WHERE ($1::timestamptz IS NULL OR te.start_time >= $1)
          AND ($2::timestamptz IS NULL OR te.start_time <= $2)
        ORDER BY te.start_time DESC;
      `;
      params = [start_date, end_date];
    } else if (type === 'tasks') {
      sql = `
        SELECT
          t.id, t.title, t.status, t.priority, t.project_id, t.assigned_to,
          t.due_date, t.completed_at, t.estimated_hours, t.actual_hours, t.created_at, t.updated_at
        FROM tasks t
        WHERE ($1::timestamptz IS NULL OR t.created_at >= $1)
          AND ($2::timestamptz IS NULL OR t.created_at <= $2)
        ORDER BY t.created_at DESC;
      `;
      params = [start_date, end_date];
    } else {
      const e = new Error('type inválido');
      e.status = 400;
      throw e;
    }

    const { rows } = await query(sql, params);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = `${type}-${timestamp}`;

    if (format === 'excel') {
      try {
        const ExcelJS = (await import('exceljs')).default;
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet(type);

        if (rows.length) {
          sheet.columns = Object.keys(rows[0]).map((k) => ({ header: k, key: k }));
          rows.forEach((r) => sheet.addRow(r));
          sheet.columns.forEach((col) => {
            col.width = Math.min(Math.max(10, (col.header?.length || 10) + 2), 40);
          });
        } else {
          sheet.addRow(['No hay datos']);
        }

        const buffer = await workbook.xlsx.writeBuffer();
        return {
          buffer: Buffer.from(buffer),
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          filename: `${baseName}.xlsx`,
        };
      } catch (err) {
        logger.warn(`exceljs no disponible, exportando CSV. Motivo: ${err?.message}`);
      }
    }

    const csv = toCSV(rows);
    return {
      csv,
      filename: `${baseName}.csv`,
    };
  }

  async importTasksBatch(rows, userId, client) {
    try {
      if (!rows?.length) return 0;
      const cols = 8;
      const values = [];
      const params = [];
      rows.forEach((r, idx) => {
        const i = idx * cols;
        values.push(
          `($${i + 1},$${i + 2},$${i + 3},$${i + 4},$${i + 5},$${i + 6},$${i + 7},$${i + 8})`,
        );
        params.push(
          r.title || 'Tarea sin título',
          r.description || '',
          r.status || 'pending',
          r.priority || 'medium',
          r.project_id || null,
          r.assigned_to || userId,
          userId,
          r.estimated_hours ? Number(r.estimated_hours) : null,
        );
      });
      const sql = `
        INSERT INTO tasks (title, description, status, priority, project_id, assigned_to, created_by, estimated_hours)
        VALUES ${values.join(',')}
      `;
      await client.query(sql, params);
      return rows.length;
    } catch (error) {
      throw new Error(error);
    }
  }

  async importTasksFromCSV({ file, userId }) {
    return new Promise((resolve, reject) => {
      const results = [];
      const errors = [];

      // eslint-disable-next-line security/detect-non-literal-fs-filename
      fs.createReadStream(file.path)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          try {
            for (const row of results) {
              try {
                const sql = `
                  INSERT INTO tasks (
                    title, description, status, priority,
                    project_id, assigned_to, created_by, estimated_hours
                  )
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `;

                await query(sql, [
                  row.title || 'Tarea sin título',
                  row.description || '',
                  row.status || 'pending',
                  row.priority || 'medium',
                  row.project_id || null,
                  row.assigned_to || userId,
                  userId,
                  parseInt(row.estimated_hours) || null,
                ]);
              } catch (err) {
                errors.push({ row, error: err.message });
              }
            }

            resolve({
              processed: results.length,
              imported: results.length - errors.length,
              errors: errors.length,
              error_details: errors,
            });
          } catch (err) {
            reject(err);
          }
        })
        .on('error', (err) => reject(err));
    });
  }

  async getTimeTrackingAnalysis({
    user_id = null,
    project_id = null,
    start_date = null,
    end_date = null,
    group_by = 'day',
  }) {
    try {
      let dateGrouping;
      switch (group_by) {
        case 'week':
          dateGrouping = "DATE_TRUNC('week', te.start_time)";
          break;
        case 'month':
          dateGrouping = "DATE_TRUNC('month', te.start_time)";
          break;
        default:
          dateGrouping = "DATE_TRUNC('day', te.start_time)";
      }

      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;

      if (user_id) {
        paramCount++;
        whereClause += ` AND te.user_id = $${paramCount}`;
        params.push(user_id);
      }

      if (project_id) {
        paramCount++;
        whereClause += ` AND t.project_id = $${paramCount}`;
        params.push(project_id);
      }

      if (start_date) {
        paramCount++;
        whereClause += ` AND te.start_time >= $${paramCount}`;
        params.push(start_date);
      }

      if (end_date) {
        paramCount++;
        whereClause += ` AND te.start_time <= $${paramCount}`;
        params.push(end_date);
      }

      const sql = `
        SELECT
          ${dateGrouping} as period,
          COUNT(DISTINCT te.user_id) as active_users,
          COUNT(te.id) as total_entries,
          SUM(te.hours_logged) as total_hours,
          AVG(te.hours_logged) as avg_hours_per_entry,
          COUNT(DISTINCT t.id) as tasks_worked_on,
          COUNT(DISTINCT t.project_id) as projects_involved
        FROM time_entries te
        JOIN tasks t ON te.task_id = t.id
        ${whereClause}
        GROUP BY ${dateGrouping}
        ORDER BY period DESC;
      `;

      const { rows } = await query(sql, params);
      return rows;
    } catch (err) {
      throw new Error(`getTimeTrackingAnalysis error: ${err.message}`);
    }
  }
}
