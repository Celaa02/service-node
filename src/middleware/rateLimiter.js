// eslint-disable-next-line import/no-named-as-default
import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    error: 'Demasiadas peticiones, intenta más tarde',
    limit: 1000,
    windowMs: 15 * 60 * 1000,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Demasiados intentos de login, intenta más tarde',
  },
  skipSuccessfulRequests: false,
});
