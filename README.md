# Backend – README

⚙️ Services - Core API

---

## 🚀 Stack & características

- **Node 20**, **Express**, **ESM**
- **PostgreSQL 16** + **Redis 7**
- Autenticación **JWT (Bearer)**
- **Swagger UI** con OpenAPI (`/api/docs`)
- **Tests** con Jest + Supertest
- **Lint/Format**: ESLint + Prettier
- **Docker Compose** para entorno dev
- **SQL init**: extensiones, esquema, seeds e índices automáticos
- **pg_stat_statements** para medir rendimiento de consultas

---

## 📁 Estructura (resumen)

```
src/
  config/          # database.js, env
  controllers/     # authController, taskController, reportController, ...
  infrastructure/
    persistence/
      pg/          # repositorios Postgres (UserRepositoryPg, TaskRepositoryPg, ...)
  middleware/      # auth.js, errorHandler.js
  routes/          # rutas Express
  services/        # lógica de dominio (authService, taskService, reportService, ...)
  utils/           # logger.js
  server.js        # bootstrap Express (Swagger incluido)

database/
  00_extensions.sql
  01_schema.sql
  02_seed.sql              # opcional
  03_indexes.sql

docker-compose.yml
Dockerfile
openapi.yaml                # documentación de la API
```

---

## ⚙️ Variables de entorno

Crea un `.env` (o usa variables del shell). **No subas secretos al repo**.

```env
# API
NODE_ENV=development
PORT=3000
JWT_SECRET=super_largo_y_aleatorio_de_32+caracteres

# DB (Docker)
DB_HOST=db
DB_PORT=5432
DB_NAME=plurall_test
DB_USER=appuser
DB_PASSWORD=appsecret

```

> En local (sin Docker), cambia `DB_HOST=localhost`.

---

## 🐳 Levantar con Docker (desarrollo)

1. **Primera vez** (para correr migraciones/seeds automáticamente):

```bash
docker compose down -v
docker compose up -d db
# espera a que db esté healthy
docker compose up -d api
```

2. Ver estado y logs:

```bash
docker compose ps -a
docker compose logs -f db
docker compose logs -f api
```

3. Verifica API:

```bash
curl -i http://localhost:3000/
```

---

## 🗃️ Migraciones / Init de BD

Los `.sql` en `database/` se ejecutan automáticamente **solo** cuando el volumen está vacío.

- `00_extensions.sql`: `pg_stat_statements`, `pg_trgm`, etc.
- `01_schema.sql`: tablas (`users`, `projects`, `tasks`, `task_comments`, `notifications`, …).
- `02_seed.sql`: datos de ejemplo (opcional).
- `03_indexes.sql`: índices y optimizaciones (ver sección Performance).

**Re-aplicar sin borrar volumen**:

```bash
cat database/00_extensions.sql | docker compose exec -T db psql -U appuser -d plurall_test -v ON_ERROR_STOP=1 -f -
cat database/01_schema.sql     | docker compose exec -T db psql -U appuser -d plurall_test -v ON_ERROR_STOP=1 -f -
cat database/02_seed.sql       | docker compose exec -T db psql -U appuser -d plurall_test -v ON_ERROR_STOP=1 -f -   # si aplica
cat database/03_indexes.sql    | docker compose exec -T db psql -U appuser -d plurall_test -v ON_ERROR_STOP=1 -f -
docker compose exec -T db psql -U appuser -d plurall_test -c "VACUUM (ANALYZE);"
```

**Comandos útiles**:

```bash
# Extensiones instaladas
docker compose exec -T db psql -U appuser -d plurall_test -c "\dx"

# Tablas
docker compose exec -T db psql -U appuser -d plurall_test -c "\dt"

# Índices
docker compose exec -T db psql -U appuser -d plurall_test -c "
SELECT indexname, tablename FROM pg_indexes
WHERE schemaname='public' AND tablename IN ('users','tasks','notifications')
ORDER BY 2,1;"
```

---

## 📚 Documentación (Swagger)

- **Swagger UI**: `http://localhost:3000/api/docs`
- Archivo fuente: `openapi.yaml` (incluye **auth**, **reports**, **notification**, **project**, **tasks**).

---

## 🔐 Autenticación

- Regístrate / inicia sesión para obtener **token JWT**.
- En endpoints protegidos incluir:

```
Authorization: Bearer <TOKEN>
```

**Ejemplos**:

