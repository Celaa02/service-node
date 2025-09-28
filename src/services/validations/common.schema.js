import Joi from 'joi';

export const uuid = Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1'] });

export const pagination = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
};

export const sortOrder = Joi.string().valid('ASC', 'DESC').insensitive().default('DESC');
export const taskStatus = Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled');
export const taskPriority = Joi.string().valid('low', 'medium', 'high', 'urgent');
export const isoDate = Joi.date().iso();
