import Joi from 'joi';

export const registerBody = Joi.object({
  username: Joi.string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/)
    .messages({
      'string.pattern.base': 'username solo permite letras, números y _',
    }),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string()
    .min(8)
    .max(72)
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/[a-z]/, 'lowercase')
    .pattern(/[0-9]/, 'number')
    .pattern(/[^A-Za-z0-9]/, 'symbol')
    .required(),
  firstName: Joi.string().trim().max(80).allow(null, ''),
  lastName: Joi.string().trim().max(80).allow(null, ''),
});

export const loginBody = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(1).required(),
});

export const getProfileParams = Joi.object({
  userId: Joi.alternatives()
    .try(Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }), Joi.number().integer().positive())
    .required(),
});

export const usersSearchQuerySchema = Joi.object({
  q: Joi.string().trim().min(1).max(100).optional(),
  role: Joi.string().trim().max(50).optional(),
  is_active: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string()
    .trim()
    .valid('username', '-username', 'email', '-email', 'created_at', '-created_at', 'role', '-role')
    .default('username'),
});
