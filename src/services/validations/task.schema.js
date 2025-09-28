import Joi from 'joi';
import { uuid, pagination, sortOrder, taskStatus, taskPriority, isoDate } from './common.schema.js';

export const createTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().allow('', null).optional(),
  project_id: uuid.allow(null).optional(),
  assigned_to: uuid.allow(null).optional(),
  priority: taskPriority.default('medium'),
  due_date: isoDate.allow(null).optional(),
  estimated_hours: Joi.number().integer().min(0).allow(null).optional(),
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200),
  description: Joi.string().allow('', null),
  status: taskStatus,
  priority: taskPriority,
  assigned_to: uuid,
  due_date: isoDate.allow(null),
  estimated_hours: Joi.number().integer().min(0).allow(null),
  actual_hours: Joi.number().integer().min(0).allow(null),
}).min(1);

export const getTasksQuerySchema = Joi.object({
  ...pagination,
  status: taskStatus.optional().default(null),
  priority: taskPriority.optional().default(null),
  assigned_to: uuid.optional().default(null),
  project_id: uuid.optional().default(null),
  sort_by: Joi.string()
    .valid('created_at', 'updated_at', 'due_date', 'priority', 'status')
    .default('created_at'),
  order: sortOrder,
});

export const idParamUuidSchema = Joi.string()
  .guid({ version: ['uuidv4', 'uuidv5', 'uuidv1'] })
  .required();
export const bodySchemaComment = Joi.object({
  content: Joi.string().trim().min(1),
});
