# Prueba Técnica Backend Node.js + PostgreSQL - Plurall

## 📋 Instrucciones Generales

**Tiempo límite:** Máximo 48 horas después de recibir este repositorio.

**Entrega:** Enviar código fuente en un repositorio de GitHub (fork o nuevo repo) o zip adjunto al correo de respuesta.

**IA y Live Coding:** Valoramos altamente el uso eficiente de herramientas de IA en el desarrollo. Si utilizas herramientas de IA (ChatGPT, Claude, GitHub Copilot, etc.), **incluye obligatoriamente en la entrega:**

### 📋 Reporte de Uso de IA
- **Ventana de contexto utilizada:** Cantidad de tokens/caracteres enviados por prompt
- **Consumo de tokens:** Estimación del total de tokens utilizados durante el desarrollo
- **Herramientas específicas:** Modelo y versión (ej: GPT-4, Claude 3.5, Copilot)
- **Distribución del código:**
  - % de código generado por IA vs. código humano
  - Justificación de por qué se distribuyó de esa manera
  - Qué partes se delegaron a la IA y cuáles se codificaron manualmente
- **Metodología de trabajo asistido:**
  - Estrategia de prompting utilizada
  - Cómo se estructuraron las conversaciones con la IA
  - Técnicas de refinamiento y iteración empleadas
- **Prompts clave utilizados:** Ejemplos de los prompts más efectivos
- **Decisiones técnicas:** Documentación de elecciones arquitectónicas influenciadas por la IA

### 🎯 Lo que buscamos evaluar:
- **Optimización del uso de IA:** Capacidad para obtener resultados de alta calidad minimizando iteraciones
- **Conocimiento de limitaciones:** Identificación de cuándo la IA es útil vs. cuándo es mejor el enfoque manual
- **Integración inteligente:** Cómo combinas efectivamente el código generado por IA con tu experiencia técnica
- **Productividad:** Capacidad para acelerar el desarrollo manteniendo la calidad del código
- **Criterio técnico:** Habilidad para revisar, validar y mejorar el código generado por IA

### ⚡ Bonus por uso avanzado:
- Uso de técnicas avanzadas de prompting (chain-of-thought, few-shot learning, etc.)
- Automatización de tareas repetitivas usando IA
- Generación eficiente de tests y documentación
- Optimización de queries SQL asistida por IA con validación manual

## 🚀 Configuración del Proyecto

### Prerrequisitos
- Node.js 18+
- PostgreSQL 13+
- Git

### Instalación
```bash
# Clonar/descomprimir el proyecto
cd backend-plurall-test

# Instalar dependencias
npm install

# Configurar base de datos PostgreSQL
createdb plurall_test

# Ejecutar schema y datos de prueba
psql -d plurall_test -f database/schema.sql
psql -d plurall_test -f database/seed.sql

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL

# Crear directorios necesarios
mkdir uploads logs

# Iniciar servidor de desarrollo
npm run dev
```

El servidor debe estar disponible en `http://localhost:3000`

## 📊 Descripción del Proyecto

API REST para gestión de proyectos y tareas con PostgreSQL. El proyecto base **tiene problemas de performance, seguridad y funcionalidades incompletas** que debes identificar y corregir.

### Funcionalidades Principales:
1. **Autenticación JWT** - Registro, login, perfiles
2. **Gestión de tareas** - CRUD con asignaciones y comentarios
3. **Gestión de proyectos** - Organización y métricas
4. **Reportes y analytics** - Estadísticas y productividad
5. **Importación CSV** - Carga masiva de datos

## 🎯 Requerimientos de la Prueba

### 🔴 **Performance y SQL**

1. **Optimizar consultas lentas:**
   - Identificar y corregir N+1 queries
   - Implementar paginación eficiente con conteo total
   - Agregar índices estratégicos para consultas frecuentes
   - Optimizar JOINs entre tablas relacionadas

2. **Implementar consultas SQL avanzadas:**
   - Reportes con agregaciones complejas (GROUP BY, COUNT, SUM, AVG)
   - Rankings de usuarios usando WINDOW FUNCTIONS
   - Análisis temporal con DATE_TRUNC y agrupaciones por período
   - Búsqueda de texto eficiente en tareas

### 🟡 **IMPORTANTE - Funcionalidades Faltantes**

3. **Completar endpoints de reportes:**
   - `GET /api/reports/user-ranking` - Top usuarios por productividad
   - `GET /api/reports/project-timeline` - Timeline de proyectos con hitos
   - `GET /api/reports/workload-distribution` - Distribución de carga de trabajo
   - `POST /api/reports/export-data` - Exportar datos a CSV/Excel