```bash
# register
curl -s -X POST http://localhost:3000/api/auth/register   -H 'Content-Type: application/json'   -d '{"username":"demo","email":"demo@example.com","password":"Secret123!","first_name":"Demo","last_name":"User"}'

# login
curl -s -X POST http://localhost:3000/api/auth/login   -H 'Content-Type: application/json'   -d '{"email":"demo@example.com","password":"Secret123!"}'

# profile
curl -s http://localhost:3000/api/auth/profile   -H "Authorization: Bearer <TOKEN>"
```

---

## 🔎 Endpoints

**Auth**
| Method | Path | Description |
| ------ | -------------------- | ---------------------------------------------------- |
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user (JWT) |
| GET | `/api/auth/profile` | Get current profile |
| GET | `/api/users/search`. | Search users (q, role, is_active, page, limit, sort) |

**Task**
| Method | Path | Description |
| ------ | ------------------------------ | ---------------------------------- |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks` | List tasks (filters + pagination) |
| GET | `/api/tasks/{id}` | Get task by ID (includes comments) |
| PATCH | `/api/tasks/{id}` | Update task (partial) |
| DELETE | `/api/tasks/{id}` | Delete task |
| POST | `/api/tasks/{id}/comments` | Add comment to task |

**Projects**
| Method | Path | Description |
| ------ | ------------------------------------ | ------------------------------- |
| GET | `/api/projects/{id}/stats` | Dasboard reports |
| GET | `/api/reports/productivity` | Productivity report by user |
| GET | `/api/reports/projects` | Project report |
| GET | `/api/reports/user-ranking` | User ranking |
| GET | `/api/reports/project-timeline` | Project timeline |
| GET | `/api/reports/workload-distribution` | Workload distribution |
| POST | `/api/reports/export-data` | export data |
| POST | `/api/reports/import-tasks` | import data |

**Reports**
| Method | Path | Description |
| ------ | --------------------------- | -------------------------------------- |
| GET | `/api/reports/user-ranking` | User ranking (start, end, page, limit) |

**Notifications**
| Method | Path | Description |
| ------ | ----------------------------------- | --------------------------------------------- |
| GET | `/api/notifications` | List notifications (page, limit, only_unread) |
| PATCH | `/api/notifications/{id}/read` | Mark one notification as read |
| POST | `/api/notifications/read` | Mark many or all as read (`ids[]`/`all`) |
| GET | `/api/notifications/preferences/me` | Get notification preferences |
| PUT | `/api/notifications/preferences/me` | Upsert notification preferences |
PUT | `/api/notifications/template` | Create customs template for notifications |

**Docs**
| Method | Path | Description |
| ------ | --------------- | ------------------- |
| GET | `/api/docs` | Swagger UI |
| GET | `/openapi.yaml` | OpenAPI spec (YAML) |

---

## 📄 Paginación

Convención `page`/`limit` (por defecto `page=1`, `limit=20`). Respuesta típica:

```json
{
  "success": true,
  "total": 42,
  "total_pages": 3,
  "page": 1,
  "limit": 20,
  "items": [ ... ]
}
```

---

## 🧪 Tests

```bash
npm test
# con cobertura
npm run test
```

- Tests unitarios para **repositorios** (mockeando `query`).
- Controladores y servicios con **mocks** de dependencias.
- Validamos que las **consultas SQL** generadas (strings) cumplan el patrón esperado.

---

## 🧰 Scripts npm

```bash
npm run dev        # nodemon
npm run start      # node src/server.js
npm run lint       # eslint .
npm run lint:fix
npm run format     # prettier --write .
npm run format:check
npm run test
```

> En Docker el build usa `--ignore-scripts` para evitar `husky` en instalaciones.

---

## 📈 Performance & SQL

### Índices creados (extracto)

**tasks**

```sql
CREATE INDEX IF NOT EXISTS idx_tasks_status         ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority       ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to    ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id     ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at     ON tasks(created_at);
-- Opcional cursor:
-- CREATE INDEX IF NOT EXISTS idx_tasks_created_id ON tasks(created_at, id);
```

**users**

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_role       ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active  ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_username_trgm ON users USING gin (LOWER(username) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_email_trgm    ON users USING gin (LOWER(email) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_fname_trgm    ON users USING gin (LOWER(first_name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_lname_trgm    ON users USING gin (LOWER(last_name) gin_trgm_ops);
```

**notifications**

```sql
CREATE INDEX IF NOT EXISTS idx_notif_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_user_unread  ON notifications(user_id, is_read, created_at DESC);
```

### Cambios en consultas (highlights)

