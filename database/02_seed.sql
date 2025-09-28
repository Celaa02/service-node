-- Datos de prueba para Plurall Backend Test
-- Este archivo crea datos representativos para testing

-- Insertar usuarios de prueba
INSERT INTO users (id, username, email, password_hash, role, first_name, last_name, is_active, email_verified) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin', 'admin@plurall.com', '$2a$08$7Jw.V8zOAyWJ1qPm1o2M1u0H6h4v8JI1Z3yLJKOQGKx1YZGqVKlKm', 'admin', 'Admin', 'User', true, true),
('550e8400-e29b-41d4-a716-446655440002', 'jgarcia', 'juan.garcia@plurall.com', '$2a$08$7Jw.V8zOAyWJ1qPm1o2M1u0H6h4v8JI1Z3yLJKOQGKx1YZGqVKlKm', 'manager', 'Juan', 'García', true, true),
('550e8400-e29b-41d4-a716-446655440003', 'mrodriguez', 'maria.rodriguez@plurall.com', '$2a$08$7Jw.V8zOAyWJ1qPm1o2M1u0H6h4v8JI1Z3yLJKOQGKx1YZGqVKlKm', 'user', 'María', 'Rodríguez', true, true),
('550e8400-e29b-41d4-a716-446655440004', 'calopez', 'carlos.lopez@plurall.com', '$2a$08$7Jw.V8zOAyWJ1qPm1o2M1u0H6h4v8JI1Z3yLJKOQGKx1YZGqVKlKm', 'user', 'Carlos', 'López', true, true),
('550e8400-e29b-41d4-a716-446655440005', 'amartinez', 'ana.martinez@plurall.com', '$2a$08$7Jw.V8zOAyWJ1qPm1o2M1u0H6h4v8JI1Z3yLJKOQGKx1YZGqVKlKm', 'user', 'Ana', 'Martínez', true, true),
('550e8400-e29b-41d4-a716-446655440006', 'dperez', 'david.perez@plurall.com', '$2a$08$7Jw.V8zOAyWJ1qPm1o2M1u0H6h4v8JI1Z3yLJKOQGKx1YZGqVKlKm', 'user', 'David', 'Pérez', false, false),
('550e8400-e29b-41d4-a716-446655440007', 'lgomez', 'lucia.gomez@plurall.com', '$2a$08$7Jw.V8zOAyWJ1qPm1o2M1u0H6h4v8JI1Z3yLJKOQGKx1YZGqVKlKm', 'user', 'Lucía', 'Gómez', true, true);

-- Insertar proyectos
INSERT INTO projects (id, name, description, status, start_date, end_date, budget, owner_id) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'Plataforma E-Learning', 'Desarrollo de nueva plataforma educativa', 'active', '2024-01-15', '2024-12-31', 150000.00, '550e8400-e29b-41d4-a716-446655440002'),
('650e8400-e29b-41d4-a716-446655440002', 'App Mobile Estudiantes', 'Aplicación móvil para estudiantes', 'active', '2024-03-01', '2024-08-30', 75000.00, '550e8400-e29b-41d4-a716-446655440002'),
('650e8400-e29b-41d4-a716-446655440003', 'Sistema de Evaluaciones', 'Sistema automatizado de evaluaciones', 'completed', '2023-09-01', '2024-02-29', 90000.00, '550e8400-e29b-41d4-a716-446655440002'),
('650e8400-e29b-41d4-a716-446655440004', 'Portal Profesores', 'Portal web para profesores', 'archived', '2023-06-01', '2023-11-30', 45000.00, '550e8400-e29b-41d4-a716-446655440002');

-- Insertar etiquetas
INSERT INTO tags (id, name, color) VALUES
('750e8400-e29b-41d4-a716-446655440001', 'Frontend', '#3B82F6'),
('750e8400-e29b-41d4-a716-446655440002', 'Backend', '#10B981'),
('750e8400-e29b-41d4-a716-446655440003', 'Database', '#F59E0B'),
('750e8400-e29b-41d4-a716-446655440004', 'Bug', '#EF4444'),
('750e8400-e29b-41d4-a716-446655440005', 'Feature', '#8B5CF6'),
('750e8400-e29b-41d4-a716-446655440006', 'Urgent', '#DC2626'),
('750e8400-e29b-41d4-a716-446655440007', 'Testing', '#6366F1');

