import express from 'express';
import { register, login, profile } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../services/validations/auth.schema.js';

const router = express.Router();

router.post('/register', validate({ body: registerSchema }), register);
router.post('/login', validate({ body: loginSchema }), authLimiter, login);
router.get('/profile', authenticateToken, profile);

export default router;
