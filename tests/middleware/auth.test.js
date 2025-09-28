import { jest } from '@jest/globals';

const jwtMock = {
  verify: jest.fn(),
  sign: jest.fn(() => 'mock.jwt.token'),
};
jest.unstable_mockModule('jsonwebtoken', () => ({ default: jwtMock, ...jwtMock }));

const { authenticateToken, authorizeRoles, generateToken } = await import(
  '../../src/middleware/auth.js'
);

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = jest.fn();

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('401 si no hay token', async () => {
      const req = { headers: {} };
      const res = mockRes();

      await authenticateToken(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token de acceso requerido' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('pasa y agrega req.user si token válido', async () => {
      const req = { headers: { authorization: 'Bearer good.token' } };
      const res = mockRes();
      const decoded = { userId: 'u1' };
      jwtMock.verify.mockReturnValue(decoded);

      await authenticateToken(req, res, mockNext);

      expect(jwtMock.verify).toHaveBeenCalledWith('good.token', expect.any(String));
      expect(req.user).toEqual(decoded);
      expect(mockNext).toHaveBeenCalled();
    });

    it('401 si token expirado', async () => {
      const req = { headers: { authorization: 'Bearer expired.token' } };
      const res = mockRes();
      const error = new Error('expired');
      error.name = 'TokenExpiredError';
      error.expiredAt = new Date('2030-01-01');
      jwtMock.verify.mockImplementation(() => {
        throw error;
      });

      await authenticateToken(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token expirado',
        expiredAt: error.expiredAt,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('403 si token inválido distinto a expirado', async () => {
      const req = { headers: { authorization: 'Bearer bad.token' } };
      const res = mockRes();
      jwtMock.verify.mockImplementation(() => {
        throw new Error('bad signature');
      });

      await authenticateToken(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token inválido',
        details: 'bad signature',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authorizeRoles', () => {
    it('403 si el rol no está permitido', () => {
      const req = { user: { role: 'user' } };
      const res = mockRes();
      const next = jest.fn();
      const middleware = authorizeRoles('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No tienes permisos para realizar esta acción',
        requiredRoles: ['admin'],
        userRole: 'user',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('llama next si el rol está permitido', () => {
      const req = { user: { role: 'admin' } };
      const res = mockRes();
      const next = jest.fn();
      const middleware = authorizeRoles('admin', 'manager');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('generateToken', () => {
    it('firma un token con payload correcto', () => {
      const user = { id: 'u1', username: 'test', role: 'admin', email: 'a@mail.com' };

      const token = generateToken(user);

      expect(jwtMock.sign).toHaveBeenCalledWith(
        {
          userId: 'u1',
          username: 'test',
          role: 'admin',
          email: 'a@mail.com',
        },
        expect.any(String),
        { expiresIn: '30d' },
      );
      expect(token).toBe('mock.jwt.token');
    });
  });
});
