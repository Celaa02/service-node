import { jest } from '@jest/globals';
import Joi from 'joi';

const { validate } = await import('../../src/middleware/validate.js');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const makeReq = (body = {}, query = {}, params = {}) => ({ body, query, params });
const nextSpy = () => jest.fn();

describe('validate middleware (Joi)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('body: presence=required, convierte y quita unknowns por defecto', () => {
    const mw = validate({
      body: {
        age: Joi.number().integer(),
        name: Joi.string(),
      },
    });

    const req = makeReq({ age: '5', name: 'Ana', extra: 'x' });
    const res = makeRes();
    const next = nextSpy();

    mw(req, res, next);

    // convert:true => "5" -> 5
    expect(req.body).toEqual({ age: 5, name: 'Ana' });
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  test('query: presence=optional, permite ausencia; convierte y quita unknowns', () => {
    const mw = validate({
      query: {
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1),
      },
    });

    const req = makeReq({}, { page: '2', limit: '10', junk: 'z' });
    const res = makeRes();
    const next = nextSpy();

    mw(req, res, next);

    expect(req.query).toEqual({ page: 2, limit: 10 });
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  test('params: presence=required, convierte y quita unknowns; sigue llamando next aunque falten campos', () => {
    const mw = validate({
      params: {
        id: Joi.string().uuid({ version: 'uuidv4' }),
      },
    });

    const req = makeReq({}, {}, /* params */ {});
    const res = makeRes();
    const next = nextSpy();

    mw(req, res, next);

    expect(req.params).toEqual({});
    expect(res.status).not.toHaveBeenCalled(); // no 400
    expect(next).toHaveBeenCalled();
  });

  test('usa Joi schema directo (no solo objeto) y respeta opciones: convert:false', () => {
    const bodySchema = Joi.object({
      active: Joi.boolean(),
    });

    const mw = validate({ body: bodySchema }, { convert: false });

    const req = makeReq({ active: 'true' });
    const res = makeRes();
    const next = nextSpy();

    mw(req, res, next);

    expect(req.body).toEqual({ active: 'true' });
    expect(next).toHaveBeenCalled();
  });

  test('respeta opciones: stripUnknown:false (conserva campos extra)', () => {
    const mw = validate(
      {
        body: {
          title: Joi.string(),
        },
      },
      { stripUnknown: false },
    );

    const req = makeReq({ title: 'Tarea', extra: 'keep-me' });
    const res = makeRes();
    const next = nextSpy();

    mw(req, res, next);

    expect(req.body).toEqual({ title: 'Tarea', extra: 'keep-me' });
    expect(next).toHaveBeenCalled();
  });
});