- **Listado de tareas**: split en **2 consultas** (COUNT simple + DATA con JOINs y paginación) → menor costo y mejor uso de índices.
- **Top contributors**: `JOIN users u ON u.id = t.assigned_to` y filtro por `project_id` + `status='done'`.
- **User ranking**: paginado, `ROUND(...::numeric,2)` para evitar `round(double precision, int)`.

### Medición con `pg_stat_statements`

`docker-compose.yml` habilita:

```
shared_preload_libraries=pg_stat_statements
pg_stat_statements.track=all
```

Consultas útiles:

```sql
-- top por tiempo total
SELECT
  round((total_plan_time + total_exec_time)::numeric,2) AS total_ms,
  calls,
  round(mean_exec_time::numeric,2) AS mean_exec_ms,
  query
FROM pg_stat_statements
ORDER BY (total_plan_time + total_exec_time) DESC
LIMIT 10;

-- resetear
SELECT pg_stat_statements_reset();

-- plan puntual
EXPLAIN (ANALYZE, BUFFERS) <tu_query>;
```

---

## 🧱 Troubleshooting

- **401 “Token de acceso requerido”** → Falta `Authorization: Bearer <TOKEN>`.
- **Violación FK al crear tarea** → `created_by/assigned_to/project_id` no existen en la DB actual. Usa token emitido en este entorno o agrega seeds.
- **Swagger “Could not resolve reference”** → Falta `#/components/schemas/ErrorResponse` o path mal escrito (`projects` vs `project`).
- **`round(double precision, integer) does not exist`** → castea a `numeric` antes de `ROUND(..., 2)`.
- **Build Docker falla con `npm ci`** → sincroniza `package-lock.json` con `package.json` (`npm install` local y commitea el lock).

---

## 🔒 Seguridad

- Nunca subas llaves reales a `.env`, `.env.example` o commits.
- GitHub Push Protection puede bloquear pushes con posibles secretos. Usa **placeholders**.

---

## ✅ Checklist

- [ ] `.env` creado
- [ ] Docker levantado (`db` healthy → `api`)
- [ ] `openapi.yaml` válido y Swagger accesible
- [ ] Registro/Login y `profile` OK
- [ ] `/api/users/search` y `/api/projects/{id}/stats` operativos
- [ ] `/api/reports/user-ranking` paginado y sin errores de `ROUND`
- [ ] Tests verdes: `npm test`

---

## 🚀 CI/CD with GitHub Actions

This project uses **GitHub Actions** to automate:

- **CI (Continuous Integration)**:
  - Install dependencies
  - Run unit tests
  - Validate coverage

- **CD (Continuous Deployment)**:
  - Automatic deployment to DEV.

### Main workflows:

- `.github/workflows/ci-develop.yml` → runs on PRs into `develop`

---

## 🤖 IA y Live Coding — Reporte de Uso de IA

> **Resumen:** El diseño funcional, las decisiones arquitectónicas y la validación de calidad fueron **lideradas por el desarrollador** (definición de endpoints, contratos, flujos de autenticación, paginación, mapeo de errores y criterios de performance). **La IA (ChatGPT · GPT-5 Thinking)** se utilizó como **acelerador** para generar borradores, alternativas de solución y documentación; todas las propuestas fueron **revisadas, ajustadas y validadas** manualmente con pruebas, logs y mediciones en Postgres.

### 🧰 Herramientas específicas

- **ChatGPT**: _GPT-5 Thinking_ (asistente de apoyo).
- **Entorno**: Node.js 20, Jest, Docker Compose, PostgreSQL 16.
- _(No se utilizaron en esta entrega)_ Claude, Copilot.

### 🪟 Ventana de contexto utilizada (estimado)

- Prompts/respuestas con **1–3k tokens** en iteraciones de diagnóstico (Docker, SQL, tests).
- Historial largo y encadenado por tema (Docker → API → SQL → Tests → Docs).
- **Nota**: sin reporte exacto de tokens; se documentan estimaciones razonables.

### 🔢 Consumo estimado de tokens (aprox.)

| Área                                    | Interacciones | Tokens aprox. |
| --------------------------------------- | ------------- | ------------- |
| Docker & entorno (builds, npm, runtime) | 10–16         | 10k–16k       |
| SQL & performance (EXPLAIN, índices)    | 10–14         | 10k–16k       |
| API & OpenAPI/Swagger                   | 6–10          | 6k–10k        |
| Tests (Jest, repos, controladores)      | 9–12          | 7k–12k        |
| README & Docs                           | 3–6           | 3k–6k         |
| **Total estimado**                      | **38–58**     | **36k–60k**   |