4. **Implementar funcionalidades de seguridad:**
   - Sistema de roles y permisos granulares
   - Rate limiting por usuario y endpoint
   - Validación robusta de entrada con esquemas
   - Logs de auditoría para acciones críticas

5. **Agregar módulo de notificaciones:**
   - Sistema de notificaciones en tiempo real
   - Templates de email para eventos importantes
   - Configuración de preferencias por usuario
   - API para marcar notificaciones como leídas

6. **Arquitectura y escalabilidad:**
   - Implementar transacciones para operaciones críticas
   - Cache con Redis para consultas frecuentes
   - Documentación de API con Swagger/OpenAPI
   - Docker setup para desarrollo

## 📋 Criterios de Evaluación

### **Performance SQL (40 puntos)**
- Queries optimizadas sin N+1 problems
- Índices apropiados para consultas frecuentes
- Uso correcto de agregaciones y JOINs
- Paginación eficiente implementada

### **Funcionalidades Completas (30 puntos)**
- Todos los endpoints funcionando correctamente
- Validaciones robustas en todas las entradas
- Sistema de roles y permisos implementado
- Importación/exportación de datos funcional

### **Código Quality (20 puntos)**
- Arquitectura limpia y mantenible
- Tests con coverage adecuado
- Manejo de errores robusto
- Documentación clara

### **Innovación Técnica (10 puntos)**
- Características adicionales no solicitadas
- Uso creativo de tecnologías
- Consideraciones de escalabilidad
- Best practices implementadas

## 🔧 Endpoints Requeridos

### Existentes (corregir bugs y optimizar):
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Autenticación
- `GET /api/auth/profile` - Perfil del usuario
- `GET /api/tasks` - Listar tareas con filtros
- `POST /api/tasks` - Crear nueva tarea
- `PUT /api/tasks/:id` - Actualizar tarea
- `DELETE /api/tasks/:id` - Eliminar tarea
- `POST /api/tasks/:id/comments` - Agregar comentario
- `GET /api/reports/dashboard` - Estadísticas generales
- `POST /api/reports/import-tasks` - Importar desde CSV

### Nuevos (implementar desde cero):
- `GET /api/reports/user-ranking` - Ranking de productividad
- `GET /api/reports/project-timeline` - Timeline de proyectos
- `GET /api/reports/workload-distribution` - Distribución de trabajo
- `POST /api/reports/export-data` - Exportar datos
- `GET /api/notifications` - Obtener notificaciones
- `PUT /api/notifications/:id/read` - Marcar como leída
- `GET /api/users/search` - Búsqueda de usuarios
- `GET /api/projects/:id/stats` - Estadísticas de proyecto

## 📊 Datos de Prueba

La base de datos incluye:
- **7 usuarios** con diferentes roles (admin, manager, user)
- **4 proyectos** en varios estados
- **12 tareas** distribuidas entre proyectos y usuarios
- **Comentarios, time entries y notificaciones** para testing

Credenciales de prueba:
- Admin: `admin@plurall.com` / `password`
- Manager: `juan.garcia@plurall.com` / `password`
- User: `maria.rodriguez@plurall.com` / `password`

## ✅ Checklist de Entrega

**Funcionalidad Básica:**
- [ ] Proyecto ejecuta sin errores (`npm run dev`)
- [ ] Todos los endpoints existentes funcionan correctamente
- [ ] Base de datos se conecta y consultas básicas funcionan
- [ ] Autenticación JWT funcional

**Performance y SQL:**
- [ ] Queries optimizadas documentadas con EXPLAIN ANALYZE
- [ ] Índices agregados con justificación
- [ ] Paginación implementada en listados
- [ ] Reportes con agregaciones complejas

**Nuevas Funcionalidades:**
- [ ] Al menos 4 endpoints nuevos implementados
- [ ] Sistema de notificaciones funcional
- [ ] Exportación de datos a CSV
- [ ] Validaciones robustas con manejo de errores

**Entrega:**
- [ ] Repositorio público en GitHub O archivo ZIP

## 🚀 Comandos Útiles

```bash
# Desarrollo
npm run dev          # Servidor con hot reload
npm start            # Servidor de producción
npm run lint         # Verificar código
npm run format       # Formatear código


# Base de datos
psql -d plurall_test -c "EXPLAIN ANALYZE SELECT ..."
psql -d plurall_test -f your-migration.sql
```

## 📝 Notas Importantes

- **El proyecto debe funcionar completamente** - Todos los endpoints deben responder correctamente
- **Performance es clave** - Documenta las optimizaciones SQL realizadas
- **Agrega valor** - Implementa funcionalidades adicionales que demuestren tu nivel
- **Documenta decisiones** - Explica por qué elegiste ciertas tecnologías o approaches

**¡Éxito en tu prueba técnica!** 🚀