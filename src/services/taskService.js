import { TaskRepositoryPg } from '../infrastructure/persistence/pg/TaskRepositoryPg.js';
import logger from '../utils/logger.js';

const repo = new TaskRepositoryPg();

export const createTaskService = async (payload) => {
  try {
    const {
      title,
      description,
      project_id,
      assigned_to,
      created_by,
      priority,
      due_date,
      estimated_hours,
    } = payload || {};

    const task = await repo.create({
      title,
      description,
      project_id,
      assigned_to: assigned_to || created_by,
      created_by,
      priority,
      due_date,
      estimated_hours,
    });

    return task;
  } catch (error) {
    logger.error('Error en service createTaskService:', error.message);
    throw error;
  }
};

export const getTasksService = async (query) => {
  try {
    const { page, limit, offset, status, priority, assigned_to, project_id, sort_by, order } =
      query;

    const { total, items } = await repo.list({
      limit,
      offset,
      status,
      priority,
      assigned_to,
      project_id,
      sort_by,
      order,
    });

    return { total, items, page, limit };
  } catch (error) {
    logger.error('Error en service getTasksService:', error.message);
    throw error;
  }
};

export const getTaskByIdService = async ({ id }) => {
  try {
    const task = await repo.getById(id);
    return task;
  } catch (error) {
    logger.error('Error en service getTaskByIdService:', error.message);
    throw error;
  }
};

export const updateTaskService = async ({ id, patch }) => {
  try {
    const updated = await repo.update(id, patch);
    return updated;
  } catch (error) {
    logger.error('Error en service updateTaskService:', error.message);
    throw error;
  }
};

export const deleteTaskService = async ({ id }) => {
  try {
    const deleted = await repo.remove(id);
    return !!deleted;
  } catch (error) {
    logger.error('Error en service deleteTaskService:', error.message);
    throw error;
  }
};

export const addCommentService = async ({ task_id, user_id, content }) => {
  try {
    const comment = await repo.addComment(task_id, user_id, String(content).trim());
    return comment;
  } catch (error) {
    logger.error('Error en service addCommentService:', error.message);
    throw error;
  }
};
