import { query } from '../../../config/database.js';

export class NotificationRepositoryPg {
  async listByUser({ userId, page, limit, only_unread }) {
    const offset = (page - 1) * limit;
    const where = ['user_id = $1'];
    if (only_unread) {
      where.push('is_read = TRUE = FALSE');
    }
    const sqlWhere = only_unread ? 'user_id = $1 AND is_read = false' : 'user_id = $1';
    const { rows } = await query(
      `SELECT id, type, title, message, related_id, is_read, created_at
       FROM notifications WHERE ${sqlWhere}
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
    const { rows: countRows } = await query(
      `SELECT COUNT(*)::int AS total FROM notifications WHERE ${sqlWhere}`,
      [userId],
    );
    return { items: rows, total: countRows[0].total };
  }

  async markRead({ userId, id }) {
    const { rowCount } = await query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );

    return rowCount > 0;
  }

  async markReadMany({ userId, ids, all }) {
    if (all) {
      const { rowCount } = await query(
        `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
        [userId],
      );
      return rowCount;
    }
    const { rowCount } = await query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1 AND id = ANY($2::uuid[])`,
      [userId, ids],
    );
    return rowCount;
  }

  async create({ userId, type, title, message, related_id, is_read }) {
    const { rows } = await query(
      `INSERT INTO notifications (user_id, type, title, message, related_id, is_read)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [userId, type, title, message, related_id, is_read ?? {}],
    );
    return rows[0];
  }

  async getPreferences({ userId }) {
    const { rows } = await query(
      `SELECT user_id, email_enabled, push_enabled, inapp_enabled, per_type, updated_at
       FROM notification_preferences WHERE user_id=$1`,
      [userId],
    );
    return rows[0] ?? null;
  }

  async upsertPreferences({ userId, prefs }) {
    const { rows } = await query(
      `INSERT INTO notification_preferences (user_id, email_enabled, push_enabled, inapp_enabled, per_type)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_id) DO UPDATE
       SET email_enabled=EXCLUDED.email_enabled,
           push_enabled=EXCLUDED.push_enabled,
           inapp_enabled=EXCLUDED.inapp_enabled,
           per_type=EXCLUDED.per_type,
           updated_at=now()
       RETURNING *`,
      [
        userId,
        prefs.email_enabled ?? true,
        prefs.push_enabled ?? true,
        prefs.inapp_enabled ?? true,
        prefs.per_type ?? {},
      ],
    );
    return rows[0];
  }

  async upsertTemplate({ type, locale, subject, html }) {
    const { rows } = await query(
      `INSERT INTO notification_templates (type, locale, subject, html)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (type, locale) DO UPDATE
       SET subject=EXCLUDED.subject, html=EXCLUDED.html
       RETURNING *`,
      [type, locale, subject, html],
    );
    return rows[0];
  }

  async getTemplate({ type, locale }) {
    const { rows } = await query(
      `SELECT * FROM notification_templates WHERE type=$1 AND locale=$2`,
      [type, locale],
    );
    return rows[0] ?? null;
  }
}
