import { jest } from '@jest/globals';

const query = jest.fn();
jest.unstable_mockModule('../../../../src/config/database.js', () => ({
  query,
}));

const { NotificationRepositoryPg } = await import(
  '../../../../src/infrastructure/persistence/pg/NotificationRepositoryPg.js'
);

describe('NotificationRepositoryPg', () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new NotificationRepositoryPg();
  });

  describe('listByUser', () => {
    it('retorna items y total (sin only_unread)', async () => {
      const userId = 'u-1';
      const page = 2;
      const limit = 5;
      const offset = (page - 1) * limit;

      // 1ra query: datos
      query.mockResolvedValueOnce({
        rows: [
          {
            id: 'n1',
            type: 'TASK_ASSIGNED',
            title: 'Tarea A',
            message: 'Te asignaron una tarea',
            related_id: 't1',
            is_read: false,
            created_at: '2025-09-28T10:00:00.000Z',
          },
        ],
      });
      // 2da query: total
      query.mockResolvedValueOnce({ rows: [{ total: 17 }] });

      const out = await repo.listByUser({ userId, page, limit, only_unread: false });

      expect(query).toHaveBeenCalledTimes(2);

      // Query 1
      expect(query.mock.calls[0][0]).toMatch(/FROM notifications WHERE user_id = \$1/i);
      expect(query.mock.calls[0][0]).not.toMatch(/is_read\s*=\s*false/i);
      expect(query.mock.calls[0][1]).toEqual([userId, limit, offset]);

      // Query 2 (count)
      expect(query.mock.calls[1][0]).toMatch(
        /SELECT COUNT\(\*\)::int AS total FROM notifications WHERE user_id = \$1/i,
      );
      expect(query.mock.calls[1][1]).toEqual([userId]);

      expect(out).toEqual({
        items: expect.any(Array),
        total: 17,
      });
      expect(out.items[0].id).toBe('n1');
    });

    it('incluye filtro is_read = false cuando only_unread = true', async () => {
      const userId = 'u-2';
      const page = 1;
      const limit = 10;

      query.mockResolvedValueOnce({ rows: [] });
      query.mockResolvedValueOnce({ rows: [{ total: 0 }] });

      await repo.listByUser({ userId, page, limit, only_unread: true });

      expect(query).toHaveBeenCalledTimes(2);
      expect(query.mock.calls[0][0]).toMatch(
        /FROM notifications WHERE user_id = \$1 AND is_read = false/i,
      );
      expect(query.mock.calls[1][0]).toMatch(
        /SELECT COUNT\(\*\)::int AS total FROM notifications WHERE user_id = \$1 AND is_read = false/i,
      );
    });
  });

  describe('markRead', () => {
    it('retorna true si actualiza alguna fila', async () => {
      query.mockResolvedValueOnce({ rowCount: 1 });
      const ok = await repo.markRead({ userId: 'u1', id: 'n1' });

      expect(query).toHaveBeenCalledWith(
        expect.stringMatching(
          /UPDATE notifications SET is_read = true WHERE id = \$1 AND user_id = \$2/i,
        ),
        ['n1', 'u1'],
      );
      expect(ok).toBe(true);
    });

    it('retorna false si no actualiza filas', async () => {
      query.mockResolvedValueOnce({ rowCount: 0 });
      const ok = await repo.markRead({ userId: 'u1', id: 'n999' });
      expect(ok).toBe(false);
    });
  });

  describe('markReadMany', () => {
    it('all=true: actualiza todas las no leídas del usuario', async () => {
      query.mockResolvedValueOnce({ rowCount: 7 });

      const count = await repo.markReadMany({ userId: 'u1', all: true });
      expect(query).toHaveBeenCalledWith(
        expect.stringMatching(
          /UPDATE notifications SET is_read = true WHERE user_id = \$1 AND is_read = false/i,
        ),
        ['u1'],
      );
      expect(count).toBe(7);
    });

    it('ids: usa ANY($2::uuid[])', async () => {
      query.mockResolvedValueOnce({ rowCount: 3 });
      const ids = ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'];

      const count = await repo.markReadMany({ userId: 'u1', ids, all: false });
      expect(query).toHaveBeenCalledWith(
        expect.stringMatching(
          /UPDATE notifications SET is_read = true WHERE user_id = \$1 AND id = ANY\(\$2::uuid\[\]\)/i,
        ),
        ['u1', ids],
      );
      expect(count).toBe(3);
    });
  });

  describe('create', () => {
    it('inserta la notificación y devuelve la fila', async () => {
      const inserted = {
        id: 'n1',
        user_id: 'u1',
        type: 'TASK_ASSIGNED',
        title: 'Hola',
        message: 'M1',
        related_id: 't1',
        is_read: false,
        created_at: '2025-09-28T10:00:00.000Z',
      };
      query.mockResolvedValueOnce({ rows: [inserted] });

      const out = await repo.create({
        userId: 'u1',
        type: 'TASK_ASSIGNED',
        title: 'Hola',
        message: 'M1',
        related_id: 't1',
        is_read: true,
      });

      expect(query).toHaveBeenCalledWith(expect.stringMatching(/INSERT INTO notifications/i), [
        'u1',
        'TASK_ASSIGNED',
        'Hola',
        'M1',
        't1',
        true,
      ]);
      expect(out).toEqual(inserted);
    });

    it('cuando is_read es undefined, pasa el valor por defecto del método (actualmente `{}`)', async () => {
      const inserted = { id: 'n2' };
      query.mockResolvedValueOnce({ rows: [inserted] });

      await repo.create({
        userId: 'u1',
        type: 'TASK_ASSIGNED',
        title: 'Hola',
        message: 'M1',
        related_id: 't1',
      });

      expect(query.mock.calls[0][1][5]).toEqual({});
    });
  });

  describe('getPreferences', () => {
    it('devuelve prefs cuando existe fila', async () => {
      const row = {
        user_id: 'u1',
        email_enabled: true,
        push_enabled: true,
        inapp_enabled: true,
        per_type: {},
        updated_at: '2025-09-28T10:00:00.000Z',
      };
      query.mockResolvedValueOnce({ rows: [row] });

      const out = await repo.getPreferences({ userId: 'u1' });
      expect(query).toHaveBeenCalledWith(
        expect.stringMatching(/FROM notification_preferences WHERE user_id=\$1/i),
        ['u1'],
      );
      expect(out).toEqual(row);
    });

    it('retorna null si no hay fila', async () => {
      query.mockResolvedValueOnce({ rows: [] });
      const out = await repo.getPreferences({ userId: 'u-x' });
      expect(out).toBeNull();
    });
  });

  describe('upsertPreferences', () => {
    it('inserta/actualiza con defaults cuando prefs está vacío', async () => {
      const row = {
        user_id: 'u1',
        email_enabled: true,
        push_enabled: true,
        inapp_enabled: true,
        per_type: {},
      };
      query.mockResolvedValueOnce({ rows: [row] });

      const out = await repo.upsertPreferences({ userId: 'u1', prefs: {} });
      expect(query).toHaveBeenCalledWith(
        expect.stringMatching(/INSERT INTO notification_preferences .* ON CONFLICT .* DO UPDATE/is),
        ['u1', true, true, true, {}],
      );
      expect(out).toEqual(row);
    });

    it('respeta los valores provistos', async () => {
      const row = {
        user_id: 'u1',
        email_enabled: false,
        push_enabled: false,
        inapp_enabled: true,
        per_type: { TASK_ASSIGNED: false },
      };
      query.mockResolvedValueOnce({ rows: [row] });

      const prefs = {
        email_enabled: false,
        push_enabled: false,
        inapp_enabled: true,
        per_type: { TASK_ASSIGNED: false },
      };
      const out = await repo.upsertPreferences({ userId: 'u1', prefs });

      expect(query.mock.calls[0][1]).toEqual(['u1', false, false, true, { TASK_ASSIGNED: false }]);
      expect(out).toEqual(row);
    });
  });

  describe('upsertTemplate', () => {
    it('upsert por (type, locale) y devuelve la fila', async () => {
      const row = {
        id: 'tmpl1',
        type: 'TASK_ASSIGNED',
        locale: 'es',
        subject: 'S',
        html: '<b>H</b>',
      };
      query.mockResolvedValueOnce({ rows: [row] });

      const out = await repo.upsertTemplate({
        type: 'TASK_ASSIGNED',
        locale: 'es',
        subject: 'S',
        html: '<b>H</b>',
      });

      expect(query).toHaveBeenCalledWith(
        expect.stringMatching(
          /INSERT INTO notification_templates .* ON CONFLICT \(type, locale\) DO UPDATE/is,
        ),
        ['TASK_ASSIGNED', 'es', 'S', '<b>H</b>'],
      );
      expect(out).toEqual(row);
    });
  });

  describe('getTemplate', () => {
    it('devuelve template o null', async () => {
      const row = { id: 'tmpl1', type: 'TASK_ASSIGNED', locale: 'es' };
      query.mockResolvedValueOnce({ rows: [row] }).mockResolvedValueOnce({ rows: [] });

      const hit = await repo.getTemplate({ type: 'TASK_ASSIGNED', locale: 'es' });
      const miss = await repo.getTemplate({ type: 'TASK_ASSIGNED', locale: 'pt' });

      expect(query.mock.calls[0][0]).toMatch(
        /FROM notification_templates WHERE type=\$1 AND locale=\$2/i,
      );
      expect(query.mock.calls[0][1]).toEqual(['TASK_ASSIGNED', 'es']);
      expect(hit).toEqual(row);

      expect(query.mock.calls[1][1]).toEqual(['TASK_ASSIGNED', 'pt']);
      expect(miss).toBeNull();
    });
  });
});
