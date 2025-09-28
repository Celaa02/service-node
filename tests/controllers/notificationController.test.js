/* eslint-disable prettier/prettier */
import { jest } from '@jest/globals';

const makeRes = () => {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
};

const loggerMock = { error: jest.fn() };
jest.unstable_mockModule('../../src/utils/logger.js', () => ({ default: loggerMock }));

const listQueryValidate = jest.fn();
const markReadParamsValidate = jest.fn();
const markManyBodyValidate = jest.fn();
const prefsBodyValidate = jest.fn();
const templateBodyValidate = jest.fn();

jest.unstable_mockModule('../../src/services/validations/notification.schema.js', () => ({
  listQuery: { validate: listQueryValidate },
  markReadParams: { validate: markReadParamsValidate },
  markManyBody: { validate: markManyBodyValidate },
  prefsBody: { validate: prefsBodyValidate },
  templateBody: { validate: templateBodyValidate },
}));

const listNotificationsMock = jest.fn();
const markNotificationReadMock = jest.fn();
const markManyReadMock = jest.fn();
const upsertPreferencesMock = jest.fn();
const getPreferencesMock = jest.fn();
const upsertTemplateMock = jest.fn();

jest.unstable_mockModule('../../src/services/notificationService.js', () => ({
  listNotifications: listNotificationsMock,
  markNotificationRead: markNotificationReadMock,
  markManyRead: markManyReadMock,
  upsertPreferences: upsertPreferencesMock,
  getPreferences: getPreferencesMock,
  upsertTemplate: upsertTemplateMock,
}));

const { list, markRead, markMany, getUserPrefs, putUserPrefs, upsertEmailTemplate } = await import(
  '../../src/controllers/notificationController.js'
);

const resetAll = () => {
  jest.clearAllMocks();
  listQueryValidate.mockReset();
  markReadParamsValidate.mockReset();
  markManyBodyValidate.mockReset();
  prefsBodyValidate.mockReset();
  templateBodyValidate.mockReset();
  listNotificationsMock.mockReset();
  markNotificationReadMock.mockReset();
  markManyReadMock.mockReset();
  upsertPreferencesMock.mockReset();
  getPreferencesMock.mockReset();
  upsertTemplateMock.mockReset();
};

