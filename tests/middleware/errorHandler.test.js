import { jest } from '@jest/globals';

const loggerMock = { error: jest.fn() };
jest.unstable_mockModule('../../src/utils/logger.js', () => ({ default: loggerMock }));

const { errorHandler } = await import('../../src/middleware/errorHandler.js');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('errorHandler middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('default: responde 500 con datos básicos y loggea el error', () => {
    const err = new Error('boom');
    err.stack = 'stack-trace';
    const req = { path: '/api/x', method: 'GET' };
    const res = mockRes();

    errorHandler(err, req, res);

    expect(loggerMock.error).toHaveBeenCalledWith('Error: boom');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'boom',
      stack: err.stack,
      timestamp: expect.any(String),
      path: '/api/x',
      method: 'GET',
    });
  });

  it("CastError: sobreescribe mensaje a 'Recurso no encontrado'", () => {
    const err = { name: 'CastError', message: 'invalid cast', stack: 's' };
    const req = { path: '/r/1', method: 'GET' };
    const res = mockRes();

    errorHandler(err, req, res);

    expect(loggerMock.error).toHaveBeenCalledWith('Error: invalid cast');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Recurso no encontrado',
      stack: 's',
      timestamp: expect.any(String),
      path: '/r/1',
      method: 'GET',
    });
  });

  it("code 11000 (duplicado): mensaje 'Recurso duplicado'", () => {
    const err = {
      code: 11000,
      keyValue: { email: 'a@mail.com' },
      message: 'dup key',
      stack: 's2',
    };
    const req = { path: '/users', method: 'POST' };
    const res = mockRes();

    errorHandler(err, req, res);

    expect(loggerMock.error).toHaveBeenCalledWith('Error: dup key');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Recurso duplicado',
      stack: 's2',
      timestamp: expect.any(String),
      path: '/users',
      method: 'POST',
    });
  });

  it('ValidationError: concatena mensajes de err.errors', () => {
    const err = {
      name: 'ValidationError',
      message: 'ValidationError',
      errors: {
        field1: { message: 'f1' },
        field2: { message: 'f2' },
      },
      stack: 'sv',
    };
    const req = { path: '/things', method: 'PUT' };
    const res = mockRes();

    errorHandler(err, req, res);

    expect(loggerMock.error).toHaveBeenCalledWith('Error: ValidationError');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'f1, f2',
      stack: 'sv',
      timestamp: expect.any(String),
      path: '/things',
      method: 'PUT',
    });
  });
});
