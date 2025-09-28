import bcrypt from 'bcryptjs';
import { UserRepositoryPg } from '../infrastructure/persistence/pg/UserRepositoryPg.js';
import { generateToken } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const userRepo = new UserRepositoryPg();

export const registerUser = async ({ username, email, password, first_name, last_name, role }) => {
  const emailLower = email.trim().toLowerCase();
  const exists = await userRepo.existsByEmailOrUsername({ emailLower, username });
  if (exists) {
    const e = new Error('Usuario o email ya existe');
    e.status = 400;
    throw e;
  }
  const passwordHash = await bcrypt.hash(password, 8);
  const user = await userRepo.createUser({
    username,
    emailLower,
    passwordHash,
    firstName: first_name ?? null,
    lastName: last_name ?? null,
    role: role ?? 'user',
  });
  const token = generateToken({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  });
  logger.info(`Nuevo usuario registrado: ${username}`);
  return { user, token };
};

export const loginUser = async ({ email, password }) => {
  const emailLower = email.trim().toLowerCase();

  const user = await userRepo.findByEmail(emailLower);
  if (!user) {
    const e = new Error('No existe usuario con ese email');
    e.status = 401;
    throw e;
  }

  if (!user.is_active) {
    const e = new Error('Cuenta desactivada');
    e.status = 401;
    throw e;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    const e = new Error('Credenciales inválidas');
    e.status = 401;
    throw e;
  }

  const token = generateToken({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  });
  logger.info(`Usuario ${user.username} inició sesión`);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      first_name: user.first_name ?? null,
      last_name: user.last_name ?? null,
    },
    token,
  };
};

export const getProfile = async ({ userId }) => {
  const user = await userRepo.getProfileById(userId);
  if (!user) {
    const e = new Error('Usuario no encontrado');
    e.status = 404;
    throw e;
  }
  logger.info(`Perfil de usuario ${user.username}`);

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    first_name: user.first_name ?? null,
    last_name: user.last_name ?? null,
    is_active: user.is_active,
    email_verified: user.email_verified ?? false,
    last_login: user.last_login,
    created_at: user.created_at,
  };
};

export const searchUsersService = async (params) => {
  const { items, total } = await userRepo.searchUsersRepo(params);
  const page = Number(params.page ?? 1);
  const limit = Number(params.limit ?? 20);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    data: items,
    meta: { page, limit, total, totalPages },
  };
};
