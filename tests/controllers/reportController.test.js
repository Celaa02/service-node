import { jest } from '@jest/globals';
const loggerMock = { error: jest.fn() };
jest.unstable_mockModule('../../src/utils/logger.js', () => ({ default: loggerMock }));

const serviceMocks = {
  exportDataServices: jest.fn(),
  getDashboardStatsServices: jest.fn(),
  getProjectReportServices: jest.fn(),
  getProjectTimelineServices: jest.fn(),
  getTimeTrackingAnalysisServices: jest.fn(),
  getUserProductivityReportServices: jest.fn(),
  getUserRankingServices: jest.fn(),
  getWorkloadDistributionServices: jest.fn(),
  importTasksFromCSVServices: jest.fn(),
};

jest.unstable_mockModule('../../src/services/reportService.js', () => ({
  ...serviceMocks,
}));

const schemaMocks = {
  rankingQuery: {
    validate: jest.fn(() => ({ error: undefined })),
  },
  timelineQuery: {
    validate: jest.fn(() => ({ error: undefined })),
  },
  workloadQuery: {
    validate: jest.fn(() => ({ error: undefined })),
  },
};
jest.unstable_mockModule('../../src/services/validations/reports.schema.js', () => ({
  ...schemaMocks,
}));

const {
  getDashboardStats,
  getUserProductivityReport,
  getProjectReport,
  getTimeTrackingAnalysis,
  getUserRanking,
  getProjectTimeline,
  getWorkloadDistribution,
  importTasksFromCSV,
  exportData,
} = await import('../../src/controllers/reportController.js');

// Helper de res
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn();
  res.send = jest.fn();
  return res;
};

