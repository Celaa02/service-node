import { jest } from '@jest/globals';

const loggerMock = { error: jest.fn() };
jest.unstable_mockModule('../../src/utils/logger.js', () => ({ default: loggerMock }));

const repoMock = {
  create: jest.fn(),
  list: jest.fn(),
  getById: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  addComment: jest.fn(),
};

const TaskRepositoryPg = jest.fn(() => repoMock);
jest.unstable_mockModule('../../src/infrastructure/persistence/pg/TaskRepositoryPg.js', () => ({
  TaskRepositoryPg,
}));

const {
  createTaskService,
  getTasksService,
  getTaskByIdService,
  updateTaskService,
  deleteTaskService,
  addCommentService,
} = await import('../../src/services/taskService.js');

const resetAll = () => {
  jest.clearAllMocks();
  for (const k of Object.keys(repoMock)) repoMock[k].mockReset();
};

describe('taskService', () => {
  beforeEach(resetAll);

  describe('createTaskService', () => {
    it('usa assigned_to si viene; no lo sobreescribe', async () => {
      repoMock.create.mockResolvedValue({ id: 't1' });

      const payload = {
        title: 'A',
        description: 'd',
        project_id: 'p1',
        assigned_to: 'user-x',
        created_by: 'user-y',
        priority: 'high',
        due_date: '2030-01-01',
        estimated_hours: 5,
      };

      const out = await createTaskService(payload);

      expect(repoMock.create).toHaveBeenCalledWith({
        title: 'A',
        description: 'd',
        project_id: 'p1',
        assigned_to: 'user-x',
        created_by: 'user-y',
        priority: 'high',
        due_date: '2030-01-01',
        estimated_hours: 5,
      });
      expect(out).toEqual({ id: 't1' });
    });

    it('si no hay assigned_to, usa created_by', async () => {
      repoMock.create.mockResolvedValue({ id: 't2' });

      const out = await createTaskService({
        title: 'B',
        created_by: 'owner-1',
      });

      expect(repoMock.create).toHaveBeenCalledWith({
        title: 'B',
        description: undefined,
        project_id: undefined,
        assigned_to: 'owner-1', // fallback
        created_by: 'owner-1',
        priority: undefined,
        due_date: undefined,
        estimated_hours: undefined,
      });
      expect(out).toEqual({ id: 't2' });
    });

    it('loggea y propaga error', async () => {
      repoMock.create.mockRejectedValue(new Error('boom'));
      await expect(createTaskService({ title: 'X' })).rejects.toThrow('boom');
      expect(loggerMock.error).toHaveBeenCalledWith('Error en service createTaskService:', 'boom');
    });
  });

  describe('getTasksService', () => {
    it('pasa filtros y devuelve { total, items, page, limit }', async () => {
      repoMock.list.mockResolvedValue({ total: 42, items: [{ id: 't1' }] });

      const out = await getTasksService({
        page: 2,
        limit: 10,
        offset: 10,
        status: 'open',
        priority: 'high',
        assigned_to: 'u1',
        project_id: 'p1',
        sort_by: 'created_at',
        order: 'DESC',
      });

      expect(repoMock.list).toHaveBeenCalledWith({
        limit: 10,
        offset: 10,
        status: 'open',
        priority: 'high',
        assigned_to: 'u1',
        project_id: 'p1',
        sort_by: 'created_at',
        order: 'DESC',
      });
      expect(out).toEqual({ total: 42, items: [{ id: 't1' }], page: 2, limit: 10 });
    });

    it('loggea y propaga error', async () => {
      repoMock.list.mockRejectedValue(new Error('db down'));
      await expect(getTasksService({})).rejects.toThrow('db down');
      expect(loggerMock.error).toHaveBeenCalledWith('Error en service getTasksService:', 'db down');
    });
  });

  describe('getTaskByIdService', () => {
    it('retorna la tarea', async () => {
      repoMock.getById.mockResolvedValue({ id: 't1' });
      const out = await getTaskByIdService({ id: 't1' });
      expect(repoMock.getById).toHaveBeenCalledWith('t1');
      expect(out).toEqual({ id: 't1' });
    });

    it('loggea y propaga error', async () => {
      repoMock.getById.mockRejectedValue(new Error('x'));
      await expect(getTaskByIdService({ id: 't1' })).rejects.toThrow('x');
      expect(loggerMock.error).toHaveBeenCalledWith('Error en service getTaskByIdService:', 'x');
    });
  });

  describe('updateTaskService', () => {
    it('retorna actualizado', async () => {
      repoMock.update.mockResolvedValue({ id: 't1', status: 'done' });
      const out = await updateTaskService({ id: 't1', patch: { status: 'done' } });
      expect(repoMock.update).toHaveBeenCalledWith('t1', { status: 'done' });
      expect(out).toEqual({ id: 't1', status: 'done' });
    });

    it('loggea y propaga error', async () => {
      repoMock.update.mockRejectedValue(new Error('fail'));
      await expect(updateTaskService({ id: 't1', patch: {} })).rejects.toThrow('fail');
      expect(loggerMock.error).toHaveBeenCalledWith('Error en service updateTaskService:', 'fail');
    });
  });

  describe('deleteTaskService', () => {
    it('devuelve true cuando repo.remove retorna truthy', async () => {
      repoMock.remove.mockResolvedValue(1);
      const out = await deleteTaskService({ id: 't1' });
      expect(repoMock.remove).toHaveBeenCalledWith('t1');
      expect(out).toBe(true);
    });

    it('devuelve false cuando repo.remove retorna falsy', async () => {
      repoMock.remove.mockResolvedValue(0);
      const out = await deleteTaskService({ id: 't1' });
      expect(out).toBe(false);
    });

    it('loggea y propaga error', async () => {
      repoMock.remove.mockRejectedValue(new Error('cannot delete'));
      await expect(deleteTaskService({ id: 't1' })).rejects.toThrow('cannot delete');
      expect(loggerMock.error).toHaveBeenCalledWith(
        'Error en service deleteTaskService:',
        'cannot delete',
      );
    });
  });

  describe('addCommentService', () => {
    it('convierte a string y hace trim del content', async () => {
      repoMock.addComment.mockResolvedValue({ id: 'c1', content: '123' });

      const out = await addCommentService({
        task_id: 't1',
        user_id: 'u1',
        content: 123,
      });

      expect(repoMock.addComment).toHaveBeenCalledWith('t1', 'u1', '123');
      expect(out).toEqual({ id: 'c1', content: '123' });
    });

    it('loggea y propaga error', async () => {
      repoMock.addComment.mockRejectedValue(new Error('boom'));
      await expect(
        addCommentService({ task_id: 't1', user_id: 'u1', content: 'x' }),
      ).rejects.toThrow('boom');
      expect(loggerMock.error).toHaveBeenCalledWith('Error en service addCommentService:', 'boom');
    });
  });
});
