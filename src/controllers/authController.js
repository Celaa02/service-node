import {
  registerUser,
  loginUser,
  getProfile,
  searchUsersService,
} from '../services/authService.js';
import logger from '../utils/logger.js';
import { usersSearchQuerySchema } from '../services/validations/user.schema.js';

export const register = async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, role } = req.body;
    const { user, token } = await registerUser({
      username,
      email,
      password,
      first_name,
      last_name,
      role,
    });
    return res
      .status(201)
      .json({ success: true, message: 'Usuario registrado exitosamente', user, token });
  } catch (err) {
    logger.error('Error en register:', err.message);
    return res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : 'Error interno del servidor' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await loginUser({ email, password });
    return res.json({ success: true, message: 'Login exitoso', user, token });
  } catch (err) {
    logger.error('Error en login:', err.message);
    return res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : 'Error interno del servidor' });
  }
};

export const profile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ error: 'ID de usuario requerido' });
    }
    const user = await getProfile({ userId });
    return res.json({ success: true, user });
  } catch (err) {
    logger.error('Error obteniendo perfil:', err.message);
    return res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : 'Error interno del servidor' });
  }
};

export const searchUsers = async (req, res, next) => {
  try {
    const { error } = usersSearchQuerySchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Campos invalidos',
        details: error.details.map((d) => d.message),
      });
    }
    const result = await searchUsersService(req.query);
    return res.json(result);
  } catch (err) {
    logger.error('searchUsers error:', err.message);
    next(err);
  }
};
