CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- USERS
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_role       ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active  ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_username_trgm ON users USING gin (LOWER(username) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_email_trgm    ON users USING gin (LOWER(email) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_fname_trgm    ON users USING gin (LOWER(first_name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_lname_trgm    ON users USING gin (LOWER(last_name) gin_trgm_ops);

-- TASKS
CREATE INDEX IF NOT EXISTS idx_tasks_status         ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority       ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to    ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id     ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at     ON tasks(created_at);
-- CREATE INDEX IF NOT EXISTS idx_tasks_created_id  ON tasks(created_at, id); -- si usas keyset

-- NOTIFICATIONS
CREATE INDEX IF NOT EXISTS idx_notif_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_user_unread  ON notifications(user_id, is_read, created_at DESC);
