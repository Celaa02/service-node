/* eslint-disable prettier/prettier */
import { jest } from '@jest/globals';

const loggerMock = { error: jest.fn() };
jest.unstable_mockModule('../../src/utils/logger.js', () => ({ default: loggerMock }));

const repoMock = {
  listByUser: jest.fn(),
  markRead: jest.fn(),
  markReadMany: jest.fn(),
  upsertPreferences: jest.fn(),
  getPreferences: jest.fn(),
  upsertTemplate: jest.fn(),
  getTemplate: jest.fn(),
  create: jest.fn(),
};
const NotificationRepositoryPg = jest.fn(() => repoMock);
jest.unstable_mockModule(
  '../../src/infrastructure/persistence/pg/NotificationRepositoryPg.js',
  () => ({
    NotificationRepositoryPg,
  }),
);

const userRepoMock = {
  getProfileById: jest.fn(),
};
const UserRepositoryPg = jest.fn(() => userRepoMock);
jest.unstable_mockModule('../../src/infrastructure/persistence/pg/UserRepositoryPg.js', () => ({
  UserRepositoryPg,
}));

const {
  listNotifications,
  markNotificationRead,
  markManyRead,
  upsertPreferences,
  getPreferences,
  upsertTemplate,
  getTemplate,
  notifyUser,
  renderTemplate,
} = await import('../../src/services/notificationService.js');

const resetAll = () => {
  jest.clearAllMocks();
  for (const k of Object.keys(repoMock)) repoMock[k].mockReset();
  for (const k of Object.keys(userRepoMock)) userRepoMock[k].mockReset();
};