-- Insertar tareas con fechas variadas para testing de rangos
INSERT INTO tasks (id, title, description, status, priority, project_id, assigned_to, created_by, due_date, completed_at, estimated_hours, actual_hours, created_at) VALUES
-- Tareas del proyecto E-Learning
('850e8400-e29b-41d4-a716-446655440001', 'Diseño de base de datos', 'Diseñar esquema de BD para usuarios y cursos', 'completed', 'high', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '2024-02-01', '2024-01-28', 16, 18, '2024-01-15'),
('850e8400-e29b-41d4-a716-446655440002', 'API de autenticación', 'Implementar sistema de login y registro', 'completed', 'high', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', '2024-02-15', '2024-02-12', 24, 26, '2024-01-20'),
('850e8400-e29b-41d4-a716-446655440003', 'Dashboard de estudiantes', 'Crear interfaz principal para estudiantes', 'in_progress', 'medium', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', '2024-03-15', NULL, 32, 20, '2024-02-01'),
('850e8400-e29b-41d4-a716-446655440004', 'Sistema de notificaciones', 'Push notifications y emails', 'pending', 'medium', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', '2024-04-01', NULL, 20, 0, '2024-02-15'),

-- Tareas del proyecto App Mobile
('850e8400-e29b-41d4-a716-446655440005', 'Setup React Native', 'Configuración inicial del proyecto móvil', 'completed', 'high', '650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '2024-03-15', '2024-03-10', 8, 10, '2024-03-01'),
('850e8400-e29b-41d4-a716-446655440006', 'Pantallas de navegación', 'Implementar navegación principal', 'in_progress', 'medium', '650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', '2024-04-30', NULL, 16, 8, '2024-03-10'),
('850e8400-e29b-41d4-a716-446655440007', 'Integración con API', 'Conectar app con backend', 'pending', 'urgent', '650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', '2024-05-15', NULL, 24, 0, '2024-03-20'),

-- Tareas del proyecto Evaluaciones (completado)
('850e8400-e29b-41d4-a716-446655440008', 'Motor de evaluaciones', 'Algoritmo de corrección automática', 'completed', 'urgent', '650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '2023-12-01', '2023-11-28', 40, 45, '2023-09-15'),
('850e8400-e29b-41d4-a716-446655440009', 'Reportes de resultados', 'Dashboard con estadísticas', 'completed', 'medium', '650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', '2024-01-15', '2024-01-10', 16, 18, '2023-10-01'),

-- Tareas adicionales para testing de queries complejas
('850e8400-e29b-41d4-a716-446655440010', 'Optimización de performance', 'Mejorar tiempos de respuesta', 'in_progress', 'high', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', '2024-06-01', NULL, 30, 15, '2024-03-25'),
('850e8400-e29b-41d4-a716-446655440011', 'Tests automatizados', 'Suite completa de testing', 'pending', 'low', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '2024-07-01', NULL, 25, 0, '2024-04-01'),
('850e8400-e29b-41d4-a716-446655440012', 'Documentación API', 'Swagger y guías de uso', 'cancelled', 'low', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', '2024-05-01', NULL, 12, 5, '2024-03-15');

-- Insertar relaciones task_tags
INSERT INTO task_tags (task_id, tag_id) VALUES
('850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440003'), -- Database
('850e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440002'), -- Backend
('850e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440001'), -- Frontend
('850e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440002'), -- Backend
('850e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440001'), -- Frontend
('850e8400-e29b-41d4-a716-446655440006', '750e8400-e29b-41d4-a716-446655440001'), -- Frontend
('850e8400-e29b-41d4-a716-446655440007', '750e8400-e29b-41d4-a716-446655440002'), -- Backend
('850e8400-e29b-41d4-a716-446655440007', '750e8400-e29b-41d4-a716-446655440006'), -- Urgent
('850e8400-e29b-41d4-a716-446655440008', '750e8400-e29b-41d4-a716-446655440002'), -- Backend
('850e8400-e29b-41d4-a716-446655440008', '750e8400-e29b-41d4-a716-446655440006'), -- Urgent
('850e8400-e29b-41d4-a716-446655440011', '750e8400-e29b-41d4-a716-446655440007'); -- Testing

-- Insertar comentarios
INSERT INTO task_comments (task_id, user_id, content) VALUES
('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Excelente trabajo en el diseño. Considerar índices adicionales.'),
('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'Gracias! He agregado los índices sugeridos.'),
('850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', 'Necesito revisar los wireframes antes de continuar.'),
('850e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440004', 'La API está lista para integración. Documentación en Swagger.');

-- Insertar time_entries para métricas de productividad
INSERT INTO time_entries (task_id, user_id, start_time, end_time, hours_logged, description) VALUES
('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '2024-01-15 09:00:00', '2024-01-15 17:00:00', 7.5, 'Diseño inicial del esquema'),
('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '2024-01-16 09:00:00', '2024-01-16 18:00:00', 8.0, 'Refinamiento y optimización'),
('850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', '2024-01-20 10:00:00', '2024-01-20 18:00:00', 7.0, 'Implementación de JWT'),
('850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', '2024-01-22 09:00:00', '2024-01-22 17:30:00', 8.0, 'Testing y validaciones'),
('850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', '2024-02-01 09:00:00', '2024-02-01 17:00:00', 8.0, 'Setup inicial React'),
('850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', '2024-02-05 14:00:00', '2024-02-05 18:00:00', 4.0, 'Componentes de dashboard');

-- Insertar notificaciones
INSERT INTO notifications (user_id, type, title, message, related_id) VALUES
('550e8400-e29b-41d4-a716-446655440003', 'task_assigned', 'Nueva tarea asignada', 'Se te ha asignado: Tests automatizados', '850e8400-e29b-41d4-a716-446655440011'),
('550e8400-e29b-41d4-a716-446655440004', 'task_overdue', 'Tarea vencida', 'La tarea "Integración con API" está vencida', '850e8400-e29b-41d4-a716-446655440007'),
('550e8400-e29b-41d4-a716-446655440002', 'task_completed', 'Tarea completada', 'Juan García completó: Setup React Native', '850e8400-e29b-41d4-a716-446655440005'),
('550e8400-e29b-41d4-a716-446655440005', 'comment_added', 'Nuevo comentario', 'Nuevo comentario en tu tarea', '850e8400-e29b-41d4-a716-446655440003');