describe('notificationController', () => {
  beforeEach(resetAll);

  describe('list', () => {
    it('retorna items y total con paginación', async () => {
      const req = { query: { page: '1', limit: '10' }, user: { userId: 'u1' } };
      const res = makeRes();

      listQueryValidate.mockReturnValue({
        error: null,
        value: { page: 1, limit: 10, only_unread: false },
      });
      listNotificationsMock.mockResolvedValue({ items: [{ id: 'n1' }], total: 5 });

      await list(req, res);

      expect(listQueryValidate).toHaveBeenCalledWith(req.query);
      expect(listNotificationsMock).toHaveBeenCalledWith({
        userId: 'u1',
        page: 1,
        limit: 10,
        only_unread: false,
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        items: [{ id: 'n1' }],
        total: 5,
        page: 1,
        limit: 10,
      });
    });

    it('400 si validación falla', async () => {
      const req = { query: {}, user: { userId: 'u1' } };
      const res = makeRes();

      listQueryValidate.mockReturnValue({ error: { message: 'bad query' } });

      await list(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'bad query' });
      expect(listNotificationsMock).not.toHaveBeenCalled();
    });

    it('500 si service lanza error', async () => {
      const req = { query: {}, user: { userId: 'u1' } };
      const res = makeRes();

      listQueryValidate.mockReturnValue({
        error: null,
        value: { page: 1, limit: 10, only_unread: false },
      });
      listNotificationsMock.mockRejectedValue(new Error('db down'));

      await list(req, res);

      expect(loggerMock.error).toHaveBeenCalledWith('notifications.list:', 'db down');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });
  });

  describe('markRead', () => {
    it('200 cuando se marca como leída', async () => {
      const req = { params: { id: 'n1' }, user: { userId: 'u1' } };
      const res = makeRes();

      markReadParamsValidate.mockReturnValue({ error: null });
      markNotificationReadMock.mockResolvedValue(true);

      await markRead(req, res);

      expect(markReadParamsValidate).toHaveBeenCalledWith(req.params);
      expect(markNotificationReadMock).toHaveBeenCalledWith({ userId: 'u1', id: 'n1' });
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('404 cuando no se encuentra', async () => {
      const req = { params: { id: 'n1' }, user: { userId: 'u1' } };
      const res = makeRes();

      markReadParamsValidate.mockReturnValue({ error: null });
      markNotificationReadMock.mockResolvedValue(false);

      await markRead(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'No encontrada' });
    });

    it('400 si validación falla', async () => {
      const req = { params: { id: 'bad' }, user: { userId: 'u1' } };
      const res = makeRes();

      markReadParamsValidate.mockReturnValue({ error: { message: 'bad id' } });

      await markRead(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'bad id' });
      expect(markNotificationReadMock).not.toHaveBeenCalled();
    });

    it('500 si service lanza error', async () => {
      const req = { params: { id: 'n1' }, user: { userId: 'u1' } };
      const res = makeRes();

      markReadParamsValidate.mockReturnValue({ error: null });
      markNotificationReadMock.mockRejectedValue(new Error('boom'));

      await markRead(req, res);

      expect(loggerMock.error).toHaveBeenCalledWith('notifications.markRead:', 'boom');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });
  });

  describe('markMany', () => {
    it('200 con cantidad actualizada', async () => {
      const req = { body: { ids: ['n1', 'n2'] }, user: { userId: 'u1' } };
      const res = makeRes();

      markManyBodyValidate.mockReturnValue({
        error: null,
        value: { ids: ['n1', 'n2'], all: false },
      });
      markManyReadMock.mockResolvedValue(2);

      await markMany(req, res);

      expect(markManyBodyValidate).toHaveBeenCalledWith(req.body);
      expect(markManyReadMock).toHaveBeenCalledWith({
        userId: 'u1',
        ids: ['n1', 'n2'],
        all: false,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, updated: 2 });
    });

    it('400 si validación falla', async () => {
      const req = { body: {}, user: { userId: 'u1' } };
      const res = makeRes();

      markManyBodyValidate.mockReturnValue({ error: { message: 'bad body' } });

      await markMany(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'bad body' });
      expect(markManyReadMock).not.toHaveBeenCalled();
    });

    it('500 si service lanza error', async () => {
      const req = { body: { all: true }, user: { userId: 'u1' } };
      const res = makeRes();

      markManyBodyValidate.mockReturnValue({ error: null, value: { all: true } });
      markManyReadMock.mockRejectedValue(new Error('fail'));

      await markMany(req, res);

      expect(loggerMock.error).toHaveBeenCalledWith('notifications.markMany:', 'fail');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });
  });

  describe('getUserPrefs', () => {
    it('200 con prefs', async () => {
      const req = { user: { userId: 'u1' } };
      const res = makeRes();

      getPreferencesMock.mockResolvedValue({ email_enabled: true });

      await getUserPrefs(req, res);

      expect(getPreferencesMock).toHaveBeenCalledWith({ userId: 'u1' });
      expect(res.json).toHaveBeenCalledWith({ success: true, prefs: { email_enabled: true } });
    });

    it('500 si service lanza error', async () => {
      const req = { user: { userId: 'u1' } };
      const res = makeRes();

      getPreferencesMock.mockRejectedValue(new Error('oops'));

      await getUserPrefs(req, res);

      expect(loggerMock.error).toHaveBeenCalledWith('notifications.getUserPrefs:', 'oops');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });
  });

  describe('putUserPrefs', () => {
    it('200 con prefs actualizadas', async () => {
      const req = { user: { userId: 'u1' }, body: { email_enabled: false } };
      const res = makeRes();

      prefsBodyValidate.mockReturnValue({ error: null, value: { email_enabled: false } });
      upsertPreferencesMock.mockResolvedValue({ email_enabled: false });

      await putUserPrefs(req, res);

      expect(prefsBodyValidate).toHaveBeenCalledWith(req.body);
      expect(upsertPreferencesMock).toHaveBeenCalledWith({
        userId: 'u1',
        prefs: { email_enabled: false },
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, prefs: { email_enabled: false } });
    });

    it('400 si validación falla', async () => {
      const req = { user: { userId: 'u1' }, body: {} };
      const res = makeRes();

      prefsBodyValidate.mockReturnValue({ error: { message: 'bad prefs' } });

      await putUserPrefs(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'bad prefs' });
      expect(upsertPreferencesMock).not.toHaveBeenCalled();
    });

    it('500 si service lanza error', async () => {
      const req = { user: { userId: 'u1' }, body: { email_enabled: true } };
      const res = makeRes();

      prefsBodyValidate.mockReturnValue({ error: null, value: { email_enabled: true } });
      upsertPreferencesMock.mockRejectedValue(new Error('boom'));

      await putUserPrefs(req, res);

      expect(loggerMock.error).toHaveBeenCalledWith('notifications.putUserPrefs:', 'boom');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });
  });

  describe('upsertEmailTemplate', () => {
    it('200 con template resultante', async () => {
      const req = { body: { type: 'TASK_ASSIGNED', locale: 'es', subject: 's', html: '<b>x</b>' } };
      const res = makeRes();

      templateBodyValidate.mockReturnValue({ error: null, value: req.body });
      upsertTemplateMock.mockResolvedValue({ id: 'tpl1', ...req.body });

      await upsertEmailTemplate(req, res);

      expect(templateBodyValidate).toHaveBeenCalledWith(req.body);
      expect(upsertTemplateMock).toHaveBeenCalledWith(req.body);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        template: { id: 'tpl1', ...req.body },
      });
    });

    it('400 si validación falla', async () => {
      const req = { body: {} };
      const res = makeRes();

      templateBodyValidate.mockReturnValue({ error: { message: 'bad template' } });

      await upsertEmailTemplate(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'bad template' });
      expect(upsertTemplateMock).not.toHaveBeenCalled();
    });

    it('500 si service lanza error', async () => {
      const req = { body: { type: 'X', subject: 's', html: 'h' } };
      const res = makeRes();

      templateBodyValidate.mockReturnValue({ error: null, value: req.body });
      upsertTemplateMock.mockRejectedValue(new Error('fail'));

      await upsertEmailTemplate(req, res);

      expect(loggerMock.error).toHaveBeenCalledWith('notifications.upsertEmailTemplate:', 'fail');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });
  });
});
