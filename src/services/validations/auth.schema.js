import Joi from 'joi';

export const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).trim().required(),
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().min(6).max(128).required(),
  first_name: Joi.string().trim().allow(null, ''),
  last_name: Joi.string().trim().allow(null, ''),
  role: Joi.string().trim().optional().default('user'),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().min(6).max(128).required(),
});