describe('Reports Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('200 con stats', async () => {
      const res = mockRes();
      const req = {};
      serviceMocks.getDashboardStatsServices.mockResolvedValue({ projects: 10, users: 5 });

      await getDashboardStats(req, res);

      expect(serviceMocks.getDashboardStatsServices).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, stats: { projects: 10, users: 5 } });
    });

    it('error con status -> responde status y mensaje', async () => {
      const res = mockRes();
      const req = {};
      const err = { status: 503, message: 'fuera de servicio' };
      serviceMocks.getDashboardStatsServices.mockRejectedValue(err);

      await getDashboardStats(req, res);

      expect(loggerMock.error).toHaveBeenCalledWith('getDashboardStats:', 'fuera de servicio');
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({ error: 'fuera de servicio' });
    });

    it('error sin status -> 500 genérico', async () => {
      const res = mockRes();
      const req = {};
      serviceMocks.getDashboardStatsServices.mockRejectedValue(new Error('boom'));

      await getDashboardStats(req, res);

      expect(loggerMock.error).toHaveBeenCalledWith('getDashboardStats:', 'boom');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });
  });

  describe('getUserProductivityReport', () => {
    it('200 y castea limit/offset a Number con defaults', async () => {
      const res = mockRes();
      const req = {
        query: { start_date: '2025-01-01', end_date: '2025-01-31', limit: '25', offset: '5' },
      };
      serviceMocks.getUserProductivityReportServices.mockResolvedValue({ items: [], total: 0 });

      await getUserProductivityReport(req, res);

      expect(serviceMocks.getUserProductivityReportServices).toHaveBeenCalledWith({
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        limit: 25,
        offset: 5,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, items: [], total: 0 });
    });

    it('usa defaults cuando faltan query params', async () => {
      const res = mockRes();
      const req = { query: {} };
      serviceMocks.getUserProductivityReportServices.mockResolvedValue({
        items: [{ u: 1 }],
        total: 1,
      });

      await getUserProductivityReport(req, res);

      expect(serviceMocks.getUserProductivityReportServices).toHaveBeenCalledWith({
        start_date: null,
        end_date: null,
        limit: 10,
        offset: 0,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, items: [{ u: 1 }], total: 1 });
    });

    it('error -> 500 genérico', async () => {
      const res = mockRes();
      const req = { query: {} };
      serviceMocks.getUserProductivityReportServices.mockRejectedValue(new Error('x'));

      await getUserProductivityReport(req, res);

      expect(loggerMock.error).toHaveBeenCalledWith('getUserProductivityReport:', 'x');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });
  });

  describe('getProjectReport', () => {
    it('200 con projects', async () => {
      const res = mockRes();
      const req = { query: { status: 'active', owner_id: 'u1' } };
      serviceMocks.getProjectReportServices.mockResolvedValue([{ id: 1 }]);

      await getProjectReport(req, res);

      expect(serviceMocks.getProjectReportServices).toHaveBeenCalledWith({
        status: 'active',
        owner_id: 'u1',
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, projects: [{ id: 1 }] });
    });

    it('error con status -> responde ese status', async () => {
      const res = mockRes();
      const req = { query: {} };
      const err = { status: 400, message: 'parámetros inválidos' };
      serviceMocks.getProjectReportServices.mockRejectedValue(err);

      await getProjectReport(req, res);

      expect(loggerMock.error).toHaveBeenCalledWith('getProjectReport:', 'parámetros inválidos');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'parámetros inválidos' });
    });
  });

  describe('getTimeTrackingAnalysis', () => {
    it('200 y default group_by="day"', async () => {
      const res = mockRes();
      const req = { query: { user_id: 'u1', project_id: 'p1' } };
      serviceMocks.getTimeTrackingAnalysisServices.mockResolvedValue({ buckets: [] });

      await getTimeTrackingAnalysis(req, res);

      expect(serviceMocks.getTimeTrackingAnalysisServices).toHaveBeenCalledWith({
        user_id: 'u1',
        project_id: 'p1',
        start_date: null,
        end_date: null,
        group_by: 'day',
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        group_by: 'day',
        analysis: { buckets: [] },
      });
    });

    it('respeta group_by si viene en query', async () => {
      const res = mockRes();
      const req = { query: { group_by: 'week' } };
      serviceMocks.getTimeTrackingAnalysisServices.mockResolvedValue({ x: 1 });

      await getTimeTrackingAnalysis(req, res);

      expect(serviceMocks.getTimeTrackingAnalysisServices).toHaveBeenCalledWith({
        user_id: null,
        project_id: null,
        start_date: null,
        end_date: null,
        group_by: 'week',
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        group_by: 'week',
        analysis: { x: 1 },
      });
    });

    it('error -> 500', async () => {
      const res = mockRes();
      const req = { query: {} };
      serviceMocks.getTimeTrackingAnalysisServices.mockRejectedValue(new Error('boom'));

      await getTimeTrackingAnalysis(req, res);

      expect(loggerMock.error).toHaveBeenCalledWith('getTimeTrackingAnalysis:', 'boom');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });
  });

  describe('getUserRanking', () => {
    it('400 si Joi invalida query', async () => {
      const res = mockRes();
      const req = { query: {} };
      schemaMocks.rankingQuery.validate.mockReturnValueOnce({
        error: { details: [{ message: '"start_date" es requerido' }] },
      });

      await getUserRanking(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Parametros no validos',
        details: ['"start_date" es requerido'],
      });
      expect(serviceMocks.getUserRankingServices).not.toHaveBeenCalled();
    });

    it('200 con ranking cuando Joi ok (y castea limit/offset)', async () => {
      const res = mockRes();
      const req = {
        query: { start_date: '2025-01-01', end_date: '2025-01-31', limit: '5', offset: '2' },
      };
      serviceMocks.getUserRankingServices.mockResolvedValue([{ u: '1' }]);

      await getUserRanking(req, res);

      expect(serviceMocks.getUserRankingServices).toHaveBeenCalledWith({
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        limit: 5,
        offset: 2,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, ranking: [{ u: '1' }] });
    });

    it('error -> 500 genérico', async () => {
      const res = mockRes();
      const req = { query: { start_date: 'x', end_date: 'y' } };
      serviceMocks.getUserRankingServices.mockRejectedValue(new Error('x'));

      await getUserRanking(req, res);

      expect(loggerMock.error).toHaveBeenCalledWith('getUserRanking:', 'x');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });
  });

  describe('getProjectTimeline', () => {
    it('400 si Joi invalida', async () => {
      const res = mockRes();
      const req = { query: {} };
      schemaMocks.timelineQuery.validate.mockReturnValueOnce({
        error: { details: [{ message: '"project_id" requerido' }] },
      });

      await getProjectTimeline(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Parametros no validos',
        details: ['"project_id" requerido'],
      });
      expect(serviceMocks.getProjectTimelineServices).not.toHaveBeenCalled();
    });

    it('200 con timeline cuando Joi ok', async () => {
      const res = mockRes();
      const req = { query: { project_id: 'p1', start_date: '2025-01-01', end_date: '2025-02-01' } };
      serviceMocks.getProjectTimelineServices.mockResolvedValue([
        { date: '2025-01-01', type: 'start' },
      ]);

      await getProjectTimeline(req, res);

      expect(serviceMocks.getProjectTimelineServices).toHaveBeenCalledWith({
        project_id: 'p1',
        start_date: '2025-01-01',
        end_date: '2025-02-01',
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        timeline: [{ date: '2025-01-01', type: 'start' }],
      });
    });
  });

  describe('getWorkloadDistribution', () => {
    it('400 si Joi invalida', async () => {
      const res = mockRes();
      const req = { query: { scope: 'x' } };
      schemaMocks.workloadQuery.validate.mockReturnValueOnce({
        error: { details: [{ message: '"scope" inválido' }] },
      });

      await getWorkloadDistribution(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Parametros no validos',
        details: ['"scope" inválido'],
      });
      expect(serviceMocks.getWorkloadDistributionServices).not.toHaveBeenCalled();
    });

    it('200 con distribution y default scope="user"', async () => {
      const res = mockRes();
      const req = { query: {} };
      serviceMocks.getWorkloadDistributionServices.mockResolvedValue({ buckets: [] });

      await getWorkloadDistribution(req, res);

      expect(serviceMocks.getWorkloadDistributionServices).toHaveBeenCalledWith({
        scope: 'user',
        status: null,
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        scope: 'user',
        distribution: { buckets: [] },
      });
    });
  });

  describe('importTasksFromCSV', () => {
    it('200 pasa file y userId al servicio', async () => {
      const res = mockRes();
      const req = { file: { path: 'uploads/f.csv' }, user: { userId: 'u1' } };
      serviceMocks.importTasksFromCSVServices.mockResolvedValue({ inserted: 3, skipped: 1 });

      await importTasksFromCSV(req, res);

      expect(serviceMocks.importTasksFromCSVServices).toHaveBeenCalledWith({
        file: { path: 'uploads/f.csv' },
        userId: 'u1',
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, inserted: 3, skipped: 1 });
    });

    it('error -> 500', async () => {
      const res = mockRes();
      const req = { file: null, user: { userId: 'u1' } };
      serviceMocks.importTasksFromCSVServices.mockRejectedValue(new Error('multer fail'));

      await importTasksFromCSV(req, res);

      expect(loggerMock.error).toHaveBeenCalledWith('importTasksFromCSV:', 'multer fail');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });
  });

  describe('exportData', () => {
    it('envía binario si out.buffer y contentType', async () => {
      const res = mockRes();
      const req = { body: { type: 'productivity', format: 'xlsx', filters: { a: 1 } } };

      const buffer = Buffer.from('excel');
      serviceMocks.exportDataServices.mockResolvedValue({
        buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: 'report.xlsx',
      });

      await exportData(req, res);

      expect(serviceMocks.exportDataServices).toHaveBeenCalledWith({
        type: 'productivity',
        format: 'xlsx',
        filters: { a: 1 },
      });
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=report.xlsx',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(buffer);
    });

    it('envía csv si out.csv string', async () => {
      const res = mockRes();
      const req = { body: { type: 'ranking', format: 'csv' } };

      serviceMocks.exportDataServices.mockResolvedValue({
        csv: 'id,name\n1,A',
        filename: 'ranking.csv',
      });

      await exportData(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=ranking.csv',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('id,name\n1,A');
    });

    it('retorna json normal si no hay buffer/csv', async () => {
      const res = mockRes();
      const req = { body: {} };

      serviceMocks.exportDataServices.mockResolvedValue({ ok: true });

      await exportData(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: { ok: true } });
    });

    it('error -> 500', async () => {
      const res = mockRes();
      const req = { body: {} };

      serviceMocks.exportDataServices.mockRejectedValue(new Error('err'));

      await exportData(req, res);

      expect(loggerMock.error).toHaveBeenCalledWith('exportData:', 'err');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });
  });
});
