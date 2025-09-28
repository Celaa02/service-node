import Joi from 'joi';

function buildSchema(schemaLike, presence) {
  if (!schemaLike) return null;
  const schema = Joi.isSchema(schemaLike) ? schemaLike : Joi.object(schemaLike);
  return schema.options({ presence });
}

export function validate({ body, query, params } = {}, options = {}) {
  const base = { abortEarly: false, stripUnknown: true, convert: true };
  const opts = { ...base, ...options };

  return (req, res, next) => {
    try {
      if (body) {
        const s = buildSchema(body, 'required');
        req.body = s.validate(req.body, opts).value;
      }
      if (query) {
        const s = buildSchema(query, 'optional');
        req.query = s.validate(req.query, opts).value;
      }
      if (params) {
        const s = buildSchema(params, 'required');
        req.params = s.validate(req.params, opts).value;
      }
      next();
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Validación falló',
        details: err?.details?.map((d) => ({ message: d.message, path: d.path })) ?? [],
      });
    }
  };
}
