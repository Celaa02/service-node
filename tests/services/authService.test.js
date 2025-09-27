/* eslint-disable prettier/prettier */
import { jest } from '@jest/globals';

const loggerMock = { info: jest.fn() };
jest.unstable_mockModule('../../src/utils/logger.js', () => ({ default: loggerMock }));

const generateToken = jest.fn(() => 'jwt.token.mock');
jest.unstable_mockModule('../../src/middleware/auth.js', () => ({ generateToken }));

const bcryptMock = {
  hash: jest.fn(async (pwd) => `hash(${pwd})`),
  compare: jest.fn(async (plain, hash) => plain === 'valid' && hash === 'hash(valid)'),
};
jest.unstable_mockModule('bcryptjs', () => ({ default: bcryptMock, ...bcryptMock }));

const mockRepo = {
  existsByEmailOrUsername: jest.fn(),
  createUser: jest.fn(),
  findByEmail: jest.fn(),
  getProfileById: jest.fn(),
};
const UserRepositoryPg = jest.fn(() => mockRepo);
jest.unstable_mockModule('../../src/infrastructure/persistence/pg/UserRepositoryPg.js', () => ({
  UserRepositoryPg,
}));

const { registerUser, loginUser, getProfile } = await import('../../src/services/authService.js');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('lanza 400 si email/username ya existen', async () => {
      mockRepo.existsByEmailOrUsername.mockResolvedValueOnce(true);

      await expect(
        registerUser({
          username: 'u',
          email: 'U@Mail.com ',
          password: 'pwd',
          first_name: 'F',
          last_name: 'L',
        }),
      ).rejects.toMatchObject({ status: 400, message: 'Usuario o email ya existe' });

      expect(mockRepo.existsByEmailOrUsername).toHaveBeenCalledWith({
        emailLower: 'u@mail.com',
        username: 'u',
      });
      expect(bcryptMock.hash).not.toHaveBeenCalled();
      expect(mockRepo.createUser).not.toHaveBeenCalled();
    });

    it('crea usuario: lowercasing email, hashea password y genera token', async () => {
      mockRepo.existsByEmailOrUsername.mockResolvedValueOnce(false);
      const createdUser = {
        id: 'uid-1',
        username: 'u',
        email: 'u@mail.com',
        role: 'user',
      };
      mockRepo.createUser.mockResolvedValueOnce(createdUser);

      const out = await registerUser({
        username: 'u',
        email: 'U@Mail.com ',
        password: 'pwd',
        first_name: 'F',
        last_name: 'L',
      });

      expect(mockRepo.existsByEmailOrUsername).toHaveBeenCalledWith({
        emailLower: 'u@mail.com',
        username: 'u',
      });
      expect(bcryptMock.hash).toHaveBeenCalledWith('pwd', 8);
      expect(mockRepo.createUser).toHaveBeenCalledWith({
        username: 'u',
        emailLower: 'u@mail.com',
        passwordHash: 'hash(pwd)',
        firstName: 'F',
        lastName: 'L',
      });
      expect(generateToken).toHaveBeenCalledWith({
        id: 'uid-1',
        username: 'u',
        email: 'u@mail.com',
        role: 'user',
      });
      expect(out).toEqual({ user: createdUser, token: 'jwt.token.mock' });
      expect(loggerMock.info).toHaveBeenCalledWith('Nuevo usuario registrado: u');
    });
  });

  describe('loginUser', () => {
    it('401 si no existe usuario por email', async () => {
      mockRepo.findByEmail.mockResolvedValueOnce(null);

      await expect(loginUser({ email: 'X@Mail.com ', password: 'any' })).rejects.toMatchObject({
        status: 401,
        message: 'No existe usuario con ese email',
      });

      expect(mockRepo.findByEmail).toHaveBeenCalledWith('x@mail.com');
    });

    it('401 si cuenta desactivada', async () => {
      mockRepo.findByEmail.mockResolvedValueOnce({
        id: '1',
        username: 'u',
        email: 'x@mail.com',
        role: 'user',
        is_active: false,
        password_hash: 'hash(valid)',
      });

      await expect(loginUser({ email: 'x@mail.com', password: 'valid' })).rejects.toMatchObject({
        status: 401,
        message: 'Cuenta desactivada',
      });
    });

    it('401 si password inválido', async () => {
      mockRepo.findByEmail.mockResolvedValueOnce({
        id: '1',
        username: 'u',
        email: 'x@mail.com',
        role: 'user',
        is_active: true,
        password_hash: 'hash(valid)',
      });

      await expect(loginUser({ email: 'x@mail.com', password: 'wrong' })).rejects.toMatchObject({
        status: 401,
        message: 'Credenciales inválidas',
      });

      expect(bcryptMock.compare).toHaveBeenCalledWith('wrong', 'hash(valid)');
    });

    it('login OK: genera token y devuelve usuario público', async () => {
      mockRepo.findByEmail.mockResolvedValueOnce({
        id: '1',
        username: 'u',
        email: 'x@mail.com',
        role: 'admin',
        is_active: true,
        first_name: undefined,
        last_name: 'Doe',
        password_hash: 'hash(valid)',
      });

      const out = await loginUser({ email: 'X@mail.com', password: 'valid' });

      expect(mockRepo.findByEmail).toHaveBeenCalledWith('x@mail.com');
      expect(bcryptMock.compare).toHaveBeenCalledWith('valid', 'hash(valid)');
      expect(generateToken).toHaveBeenCalledWith({
        id: '1',
        username: 'u',
        email: 'x@mail.com',
        role: 'admin',
      });
      expect(out).toEqual({
        user: {
          id: '1',
          username: 'u',
          email: 'x@mail.com',
          role: 'admin',
          first_name: null,
          last_name: 'Doe',
        },
        token: 'jwt.token.mock',
      });
      expect(loggerMock.info).toHaveBeenCalledWith('Usuario u inició sesión');
    });
  });

  describe('getProfile', () => {
    it('404 si no existe', async () => {
      mockRepo.getProfileById.mockResolvedValueOnce(null);

      await expect(getProfile({ userId: 'u-404' })).rejects.toMatchObject({
        status: 404,
        message: 'Usuario no encontrado',
      });
    });

    it('retorna perfil formateado y hace log', async () => {
      const now = new Date().toISOString();
      mockRepo.getProfileById.mockResolvedValueOnce({
        id: '1',
        username: 'u',
        email: 'u@mail.com',
        role: 'user',
        first_name: 'F',
        last_name: undefined,
        is_active: true,
        email_verified: undefined,
        last_login: now,
        created_at: now,
      });

      const prof = await getProfile({ userId: '1' });

      expect(mockRepo.getProfileById).toHaveBeenCalledWith('1');
      expect(prof).toEqual({
        id: '1',
        username: 'u',
        email: 'u@mail.com',
        role: 'user',
        first_name: 'F',
        last_name: null,
        is_active: true,
        email_verified: false,
        last_login: now,
        created_at: now,
      });
      expect(loggerMock.info).toHaveBeenCalledWith('Perfil de usuario u');
    });
  });
});
