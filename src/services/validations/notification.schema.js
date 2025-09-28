import Joi from 'joi';

export const listQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  only_unread: Joi.boolean().default(false),
});

export const markReadParams = Joi.object({
  id: Joi.string().uuid().required(),
});

export const markManyBody = Joi.object({
  ids: Joi.array().items(Joi.string().uuid()).min(1),
  all: Joi.boolean().default(false),
}).xor('ids', 'all');

export const prefsBody = Joi.object({
  email_enabled: Joi.boolean(),
  push_enabled: Joi.boolean(),
  inapp_enabled: Joi.boolean(),
  per_type: Joi.object().pattern(
    Joi.string(),
    Joi.object({ email: Joi.boolean(), inapp: Joi.boolean(), push: Joi.boolean() }),
  ),
});

export const templateBody = Joi.object({
  type: Joi.string().required(),
  locale: Joi.string().default('es'),
  subject: Joi.string().required(),
  html: Joi.string().required(),
});
