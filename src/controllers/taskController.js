import {
  addCommentService,
  createTaskService,
  deleteTaskService,
  getTaskByIdService,
  getTasksService,
  updateTaskService,
} from '../services/taskService.js';
import logger from '../utils/logger.js';
import {
  idParamUuidSchema,
  updateTaskSchema,
  bodySchemaComment,
} from '../services/validations/task.schema.js';

export const createTask = async (req, res) => {
  try {
    const created_by = req.user?.userId;
    console.log('🚀 ~ createTask ~ created_by:', created_by);
    if (!created_by) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    const task = await createTaskService({ ...req.body, created_by });
    logger.info(`Nueva tarea creada: ${task?.title ?? task?.id}`);

    return res.status(201).json({ success: true, message: 'Tarea creada exitosamente', task });
  } catch (err) {
    logger.error('createTask:', err.message);
    return res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : 'Error interno del servidor' });
  }
};

export const getTasks = async (req, res) => {
  try {
    const { page, limit, status, priority, assigned_to, project_id, sort_by, order } = req.query;
    const offset = (page - 1) * limit;
    const result = await getTasksService({
      page: page,
      limit: limit,
      offset: offset,
      status: status,
      priority: priority,
      assigned_to: assigned_to,
      project_id: project_id,
      sort_by: sort_by ?? 'created_at',
      order: (order ?? 'DESC').toUpperCase(),
    });

    return res.json({
      success: true,
      tasks: result.items,
      pagination: { page: Number(page ?? 1), limit: Number(limit ?? 10), total: result.total },
    });
  } catch (err) {
    logger.error('getTasks:', err.message);
    return res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : 'Error interno del servidor' });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const { error } = idParamUuidSchema.validate(req.params.id);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'El id proporcionado no es un UUID válido',
        details: error.details.map((d) => d.message),
      });
    }
    const task = await getTaskByIdService({ id: req.params.id });
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
    return res.json({ success: true, task });
  } catch (err) {
    logger.error('getTaskById:', err.message);
    return res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : 'Error interno del servidor' });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { error: idError } = idParamUuidSchema.validate(req.params.id);
    if (idError) {
      return res.status(400).json({
        success: false,
        error: 'El id proporcionado no es un UUID válido',
        details: idError.details.map((d) => d.message),
      });
    }

    const { error: bodyError } = updateTaskSchema.validate(req.body);
    if (bodyError) {
      return res.status(400).json({
        success: false,
        error: 'El body no cumple el esquema de actualización',
        details: bodyError.details.map((d) => d.message),
      });
    }

    const task = await updateTaskService({ id: req.params.id, patch: req.body });
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
    logger.info(`Tarea actualizada: ${task.title ?? task.id}`);
    return res.json({ success: true, message: 'Tarea actualizada exitosamente', task });
  } catch (err) {
    logger.error('updateTask:', err.message);
    return res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : 'Error interno del servidor' });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { error } = idParamUuidSchema.validate(req.params.id);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'El id proporcionado no es un UUID válido',
        details: error.details.map((d) => d.message),
      });
    }
    const ok = await deleteTaskService({ id: req.params.id });
    if (!ok) return res.status(404).json({ error: 'Tarea no encontrada' });
    logger.info(`Tarea eliminada: ${req.params.id}`);
    return res.json({ success: true, message: 'Tarea eliminada exitosamente' });
  } catch (err) {
    logger.error('deleteTask:', err.message);
    return res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : 'Error interno del servidor' });
  }
};

export const addComment = async (req, res) => {
  try {
    const { error: idError } = idParamUuidSchema.validate(req.params.id);
    if (idError) {
      return res.status(400).json({
        success: false,
        error: 'El id proporcionado no es un UUID válido',
        details: idError.details.map((d) => d.message),
      });
    }

    const { error: bodyError } = bodySchemaComment.validate(req.body);
    if (bodyError) {
      return res.status(400).json({
        success: false,
        error: 'El body no cumple el esquema de actualización',
        details: bodyError.details.map((d) => d.message),
      });
    }

    const comment = await addCommentService({
      task_id: req.params.id,
      user_id: req.user?.userId,
      content: req.body?.content,
    });
    return res.json({ success: true, message: 'Comentario agregado exitosamente', comment });
  } catch (err) {
    logger.error('addComment:', err.message);
    return res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : 'Error interno del servidor' });
  }
};
