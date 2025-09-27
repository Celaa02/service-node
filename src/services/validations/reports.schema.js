import Joi from 'joi';
import { uuid, isoDate } from './common.schema.js';

export const rankingQuery = Joi.object({
  start_date: isoDate.allow(null),
  end_date: isoDate.allow(null),
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0),
});

export const timelineQuery = Joi.object({
  project_id: uuid.allow(null),
  start_date: isoDate.allow(null),
  end_date: isoDate.allow(null),
});

export const workloadQuery = Joi.object({
  scope: Joi.string().valid('user', 'project').default('user'),
  status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled').allow(null),
});
