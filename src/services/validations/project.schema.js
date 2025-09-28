import Joi from 'joi';

export const projectIdParamsSchema = Joi.object({
  id: Joi.string().guid({ version: 'uuidv4' }).required(),
});
