import { query, getClient } from '../config/database.js'
import logger from '../utils/logger.js'
import multer from 'multer'
import csvParser from 'csv-parser'
import fs from 'fs'

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  }
})

export const upload = multer({ storage })

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsersQuery = 'SELECT COUNT(*) as total FROM users WHERE is_active = true'
    const totalProjectsQuery = 'SELECT COUNT(*) as total FROM projects'
    const totalTasksQuery = 'SELECT COUNT(*) as total FROM tasks'
    const completedTasksQuery = "SELECT COUNT(*) as total FROM tasks WHERE status = 'completed'"

    const [usersResult, projectsResult, tasksResult, completedResult] = await Promise.all([
      query(totalUsersQuery),
      query(totalProjectsQuery),
      query(totalTasksQuery),
      query(completedTasksQuery)
    ])

    res.json({
      success: true,
      stats: {
        total_users: parseInt(usersResult.rows[0].total),
        total_projects: parseInt(projectsResult.rows[0].total),
        total_tasks: parseInt(tasksResult.rows[0].total),
        completed_tasks: parseInt(completedResult.rows[0].total)
      }
    })
  } catch (error) {
    logger.error('Error obteniendo estadísticas:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getUserProductivityReport = async (req, res) => {
  try {
    const { start_date, end_date, limit = 10, offset = 0 } = req.query

    const productivityQuery = `
      SELECT
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        COUNT(t.id) as total_tasks,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks,
        AVG(CASE WHEN t.status = 'completed' AND t.estimated_hours > 0
            THEN t.actual_hours::float / t.estimated_hours
            ELSE NULL END) as efficiency_ratio,
        SUM(CASE WHEN t.status = 'completed' THEN t.actual_hours ELSE 0 END) as total_hours_worked
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assigned_to
      ${start_date ? "AND t.created_at >= $1" : ""}
      ${end_date ? `AND t.created_at <= $${start_date ? 2 : 1}` : ""}
      WHERE u.is_active = true
      GROUP BY u.id, u.username, u.first_name, u.last_name
      ORDER BY completed_tasks DESC, total_hours_worked DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const params = []
    if (start_date) params.push(start_date)
    if (end_date) params.push(end_date)

    const result = await query(productivityQuery, params)

    res.json({
      success: true,
      report: result.rows
    })
  } catch (error) {
    logger.error('Error generando reporte de productividad:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getProjectReport = async (req, res) => {
  try {
    const { status, owner_id } = req.query

    let whereClause = 'WHERE 1=1'
    const params = []
    let paramCount = 0

    if (status) {
      paramCount++
      whereClause += ` AND p.status = $${paramCount}`
      params.push(status)
    }

    if (owner_id) {
      paramCount++
      whereClause += ` AND p.owner_id = $${paramCount}`
      params.push(owner_id)
    }

    const projectReportQuery = `
      SELECT
        p.id,
        p.name,
        p.description,
        p.status,
        p.start_date,
        p.end_date,
        p.budget,
        u.username as owner_username,
        COUNT(t.id) as total_tasks,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_tasks,
        COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks,
        ROUND(
          COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::numeric /
          NULLIF(COUNT(t.id), 0) * 100, 2
        ) as completion_percentage,
        SUM(t.estimated_hours) as total_estimated_hours,
        SUM(t.actual_hours) as total_actual_hours,
        CASE
          WHEN SUM(t.estimated_hours) > 0
          THEN ROUND((SUM(t.actual_hours)::numeric / SUM(t.estimated_hours)) * 100, 2)
          ELSE 0
        END as time_efficiency_percentage
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN tasks t ON p.id = t.project_id
      ${whereClause}
      GROUP BY p.id, p.name, p.description, p.status, p.start_date, p.end_date, p.budget, u.username
      ORDER BY p.created_at DESC
    `

    const result = await query(projectReportQuery, params)

    res.json({
      success: true,
      projects: result.rows
    })
  } catch (error) {
    logger.error('Error generando reporte de proyectos:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getTimeTrackingAnalysis = async (req, res) => {
  try {
    const {
      user_id,
      project_id,
      start_date,
      end_date,
      group_by = 'day' // day, week, month
    } = req.query

    let dateGrouping
    switch (group_by) {
      case 'week':
        dateGrouping = "DATE_TRUNC('week', te.start_time)"
        break
      case 'month':
        dateGrouping = "DATE_TRUNC('month', te.start_time)"
        break
      default:
        dateGrouping = "DATE_TRUNC('day', te.start_time)"
    }

    let whereClause = 'WHERE 1=1'
    const params = []
    let paramCount = 0

    if (user_id) {
      paramCount++
      whereClause += ` AND te.user_id = $${paramCount}`
      params.push(user_id)
    }

    if (project_id) {
      paramCount++
      whereClause += ` AND t.project_id = $${paramCount}`
      params.push(project_id)
    }

    if (start_date) {
      paramCount++
      whereClause += ` AND te.start_time >= $${paramCount}`
      params.push(start_date)
    }

    if (end_date) {
      paramCount++
      whereClause += ` AND te.start_time <= $${paramCount}`
      params.push(end_date)
    }

    const timeAnalysisQuery = `
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
      ORDER BY period DESC
    `

    const result = await query(timeAnalysisQuery, params)

    res.json({
      success: true,
      analysis: result.rows,
      group_by: group_by
    })
  } catch (error) {
    logger.error('Error en análisis de tiempo:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const importTasksFromCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Archivo CSV requerido' })
    }

    const results = []
    const errors = []

    fs.createReadStream(req.file.path)
      .pipe(csvParser())
      .on('data', (data) => {
        results.push(data)
      })
      .on('end', async () => {
        try {
          for (const row of results) {
            try {
              const insertTaskQuery = `
                INSERT INTO tasks (title, description, status, priority, project_id, assigned_to, created_by, estimated_hours)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              `

              await query(insertTaskQuery, [
                row.title || 'Tarea sin título',
                row.description || '',
                row.status || 'pending',
                row.priority || 'medium',
                row.project_id || null,
                row.assigned_to || req.user.userId,
                req.user.userId,
                parseInt(row.estimated_hours) || null
              ])
            } catch (error) {
              errors.push({
                row: row,
                error: error.message
              })
            }
          }

          res.json({
            success: true,
            message: `Procesadas ${results.length} filas`,
            imported: results.length - errors.length,
            errors: errors.length,
            error_details: errors
          })
        } catch (error) {
          logger.error('Error procesando CSV:', error.message)
          res.status(500).json({ error: 'Error procesando archivo' })
        }
      })
      .on('error', (error) => {
        logger.error('Error leyendo CSV:', error.message)
        res.status(500).json({ error: 'Error leyendo archivo CSV' })
      })

  } catch (error) {
    logger.error('Error en importación:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getUserRanking = async (req, res) => {
  try {
    const { start_date, end_date, limit = 10, offset = 0 } = req.query

    // Nota: definimos una "score" simple y transparente:
    //   score = completed_tasks*2 + in_progress_tasks*0.5 + COALESCE(efficiency_ratio, 1)*1
    // donde efficiency_ratio = avg(actual_hours / estimated_hours) en tareas completadas
    const sql = `
      WITH base AS (
        SELECT
          u.id,
          u.username,
          u.first_name,
          u.last_name,
          COUNT(t.id)                       AS total_tasks,
          COUNT(CASE WHEN t.status = 'completed'   THEN 1 END) AS completed_tasks,
          COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) AS in_progress_tasks,
          AVG(
            CASE
              WHEN t.status = 'completed' AND t.estimated_hours > 0
                THEN t.actual_hours::float / t.estimated_hours
            END
          ) AS efficiency_ratio,
          SUM(CASE WHEN t.status = 'completed' THEN t.actual_hours ELSE 0 END) AS total_hours_worked
        FROM users u
        LEFT JOIN tasks t
          ON t.assigned_to = u.id
         AND ($1::timestamptz IS NULL OR t.created_at >= $1)
         AND ($2::timestamptz IS NULL OR t.created_at <= $2)
        WHERE u.is_active = TRUE
        GROUP BY u.id, u.username, u.first_name, u.last_name
      )
      SELECT *,
             (completed_tasks*2
              + in_progress_tasks*0.5
              + COALESCE(efficiency_ratio,1)*1
             )::numeric(10,2) AS score
      FROM base
      ORDER BY score DESC, completed_tasks DESC
      LIMIT $3 OFFSET $4;
    `
    const params = [
      start_date || null,
      end_date || null,
      Number(limit),
      Number(offset)
    ]
    const { rows } = await query(sql, params)
    res.json({ success: true, ranking: rows })
  } catch (e) {
    logger.error('Error en user-ranking:', e.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}


export const getProjectTimeline = async (req, res) => {
  try {
    const { project_id, start_date, end_date } = req.query

    const sql = `
      WITH milestones AS (
        -- inicio del proyecto
        SELECT
          p.id::uuid                         AS project_id,
          p.name::text                       AS project_name,
          p.start_date::timestamptz          AS event_date,
          'project_start'::text              AS event_type,
          NULL::uuid                         AS task_id,
          NULL::text                         AS task_title
        FROM projects p
        WHERE ($1::uuid IS NULL OR p.id = $1)

        UNION ALL
        -- fin del proyecto
        SELECT
          p.id::uuid,
          p.name::text,
          p.end_date::timestamptz,
          'project_end'::text,
          NULL::uuid,
          NULL::text
        FROM projects p
        WHERE ($1::uuid IS NULL OR p.id = $1)

        UNION ALL
        -- due dates de tareas
        SELECT
          t.project_id::uuid,
          p.name::text,
          t.due_date::timestamptz,
          'task_due'::text,
          t.id::uuid,
          t.title::text
        FROM tasks t
        JOIN projects p ON p.id = t.project_id
        WHERE t.due_date IS NOT NULL
          AND ($1::uuid IS NULL OR t.project_id = $1)

        UNION ALL
        -- tareas completadas
        SELECT
          t.project_id::uuid,
          p.name::text,
          t.completed_at::timestamptz,
          'task_completed'::text,
          t.id::uuid,
          t.title::text
        FROM tasks t
        JOIN projects p ON p.id = t.project_id
        WHERE t.completed_at IS NOT NULL
          AND ($1::uuid IS NULL OR t.project_id = $1)
      ),
      filtered AS (
        SELECT *
        FROM milestones
        WHERE event_date IS NOT NULL
          AND ($2::timestamptz IS NULL OR event_date >= $2)
          AND ($3::timestamptz IS NULL OR event_date <= $3)
      ),
      progress AS (
        SELECT
          p.id::uuid                         AS project_id,
          p.name::text                       AS project_name,
          COUNT(t.id)                        AS total_tasks,
          COUNT(CASE WHEN t.status='completed' THEN 1 END) AS completed_tasks,
          ROUND(
            COUNT(CASE WHEN t.status='completed' THEN 1 END)::numeric
            / NULLIF(COUNT(t.id),0) * 100, 2
          ) AS completion_percentage
        FROM projects p
        LEFT JOIN tasks t ON t.project_id = p.id
        WHERE ($1::uuid IS NULL OR p.id = $1)
        GROUP BY p.id, p.name
      )
      SELECT
        f.project_id,
        f.project_name,
        f.event_date,
        f.event_type,
        f.task_id,
        f.task_title,
        pr.total_tasks,
        pr.completed_tasks,
        pr.completion_percentage
      FROM filtered f
      LEFT JOIN progress pr
        ON pr.project_id = f.project_id
      ORDER BY f.project_id, f.event_date;
    `

    const params = [
      project_id || null,        // <-- NO Number(), es UUID
      start_date || null,
      end_date || null
    ]

    const { rows } = await query(sql, params)
    res.json({ success: true, timeline: rows })
  } catch (e) {
    logger.error('Error en project-timeline:', e.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}



export const getWorkloadDistribution = async (req, res) => {
  try {
    const { scope = 'user', status } = req.query
    const byUser = scope === 'user'

    const sql = byUser
      ? `
        SELECT
          u.id            AS owner_id,
          u.username      AS owner_name,
          COUNT(t.id)     AS total_tasks,
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
        SELECT
          p.id            AS owner_id,
          p.name          AS owner_name,
          COUNT(t.id)     AS total_tasks,
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
      `

    const { rows } = await query(sql, [status || null])

    res.json({
      success: true,
      scope: byUser ? 'user' : 'project',
      distribution: rows
    })
  } catch (e) {
    logger.error('Error en workload-distribution:', e.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

const toCSV = (rows) => {
  if (!rows?.length) return ''
  const headers = Object.keys(rows[0])
  const escape = (v) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const head = headers.join(',')
  const body = rows.map(r => headers.map(h => escape(r[h])).join(',')).join('\n')
  return head + '\n' + body
}

export const exportData = async (req, res) => {
  try {
    const { type = 'productivity', format = 'csv', filters = {} } = req.body || {}
    const { start_date = null, end_date = null } = filters

    // Preparamos una consulta por "tipo" para reutilizar tu lógica:
    let sql, params
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
      `
      params = [start_date, end_date]
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
      `
      params = []
    } else if (type === 'time') {
      sql = `
        SELECT
          te.id, te.user_id, te.task_id, te.start_time, te.end_time, te.hours_logged, te.description
        FROM time_entries te
        WHERE ($1::timestamptz IS NULL OR te.start_time >= $1)
          AND ($2::timestamptz IS NULL OR te.start_time <= $2)
        ORDER BY te.start_time DESC;
      `
      params = [start_date, end_date]
    } else if (type === 'tasks') {
      sql = `
        SELECT
          t.id, t.title, t.status, t.priority, t.project_id, t.assigned_to,
          t.due_date, t.completed_at, t.estimated_hours, t.actual_hours, t.created_at, t.updated_at
        FROM tasks t
        WHERE ($1::timestamptz IS NULL OR t.created_at >= $1)
          AND ($2::timestamptz IS NULL OR t.created_at <= $2)
        ORDER BY t.created_at DESC;
      `
      params = [start_date, end_date]
    } else {
      return res.status(400).json({ error: 'type inválido' })
    }

    const { rows } = await query(sql, params)

    // Si piden excel, intentamos exceljs; si no está, devolvemos CSV.
    if (format === 'excel') {
      try {
        const ExcelJS = (await import('exceljs')).default
        const workbook = new ExcelJS.Workbook()
        const sheet = workbook.addWorksheet(type)
        if (rows.length) {
          sheet.columns = Object.keys(rows[0]).map(k => ({ header: k, key: k }))
          rows.forEach(r => sheet.addRow(r))
        }
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', `attachment; filename=${type}.xlsx`)
        await workbook.xlsx.write(res)
        return res.end()
      } catch (e) {
        logger.warn('exceljs no disponible, exportando CSV:', e.message)
        // caemos a CSV
      }
    }

    // CSV por defecto
    const csv = toCSV(rows)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename=${type}.csv`)
    return res.status(200).send(csv)
  } catch (e) {
    logger.error('Error en export-data:', e.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
