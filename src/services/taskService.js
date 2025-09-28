import { TaskRepositoryPg } from '../infrastructure/persistence/pg/TaskRepositoryPg.js';
import logger from '../utils/logger.js';
import { notifyUser } from '../services/notificationService.js';
import { io } from '../server.js';
import { sendMail } from '../utils/mailer.js';

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

    await notifyUser({
      userId: assigned_to,
      type: 'task_assigned',
      title,
      message: 'Preparar informe',
      related_id: created_by,
      is_read: false,
      io,
      sendMail,
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
    await notifyUser({
      userId: updated.assigned_to,
      type: 'task_completed',
      title: updated.title,
      message: updated.description,
      related_id: updated.created_by,
      is_read: false,
      io,
      sendMail,
    });
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

    await notifyUser({
      userId: user_id,
      type: 'comment_added',
      title: 'comment task',
      message: comment.content,
      related_id: task_id,
      is_read: false,
      io,
      sendMail,
    });

    return comment;
  } catch (error) {
    logger.error('Error en service addCommentService:', error.message);
    throw error;
  }
};
