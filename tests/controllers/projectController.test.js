import { jest } from '@jest/globals';

const loggerMock = { error: jest.fn() };
jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: loggerMock,
}));

const getProjectStatsService = jest.fn();
jest.unstable_mockModule('../../src/services/projectService.js', () => ({
  getProjectStatsService,
}));

const { getProjectStats } = await import('../../src/controllers/projectController.js');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = () => jest.fn();

describe('Projects Controller - getProjectStats (ESM)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('200 -> retorna success true y stats del servicio', async () => {
    const req = { params: { id: '650e8400-e29b-41d4-a716-446655440001' } };
    const res = mockRes();
    const next = mockNext();

    const fakeStats = {
      project: { id: req.params.id, name: 'Plataforma E-Learning', status: 'active' },
      tasks: {
        total: 10,
        by_status: { pending: 3, in_progress: 4, done: 3 },
        completion_percentage: 30,
        last_activity: '2025-09-28T10:00:00.000Z',
      },
      hours: { estimated: 120, actual: 80, efficiency_percentage: 66.67 },
      top_contributors: [
        { user_id: 'u1', username: 'sofia', completed_tasks: 5 },
        { user_id: 'u2', username: 'carlos', completed_tasks: 3 },
      ],
    };

    getProjectStatsService.mockResolvedValue(fakeStats);

    await getProjectStats(req, res, next);

    expect(getProjectStatsService).toHaveBeenCalledWith(req.params.id);
    expect(res.json).toHaveBeenCalledWith({ success: true, ...fakeStats });
    expect(res.status).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('404 -> devuelve error específico y no llama a next', async () => {
    const req = { params: { id: '650e8400-e29b-41d4-a716-446655440099' } };
    const res = mockRes();
    const next = mockNext();

    getProjectStatsService.mockRejectedValue({ status: 404, message: 'Proyecto no encontrado' });

    await getProjectStats(req, res, next);

    expect(getProjectStatsService).toHaveBeenCalledWith(req.params.id);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Proyecto no encontrado' });
    expect(loggerMock.error).not.toHaveBeenCalled(); // el controlador no loggea en el 404 explícito
    expect(next).not.toHaveBeenCalled();
  });

  it('error inesperado -> loggea y delega a next(err)', async () => {
    const req = { params: { id: '650e8400-e29b-41d4-a716-446655440001' } };
    const res = mockRes();
    const next = mockNext();

    const boom = new Error('db down');
    getProjectStatsService.mockRejectedValue(boom);

    await getProjectStats(req, res, next);

    expect(getProjectStatsService).toHaveBeenCalledWith(req.params.id);
    expect(loggerMock.error).toHaveBeenCalledWith('getProjectStats error:', 'db down');
    expect(next).toHaveBeenCalledWith(boom);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