> _Las cifras son aproximadas; el foco estuvo en minimizar iteraciones mediante prompts con evidencia (logs, SQL real)._

### 🔀 Distribución del código (estimado)

- **Código humano**: **~65%**
  - Definición de **requisitos** y **contratos** (endpoints, validaciones y respuestas).
  - Diseño de **estrategias de paginación** y **mapeo de errores** (p.ej., FK → 400 con mensaje claro).
  - Ajuste fino de **consultas SQL** al esquema real y revisión de planes/estadísticas.
  - Integración con **Docker**, variables de entorno, y diagnóstico de fallos runtime.
  - Revisión, endurecimiento y alineación de **tests** con el código real.
- **Código asistido por IA**: **~35%**
  - Borradores de controladores/servicios/repos para endpoints nuevos.
  - Plantillas de tests (mocks de `query`, patrones de expect).
  - Propuestas de optimización (separar COUNT/DATA, índices, casting/rounding).
  - Redacción inicial de documentación (README, tablas de endpoints, bloques YAML).

**Justificación de distribución:** se priorizó que la **lógica de dominio, decisiones técnicas y validación** queden en manos del desarrollador. La IA se usó para **acelerar** el andamiaje y la documentación, evitando trabajo mecánico y concentrando el tiempo en el análisis y la calidad.

### 🧪 Delegación de tareas

- **Delegado a IA**: borradores (controller/service/repo), esqueletos de tests y documentación; sugerencias de índices y estrategias de SQL/paginación.
- **Manual (desarrollador)**: integración real, validación con `curl`/logs/psql, fijado de errores (`ERR_MODULE_NOT_FOUND`, `res.status`, npm/husky/lockfile), alineación con esquema real, tuning de consultas y verificación con `pg_stat_statements` y `EXPLAIN (ANALYZE)`.

### 🧭 Metodología de trabajo asistido

- **Estrategia de prompting**
  - _Context-first_: siempre incluir logs completos y SQL real.
  - _Iterativo y acotado_: cambios incrementales y verificables.
  - _Evidence-driven_: cada iteración parte de un error o medición concreta.
- **Estructura conversacional**
  - Hilos por tema (Docker, API, SQL, Tests, Docs) con ciclos _proponer → ejecutar → medir → corregir_.
- **Técnicas de refinamiento**
  - _Few-shot_ ligero con ejemplos de tests existentes.
  - Salidas **constriñidas** (solo bloque/diff) para reducir ruido.
  - Ajustes hasta pasar tests y métricas.

### 💬 Prompts clave (ejemplos)

- “Corrige `npm ci EUSAGE` con multi-stage y lockfile sync en Dockerfile; evita husky en build.”
- “`TypeError: res.status is not a function` en `errorHandler`; ajusta middleware a 4 args.”
- “Agrega `GET /api/users/search` y `GET /api/projects/{id}/stats` con repos, servicios, validaciones y rutas.”
- “Optimiza listados separando COUNT simple y DATA con JOINs; sugiere índices y valida con `pg_stat_statements`.”
- “`round(double precision, int)` falla; castea a numeric y ajusta `user-ranking` con paginación.”
- “Actualiza tests para repos (Task/User/Project/Notification) asegurando patrón SQL y resultados.”

### 🧩 Decisiones técnicas influenciadas por IA

- **Docker**: multi-stage, `npm ci --ignore-scripts`, mejor caché y builds reproducibles.
- **Express**: manejo de errores consistente (middleware 4 args) y respuestas `{ error, details }`.
- **SQL/Índices**: COUNT vs DATA, índices por filtros de uso real (`project_id,status`, `assigned_to,created_at`, `pg_trgm` para búsqueda).
- **Observabilidad**: habilitar `pg_stat_statements` en compose y consultas de análisis incluidas en README.
- **OpenAPI/Docs**: esquemas de error reutilizables y ejemplos realistas por endpoint.

### 🎯 Criterios del challenge (cómo se cumplieron)

- **Optimización del uso de IA**: prompts con evidencia → menos iteraciones y respuestas más precisas.
- **Conocimiento de limitaciones**: verificación estricta contra el esquema y ejecución real.
- **Productividad**: aceleración de documentación/tests, sin sacrificar calidad.
- **Criterio técnico**: revisión de planes/métricas, endurecimiento de tests y manejo de errores de negocio.

### ⚡ Bonus

- _Few-shot prompting_ para tests.
- Documentación generada y normalizada con ejemplos.
- Optimización de SQL asistida por IA y validada con `pg_stat_statements` + `EXPLAIN (ANALYZE)`.
