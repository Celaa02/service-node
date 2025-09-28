import { jest } from '@jest/globals';

const loggerMock = { info: jest.fn(), error: jest.fn() };
jest.unstable_mockModule('../../src/utils/logger.js', () => ({ default: loggerMock }));

const svc = {
  addCommentService: jest.fn(),
  createTaskService: jest.fn(),
  deleteTaskService: jest.fn(),
  getTaskByIdService: jest.fn(),
  getTasksService: jest.fn(),
  updateTaskService: jest.fn(),
};
jest.unstable_mockModule('../../src/services/taskService.js', () => ({ ...svc }));

const schemas = {
  idParamUuidSchema: { validate: jest.fn(() => ({ error: undefined })) },
  updateTaskSchema: { validate: jest.fn(() => ({ error: undefined })) },
  bodySchemaComment: { validate: jest.fn(() => ({ error: undefined })) },
};
jest.unstable_mockModule('../../src/services/validations/task.schema.js', () => ({
  idParamUuidSchema: schemas.idParamUuidSchema,
  updateTaskSchema: schemas.updateTaskSchema,
  bodySchemaComment: schemas.bodySchemaComment,
}));

const { createTask, getTasks, getTaskById, updateTask, deleteTask, addComment } = await import(
  '../../src/controllers/taskController.js'
);

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Tasks Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    schemas.idParamUuidSchema.validate.mockImplementation(() => ({ error: undefined }));
    schemas.updateTaskSchema.validate.mockImplementation(() => ({ error: undefined }));
    schemas.bodySchemaComment.validate.mockImplementation(() => ({ error: undefined }));
  });

  describe('createTask', () => {
    it('401 si no viene req.user.userId', async () => {
      const req = { user: undefined, body: { title: 'x' } };
      const res = mockRes();

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Usuario no autenticado' });
      expect(svc.createTaskService).not.toHaveBeenCalled();
    });

    it('201 cuando crea OK y loggea info', async () => {
      const req = { user: { userId: 'u1' }, body: { title: 'Task A' } };
      const res = mockRes();
      svc.createTaskService.mockResolvedValue({ id: 't1', title: 'Task A' });

      await createTask(req, res);

      expect(svc.createTaskService).toHaveBeenCalledWith({ title: 'Task A', created_by: 'u1' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tarea creada exitosamente',
        task: { id: 't1', title: 'Task A' },
      });
      expect(loggerMock.info).toHaveBeenCalled();
    });

    it('500 si el servicio lanza error genérico', async () => {
      const req = { user: { userId: 'u1' }, body: { title: 'X' } };
      const res = mockRes();
      svc.createTaskService.mockRejectedValue(new Error('boom'));

      await createTask(req, res);

      expect(loggerMock.error).toHaveBeenCalledWith('createTask:', 'boom');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });
  });

  describe('getTasks', () => {
    it('200 con query completa y order uppercased + default sort_by', async () => {
      const req = {
        query: {
          page: '2',
          limit: '10',
          status: 'open',
          priority: 'high',
          assigned_to: 'u2',
          project_id: 'p1',
          sort_by: undefined,
          order: 'asc',
        },
      };
      const res = mockRes();
      svc.getTasksService.mockResolvedValue({ items: [{ id: 't1' }], total: 50 });

      await getTasks(req, res);

      expect(svc.getTasksService).toHaveBeenCalledWith({
        page: '2',
        limit: '10',
        offset: 10,
        status: 'open',
        priority: 'high',
        assigned_to: 'u2',
        project_id: 'p1',
        sort_by: 'created_at',
        order: 'ASC',
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        tasks: [{ id: 't1' }],
        pagination: { page: 2, limit: 10, total: 50 },
      });
    });

    it('200 con defaults cuando faltan params (order->DESC, sort_by->created_at, page/limit -> 1/10)', async () => {
      const req = { query: {} };
      const res = mockRes();
      svc.getTasksService.mockResolvedValue({ items: [], total: 0 });

      await getTasks(req, res);

      expect(svc.getTasksService).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        offset: NaN,
        status: undefined,
        priority: undefined,
        assigned_to: undefined,
        project_id: undefined,
        sort_by: 'created_at',
        order: 'DESC',
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        tasks: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });
    });

    it('500 si el servicio lanza error', async () => {
      const req = { query: {} };
      const res = mockRes();
      svc.getTasksService.mockRejectedValue(new Error('db down'));

      await getTasks(req, res);

      expect(loggerMock.error).toHaveBeenCalledWith('getTasks:', 'db down');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });
  });

  describe('getTaskById', () => {
    it('400 si UUID inválido', async () => {
      const req = { params: { id: 'no-uuid' } };
      const res = mockRes();
      schemas.idParamUuidSchema.validate.mockReturnValueOnce({
        error: { details: [{ message: '"id" inválido' }] },
      });

      await getTaskById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'El id proporcionado no es un UUID válido',
        details: ['"id" inválido'],
      });
      expect(svc.getTaskByIdService).not.toHaveBeenCalled();
    });

    it('404 si no existe', async () => {
      const req = { params: { id: '9f77e2bd-5c0b-4e18-9f2c-8d9f9c1c9b11' } };
      const res = mockRes();
      svc.getTaskByIdService.mockResolvedValue(null);

      await getTaskById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Tarea no encontrada' });
    });

    it('200 con task', async () => {
      const req = { params: { id: '9f77e2bd-5c0b-4e18-9f2c-8d9f9c1c9b11' } };
      const res = mockRes();
      svc.getTaskByIdService.mockResolvedValue({ id: 't1' });

      await getTaskById(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, task: { id: 't1' } });
    });

    it('500 error inesperado', async () => {
      const req = { params: { id: '9f77e2bd-5c0b-4e18-9f2c-8d9f9c1c9b11' } };
      const res = mockRes();
      svc.getTaskByIdService.mockRejectedValue(new Error('boom'));

      await getTaskById(req, res);

      expect(loggerMock.error).toHaveBeenCalledWith('getTaskById:', 'boom');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });
  });

  describe('updateTask', () => {
    it('400 si UUID inválido', async () => {
      const req = { params: { id: 'x' }, body: {} };
      const res = mockRes();
      schemas.idParamUuidSchema.validate.mockReturnValueOnce({
        error: { details: [{ message: '"id" inválido' }] },
      });

      await updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'El id proporcionado no es un UUID válido',
        details: ['"id" inválido'],
      });
      expect(svc.updateTaskService).not.toHaveBeenCalled();
    });

    it('400 si body inválido', async () => {
      const req = {
        params: { id: '9f77e2bd-5c0b-4e18-9f2c-8d9f9c1c9b11' },
        body: { status: '???' },
      };
      const res = mockRes();
      schemas.updateTaskSchema.validate.mockReturnValueOnce({
        error: { details: [{ message: '"status" no permitido' }] },
      });

      await updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'El body no cumple el esquema de actualización',
        details: ['"status" no permitido'],
      });
      expect(svc.updateTaskService).not.toHaveBeenCalled();
    });

    it('404 si no encuentra la tarea', async () => {
      const req = {
        params: { id: '9f77e2bd-5c0b-4e18-9f2c-8d9f9c1c9b11' },
        body: { status: 'open' },
      };
      const res = mockRes();
      svc.updateTaskService.mockResolvedValue(null);

      await updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Tarea no encontrada' });
    });

    it('200 cuando actualiza OK y loggea info', async () => {
      const req = {
        params: { id: '9f77e2bd-5c0b-4e18-9f2c-8d9f9c1c9b11' },
        body: { status: 'done' },
      };
      const res = mockRes();
      svc.updateTaskService.mockResolvedValue({ id: 't1', title: 'T', status: 'done' });

      await updateTask(req, res);

      expect(svc.updateTaskService).toHaveBeenCalledWith({
        id: '9f77e2bd-5c0b-4e18-9f2c-8d9f9c1c9b11',
        patch: { status: 'done' },
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tarea actualizada exitosamente',
        task: { id: 't1', title: 'T', status: 'done' },
      });
      expect(loggerMock.info).toHaveBeenCalled();
    });

    it('500 inesperado', async () => {
      const req = {
        params: { id: '9f77e2bd-5c0b-4e18-9f2c-8d9f9c1c9b11' },
        body: { status: 'open' },
      };
      const res = mockRes();
      svc.updateTaskService.mockRejectedValue(new Error('db down'));

      await updateTask(req, res);

      expect(loggerMock.error).toHaveBeenCalledWith('updateTask:', 'db down');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });
  });

  describe('deleteTask', () => {
    it('400 si UUID inválido', async () => {
      const req = { params: { id: 'x' } };
      const res = mockRes();
      schemas.idParamUuidSchema.validate.mockReturnValueOnce({
        error: { details: [{ message: '"id" inválido' }] },
      });

      await deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'El id proporcionado no es un UUID válido',
        details: ['"id" inválido'],
      });
      expect(svc.deleteTaskService).not.toHaveBeenCalled();
    });

    it('404 si no existe', async () => {
      const req = { params: { id: '9f77e2bd-5c0b-4e18-9f2c-8d9f9c1c9b11' } };
      const res = mockRes();
      svc.deleteTaskService.mockResolvedValue(false);

      await deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Tarea no encontrada' });
    });

    it('200 cuando elimina OK y loggea info', async () => {
      const req = { params: { id: '9f77e2bd-5c0b-4e18-9f2c-8d9f9c1c9b11' } };
      const res = mockRes();
      svc.deleteTaskService.mockResolvedValue(true);

      await deleteTask(req, res);

      expect(svc.deleteTaskService).toHaveBeenCalledWith({
        id: '9f77e2bd-5c0b-4e18-9f2c-8d9f9c1c9b11',
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tarea eliminada exitosamente',
      });
      expect(loggerMock.info).toHaveBeenCalled();
    });

    it('500 inesperado', async () => {
      const req = { params: { id: '9f77e2bd-5c0b-4e18-9f2c-8d9f9c1c9b11' } };
      const res = mockRes();
      svc.deleteTaskService.mockRejectedValue(new Error('boom'));

      await deleteTask(req, res);

      expect(loggerMock.error).toHaveBeenCalledWith('deleteTask:', 'boom');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });
  });

  describe('addComment', () => {
    it('400 si UUID inválido', async () => {
      const req = { params: { id: 'x' }, body: { content: 'hola' }, user: { userId: 'u1' } };
      const res = mockRes();
      schemas.idParamUuidSchema.validate.mockReturnValueOnce({
        error: { details: [{ message: '"id" inválido' }] },
      });

      await addComment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'El id proporcionado no es un UUID válido',
        details: ['"id" inválido'],
      });
      expect(svc.addCommentService).not.toHaveBeenCalled();
    });

    it('400 si body inválido', async () => {
      const req = {
        params: { id: '9f77e2bd-5c0b-4e18-9f2c-8d9f9c1c9b11' },
        body: {},
        user: { userId: 'u1' },
      };
      const res = mockRes();
      schemas.bodySchemaComment.validate.mockReturnValueOnce({
        error: { details: [{ message: '"content" requerido' }] },
      });

      await addComment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'El body no cumple el esquema de actualización',
        details: ['"content" requerido'],
      });
      expect(svc.addCommentService).not.toHaveBeenCalled();
    });

    it('200 cuando agrega comentario OK', async () => {
      const req = {
        params: { id: '9f77e2bd-5c0b-4e18-9f2c-8d9f9c1c9b11' },
        body: { content: 'Hola' },
        user: { userId: 'u1' },
      };
      const res = mockRes();
      svc.addCommentService.mockResolvedValue({ id: 'c1', content: 'Hola' });

      await addComment(req, res);

      expect(svc.addCommentService).toHaveBeenCalledWith({
        task_id: '9f77e2bd-5c0b-4e18-9f2c-8d9f9c1c9b11',
        user_id: 'u1',
        content: 'Hola',
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Comentario agregado exitosamente',
        comment: { id: 'c1', content: 'Hola' },
      });
    });

    it('500 inesperado', async () => {
      const req = {
        params: { id: '9f77e2bd-5c0b-4e18-9f2c-8d9f9c1c9b11' },
        body: { content: 'Hola' },
        user: { userId: 'u1' },
      };
      const res = mockRes();
      svc.addCommentService.mockRejectedValue(new Error('db down'));

      await addComment(req, res);

      expect(loggerMock.error).toHaveBeenCalledWith('addComment:', 'db down');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });
  });
});