describe('notificationService', () => {
  beforeEach(resetAll);

  describe('listNotifications', () => {
    it('pasa userId y defaults (page=1, limit=10, only_unread=false)', async () => {
      repoMock.listByUser.mockResolvedValue({ items: [{ id: 'n1' }], total: 3 });

      const out = await listNotifications({ userId: 'u1' });

      expect(repoMock.listByUser).toHaveBeenCalledWith({
        userId: 'u1',
        page: 1,
        limit: 10,
        only_unread: false,
      });
      expect(out).toEqual({ items: [{ id: 'n1' }], total: 3 });
    });

    it('propaga error y loggea', async () => {
      repoMock.listByUser.mockRejectedValue(new Error('db'));
      await expect(listNotifications({ userId: 'u1' })).rejects.toThrow('db');
      expect(loggerMock.error).toHaveBeenCalledWith('listNotifications:', 'db');
    });
  });

  describe('markNotificationRead', () => {
    it('llama repo.markRead', async () => {
      repoMock.markRead.mockResolvedValue(true);
      const ok = await markNotificationRead({ userId: 'u1', id: 'n1' });
      expect(repoMock.markRead).toHaveBeenCalledWith({ userId: 'u1', id: 'n1' });
      expect(ok).toBe(true);
    });

    it('propaga error y loggea', async () => {
      repoMock.markRead.mockRejectedValue(new Error('boom'));
      await expect(markNotificationRead({ userId: 'u1', id: 'n1' })).rejects.toThrow('boom');
      expect(loggerMock.error).toHaveBeenCalledWith('markNotificationRead:', 'boom');
    });
  });

  describe('markManyRead', () => {
    it('llama repo.markReadMany con ids', async () => {
      repoMock.markReadMany.mockResolvedValue(2);
      const count = await markManyRead({ userId: 'u1', ids: ['n1', 'n2'], all: false });
      expect(repoMock.markReadMany).toHaveBeenCalledWith({
        userId: 'u1',
        ids: ['n1', 'n2'],
        all: false,
      });
      expect(count).toBe(2);
    });

    it('propaga error y loggea', async () => {
      repoMock.markReadMany.mockRejectedValue(new Error('x'));
      await expect(markManyRead({ userId: 'u1', ids: [], all: true })).rejects.toThrow('x');
      expect(loggerMock.error).toHaveBeenCalledWith('markManyRead:', 'x');
    });
  });

  describe('upsertPreferences', () => {
    it('llama repo.upsertPreferences', async () => {
      const prefs = { email_enabled: false };
      repoMock.upsertPreferences.mockResolvedValue(prefs);
      const out = await upsertPreferences({ userId: 'u1', prefs });
      expect(repoMock.upsertPreferences).toHaveBeenCalledWith({ userId: 'u1', prefs });
      expect(out).toEqual(prefs);
    });

    it('propaga error y loggea', async () => {
      repoMock.upsertPreferences.mockRejectedValue(new Error('fail'));
      await expect(upsertPreferences({ userId: 'u1', prefs: {} })).rejects.toThrow('fail');
      expect(loggerMock.error).toHaveBeenCalledWith('upsertPreferences:', 'fail');
    });
  });

  describe('getPreferences', () => {
    it('llama repo.getPreferences', async () => {
      repoMock.getPreferences.mockResolvedValue({ email_enabled: true });
      const out = await getPreferences({ userId: 'u1' });
      expect(repoMock.getPreferences).toHaveBeenCalledWith({ userId: 'u1' });
      expect(out).toEqual({ email_enabled: true });
    });

    it('propaga error y loggea', async () => {
      repoMock.getPreferences.mockRejectedValue(new Error('oops'));
      await expect(getPreferences({ userId: 'u1' })).rejects.toThrow('oops');
      expect(loggerMock.error).toHaveBeenCalledWith('getPreferences:', 'oops');
    });
  });

  describe('upsertTemplate', () => {
    it('llama repo.upsertTemplate (locale default=es si no se envía)', async () => {
      repoMock.upsertTemplate.mockResolvedValue({ id: 'tpl1' });

      const out = await upsertTemplate({ type: 'TASK_ASSIGNED', subject: 's', html: '<b>x</b>' });
      expect(repoMock.upsertTemplate).toHaveBeenCalledWith({
        type: 'TASK_ASSIGNED',
        locale: 'es',
        subject: 's',
        html: '<b>x</b>',
      });
      expect(out).toEqual({ id: 'tpl1' });
    });

    it('propaga error y loggea', async () => {
      repoMock.upsertTemplate.mockRejectedValue(new Error('err'));
      await expect(upsertTemplate({ type: 'X', subject: 's', html: 'h' })).rejects.toThrow('err');
      expect(loggerMock.error).toHaveBeenCalledWith('upsertTemplate:', 'err');
    });
  });

  describe('getTemplate', () => {
    it('llama repo.getTemplate con locale default=es', async () => {
      repoMock.getTemplate.mockResolvedValue({ type: 'T', locale: 'es' });
      const out = await getTemplate({ type: 'T' });
      expect(repoMock.getTemplate).toHaveBeenCalledWith({ type: 'T', locale: 'es' });
      expect(out).toEqual({ type: 'T', locale: 'es' });
    });

    it('propaga error y loggea', async () => {
      repoMock.getTemplate.mockRejectedValue(new Error('bad'));
      await expect(getTemplate({ type: 'T' })).rejects.toThrow('bad');
      expect(loggerMock.error).toHaveBeenCalledWith('getTemplate:', 'bad');
    });
  });

  describe('notifyUser', () => {
    it('crea notificación, emite RT y envía email cuando email_enabled=true', async () => {
      const notif = { id: 'n1', userId: 'u1', type: 'task_assigned', title: 'T', message: 'M' };
      repoMock.create.mockResolvedValue(notif);
      repoMock.getPreferences.mockResolvedValue({ email_enabled: true });
      userRepoMock.getProfileById.mockResolvedValue({
        id: 'u1',
        username: 'Ana',
        email: 'ana@x.com',
      });

      // io fake
      const io = { to: jest.fn().mockReturnValue({ emit: jest.fn() }) };
      const sendMail = jest.fn().mockResolvedValue({});

      const out = await notifyUser({
        userId: 'u1',
        type: 'task_assigned',
        title: 'T',
        message: 'M',
        related_id: 't1',
        is_read: false,
        io,
        sendMail,
      });

      // repo.create con payload original
      expect(repoMock.create).toHaveBeenCalledWith({
        userId: 'u1',
        type: 'task_assigned',
        title: 'T',
        message: 'M',
        related_id: 't1',
        is_read: false,
      });
      expect(out).toEqual(notif);

      // RT emit
      expect(io.to).toHaveBeenCalledWith('user:u1');
      const room = io.to.mock.results[0].value;
      expect(room.emit).toHaveBeenCalledWith('notification:new', notif);

      expect(repoMock.getPreferences).toHaveBeenCalledWith({ userId: 'u1' });
      expect(userRepoMock.getProfileById).toHaveBeenCalledWith('u1');
      expect(sendMail).toHaveBeenCalledWith({
        to: 'ana@x.com',
        subject: 'task_assigned',
        html: expect.stringContaining('Hola Ana'),
      });
    });

    it('no envía email cuando email_enabled=false', async () => {
      repoMock.create.mockResolvedValue({ id: 'n1' });
      repoMock.getPreferences.mockResolvedValue({ email_enabled: false });

      const io = { to: jest.fn().mockReturnValue({ emit: jest.fn() }) };
      const sendMail = jest.fn();

      await notifyUser({
        userId: 'u1',
        type: 'task_assigned',
        title: 'T',
        message: 'M',
        related_id: 't1',
        is_read: false,
        io,
        sendMail,
      });

      expect(sendMail).not.toHaveBeenCalled();
    });

    it('loggea pero no rompe si emitir RT lanza error', async () => {
      repoMock.create.mockResolvedValue({ id: 'n1' });
      repoMock.getPreferences.mockResolvedValue({ email_enabled: false }); // evitar email
      const io = {
        to: () => ({
          emit: () => {
            throw new Error('ws');
          },
        }),
      };
      const sendMail = jest.fn();

      await notifyUser({
        userId: 'u1',
        type: 'x',
        title: 't',
        message: 'm',
        related_id: 'id',
        is_read: false,
        io,
        sendMail,
      });

      expect(loggerMock.error).toHaveBeenCalledWith('notifyUser RT:', 'ws');
    });

    it('loggea pero no rompe si email path falla (prefs/profile/sendMail)', async () => {
      repoMock.create.mockResolvedValue({ id: 'n1' });
      repoMock.getPreferences.mockRejectedValue(new Error('email-path'));
      const io = { to: jest.fn().mockReturnValue({ emit: jest.fn() }) };
      const sendMail = jest.fn();

      await notifyUser({
        userId: 'u1',
        type: 'x',
        title: 't',
        message: 'm',
        related_id: 'id',
        is_read: false,
        io,
        sendMail,
      });

      expect(loggerMock.error).toHaveBeenCalledWith('notifyUser Email:', 'email-path');
    });
  });

  describe('renderTemplate', () => {
    it('reemplaza {{vars}} y deja vacío si falta', () => {
      const tpl = 'Hola {{name}}, tarea: {{title}}, faltante: {{missing}}';
      const out = renderTemplate(tpl, { name: 'Ana', title: 'Informe' });
      expect(out).toBe('Hola Ana, tarea: Informe, faltante: ');
    });
  });
});
