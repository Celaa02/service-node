import { jest } from '@jest/globals';

const loggerMock = { error: jest.fn() };
jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: loggerMock,
}));

const registerUser = jest.fn();
const loginUser = jest.fn();
const getProfile = jest.fn();

jest.unstable_mockModule('../../src/services/authService.js', () => ({
  registerUser,
  loginUser,
  getProfile,
}));

const { register, login, profile } = await import('../../src/controllers/authController.js');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Auth Controller (ESM)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('201 con user y token', async () => {
      const req = {
        body: {
          username: 'darlys',
          email: 'darlys@test.com',
          password: 'Secret123!',
          first_name: 'Darlys',
          last_name: 'Vergara',
        },
      };
      const res = mockRes();

      const fakeUser = { id: 'u1', email: 'darlys@test.com', username: 'darlys' };
      const fakeToken = 'header.payload.sig';
      registerUser.mockResolvedValue({ user: fakeUser, token: fakeToken });

      await register(req, res);

      expect(registerUser).toHaveBeenCalledWith({
        username: 'darlys',
        email: 'darlys@test.com',
        password: 'Secret123!',
        first_name: 'Darlys',
        last_name: 'Vergara',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Usuario registrado exitosamente',
        user: fakeUser,
        token: fakeToken,
      });
    });

    it('error con status (p.ej. 409)', async () => {
      const req = { body: { username: 'x', email: 'x@test.com', password: '123' } };
      const res = mockRes();
      const err = { status: 409, message: 'Email ya registrado' };
      registerUser.mockRejectedValue(err);

      await register(req, res);

      expect(loggerMock.error).toHaveBeenCalledWith('Error en register:', 'Email ya registrado');
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email ya registrado' });
    });

    it('error sin status -> 500 genérico', async () => {
      const req = { body: { username: 'x', email: 'x@test.com', password: '123' } };
      const res = mockRes();
      registerUser.mockRejectedValue(new Error('falló algo'));

      await register(req, res);

      expect(loggerMock.error).toHaveBeenCalledWith('Error en register:', 'falló algo');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });
  });

  describe('login', () => {
    it('200 con user y token', async () => {
      const req = { body: { email: 'd@test.com', password: 'Secret123!' } };
      const res = mockRes();
      const fakeUser = { id: 'u1', email: 'd@test.com' };
      loginUser.mockResolvedValue({ user: fakeUser, token: 'jwt.jwt.jwt' });

      await login(req, res);

      expect(loginUser).toHaveBeenCalledWith({ email: 'd@test.com', password: 'Secret123!' });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login exitoso',
        user: fakeUser,
        token: 'jwt.jwt.jwt',
      });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('credenciales inválidas -> 401', async () => {
      const req = { body: { email: 'no@existe.com', password: 'x' } };
      const res = mockRes();
      const err = { status: 401, message: 'Credenciales inválidas' };
      loginUser.mockRejectedValue(err);

      await login(req, res);

      expect(loggerMock.error).toHaveBeenCalledWith('Error en login:', 'Credenciales inválidas');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Credenciales inválidas' });
    });

    it('error inesperado -> 500 genérico', async () => {
      const req = { body: { email: 'd@test.com', password: 'Secret123!' } };
      const res = mockRes();
      loginUser.mockRejectedValue(new Error('boom'));

      await login(req, res);

      expect(loggerMock.error).toHaveBeenCalledWith('Error en login:', 'boom');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });
  });

  describe('profile', () => {
    it('200 con user cuando hay req.user.userId', async () => {
      const req = { user: { userId: 'u1' } };
      const res = mockRes();
      const fakeUser = { id: 'u1', email: 'd@test.com' };
      getProfile.mockResolvedValue(fakeUser);

      await profile(req, res);

      expect(getProfile).toHaveBeenCalledWith({ userId: 'u1' });
      expect(res.json).toHaveBeenCalledWith({ success: true, user: fakeUser });
    });

    it('400 si no hay userId', async () => {
      const req = { user: undefined };
      const res = mockRes();

      await profile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'ID de usuario requerido' });
      expect(getProfile).not.toHaveBeenCalled();
    });

    it('error con status (404) -> responde ese status y mensaje', async () => {
      const req = { user: { userId: 'u2' } };
      const res = mockRes();
      const err = { status: 404, message: 'Usuario no encontrado' };
      getProfile.mockRejectedValue(err);

      await profile(req, res);

      expect(loggerMock.error).toHaveBeenCalledWith(
        'Error obteniendo perfil:',
        'Usuario no encontrado',
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Usuario no encontrado' });
    });

    it('error inesperado -> 500 genérico', async () => {
      const req = { user: { userId: 'u3' } };
      const res = mockRes();
      getProfile.mockRejectedValue(new Error('db down'));

      await profile(req, res);

      expect(loggerMock.error).toHaveBeenCalledWith('Error obteniendo perfil:', 'db down');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });
  });
});
