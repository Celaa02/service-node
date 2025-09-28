import { jest } from '@jest/globals';

const query = jest.fn();
jest.unstable_mockModule('../../../../src/config/database.js', () => ({ query }));

jest.unstable_mockModule('../../../../src/domain/repositories/UserRepository.js', () => ({
  UserRepository: class {},
}));

const { UserRepositoryPg } = await import(
  '../../../../src/infrastructure/persistence/pg/UserRepositoryPg.js'
);

describe('UserRepositoryPg', () => {
  let repo;
  beforeEach(() => {
    jest.clearAllMocks();
    repo = new UserRepositoryPg();
  });

  describe('findByEmail', () => {
    it('devuelve la fila cuando existe', async () => {
      const row = {
        id: 'u1',
        username: 'sofia',
        email: 'sofia@test.com',
        password_hash: 'hash',
        role: 'user',
        first_name: 'Sofia',
        last_name: 'Gómez',
        is_active: true,
      };
      query.mockResolvedValueOnce({ rows: [row] });

      const out = await repo.findByEmail('sofia@test.com');

      expect(query).toHaveBeenCalledTimes(1);
      const [sql, params] = query.mock.calls[0];
      expect(sql).toMatch(/FROM users\s+WHERE LOWER\(email\) = \$1\s+LIMIT 1;/i);
      expect(params).toEqual(['sofia@test.com']);
      expect(out).toEqual(row);
    });

    it('devuelve null cuando no hay resultados', async () => {
      query.mockResolvedValueOnce({ rows: [] });
      const out = await repo.findByEmail('no@existe.com');
      expect(out).toBeNull();
    });
  });

  describe('existsByEmailOrUsername', () => {
    it('true cuando hay fila', async () => {
      query.mockResolvedValueOnce({ rows: [{}] });
      const ok = await repo.existsByEmailOrUsername({ emailLower: 'a@b.com', username: 'alice' });
      expect(query).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT 1 FROM users .* LIMIT 1;/i),
        ['a@b.com', 'alice'],
      );
      expect(ok).toBe(true);
    });

    it('false cuando no hay fila', async () => {
      query.mockResolvedValueOnce({ rows: [] });
      const ok = await repo.existsByEmailOrUsername({ emailLower: 'x@y.com', username: 'x' });
      expect(ok).toBe(false);
    });
  });

  describe('createUser', () => {
    it('inserta y devuelve la fila', async () => {
      const row = {
        id: 'u2',
        username: 'carlos',
        email: 'carlos@test.com',
        first_name: 'Carlos',
        last_name: 'López',
        role: 'user',
        created_at: '2025-09-28T10:00:00.000Z',
      };
      query.mockResolvedValueOnce({ rows: [row] });

      const out = await repo.createUser({
        username: 'carlos',
        emailLower: 'carlos@test.com',
        passwordHash: 'hash',
        firstName: 'Carlos',
        lastName: 'López',
      });

      expect(query).toHaveBeenCalledTimes(1);
      const [sql, params] = query.mock.calls[0];
      expect(sql).toMatch(
        /INSERT INTO users \(username, email, password_hash, first_name, last_name, role\)\s+VALUES \(\$1, \$2, \$3, \$4, \$5, \$6\)\s+RETURNING id, username, email, first_name, last_name, role, created_at;/i,
      );
      expect(params).toEqual(['carlos', 'carlos@test.com', 'hash', 'Carlos', 'López']);
      expect(out).toEqual(row);
    });
  });

  describe('getProfileById', () => {
    it('devuelve la fila cuando existe', async () => {
      const row = {
        id: 'u1',
        username: 'sofia',
        email: 'sofia@test.com',
        first_name: 'Sofia',
        last_name: 'Gómez',
        role: 'user',
        is_active: true,
        email_verified: true,
        last_login: null,
        created_at: '2025-01-01T00:00:00.000Z',
      };
      query.mockResolvedValueOnce({ rows: [row] });

      const out = await repo.getProfileById('u1');

      expect(query).toHaveBeenCalledWith(expect.stringMatching(/FROM users\s+WHERE id = \$1;/i), [
        'u1',
      ]);
      expect(out).toEqual(row);
    });

    it('devuelve null cuando no existe', async () => {
      query.mockResolvedValueOnce({ rows: [] });
      const out = await repo.getProfileById('u404');
      expect(out).toBeNull();
    });
  });

  describe('updateLastLogin', () => {
    it('ejecuta el UPDATE con now() y userId', async () => {
      query.mockResolvedValueOnce({ rowCount: 1 });
      await repo.updateLastLogin('u1');
      expect(query).toHaveBeenCalledWith('UPDATE users SET last_login = now() WHERE id = $1;', [
        'u1',
      ]);
    });
  });

  describe('searchUsersRepo', () => {
    it('con q + is_active + role, pagina 2 (limit=5), sort=-created_at -> ORDER BY u.created_at DESC', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: 7 }] });
      const items = [
        { id: 'u1', username: 'sofia', email: 'sofia@test.com', role: 'admin', is_active: true },
        { id: 'u2', username: 'sara', email: 'sara@test.com', role: 'admin', is_active: true },
      ];
      query.mockResolvedValueOnce({ rows: items });

      const out = await repo.searchUsersRepo({
        q: 'so',
        role: 'admin',
        is_active: true,
        page: 2,
        limit: 5,
        sort: '-created_at',
      });

      const [countSql, countParams] = query.mock.calls[0];
      expect(countSql).toMatch(
        /SELECT COUNT\(\*\)::int AS total FROM users u\s+WHERE\s+\(LOWER\(u\.username\) LIKE \$1 OR LOWER\(u\.email\) LIKE \$1 OR LOWER\(u\.first_name\) LIKE \$1 OR LOWER\(u\.last_name\) LIKE \$1\)\s+AND u\.is_active = \$2\s+AND u\.role = \$3;?/i,
      );
      expect(countParams).toEqual(['%so%', true, 'admin']);

      const [dataSql, dataParams] = query.mock.calls[1];
      expect(dataSql).toMatch(/FROM users u\s+WHERE/i);
      expect(dataSql).toMatch(/ORDER BY u\.created_at DESC/i);
      expect(dataSql).toMatch(/LIMIT \$4 OFFSET \$5/i);
      expect(dataParams).toEqual(['%so%', true, 'admin', 5, 5]);

      expect(out).toEqual({ items, total: 7 });
    });

    it('sin filtros: sin WHERE, sort por defecto username ASC, LIMIT $1 OFFSET $2', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: 0 }] }).mockResolvedValueOnce({ rows: [] });

      const out = await repo.searchUsersRepo({ page: 1, limit: 10, sort: 'not-allowed' });

      // count
      const [countSql, countParams] = query.mock.calls[0];
      expect(countSql).toMatch(/^SELECT COUNT\(\*\)::int AS total FROM users u\s*;?$/i);
      expect(countParams).toEqual([]);

      // data
      const [dataSql, dataParams] = query.mock.calls[1];
      expect(dataSql).toMatch(/ORDER BY u\.username ASC/i);
      expect(dataSql).toMatch(/LIMIT \$1 OFFSET \$2/i);
      expect(dataParams).toEqual([10, 0]);
      expect(out).toEqual({ items: [], total: 0 });
    });
  });
});
