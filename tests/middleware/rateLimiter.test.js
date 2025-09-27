import request from 'supertest';
import express from 'express';

import { rateLimiter, authLimiter } from '../../src/middleware/rateLimiter.js';

describe('Rate Limiters', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.get('/test-rate', rateLimiter, (req, res) => res.json({ ok: true }));
    app.post('/login', authLimiter, (req, res) => res.json({ ok: true }));
  });

  describe('rateLimiter (max 1000)', () => {
    it('permite peticiones dentro del límite', async () => {
      const res = await request(app).get('/test-rate');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });

    it('bloquea después de exceder el límite', async () => {
      for (let i = 0; i < 1001; i++) {
        await request(app).get('/test-rate');
      }
      const res = await request(app).get('/test-rate');
      expect(res.status).toBe(429);
      expect(res.body).toMatchObject({
        error: 'Demasiadas peticiones, intenta más tarde',
        limit: 1000,
      });
    });
  });

  describe('authLimiter (max 10)', () => {
    it('permite peticiones dentro del límite', async () => {
      const res = await request(app).post('/login');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });

    // it('bloquea después de exceder el límite', async () => {
    //   for (let i = 0; i < 11; i++) {
    //     await request(app).post('/login');
    //   }
    //   const res = await request(app).post('/login');
    //   expect(res.status).toBe(429);
    //   expect(res.body).toMatchObject({
    //     error: 'Demasiados intentos de login, intenta más tarde',
    //   });
    // });
  });
});
