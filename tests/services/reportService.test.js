/* eslint-disable prettier/prettier */
import { jest } from '@jest/globals';

const loggerMock = { error: jest.fn() };
jest.unstable_mockModule('../../src/utils/logger.js', () => ({ default: loggerMock }));

const repoMock = {
  getDashboardStats: jest.fn(),
  getUserProductivity: jest.fn(),
  getProjectReport: jest.fn(),
  getTimeTrackingAnalysis: jest.fn(),
  importTasksFromCSV: jest.fn(),
  getUserRanking: jest.fn(),
  getProjectTimeline: jest.fn(),
  getWorkloadDistribution: jest.fn(),
  exportData: jest.fn(),
};
const ReportRepositoryPg = jest.fn(() => repoMock);
jest.unstable_mockModule('../../src/infrastructure/persistence/pg/ReportRepositoryPg.js', () => ({
  ReportRepositoryPg,
}));

const {
  getDashboardStatsServices,
  getUserProductivityReportServices,
  getProjectReportServices,
  getTimeTrackingAnalysisServices,
  importTasksFromCSVServices,
  getUserRankingServices,
  getProjectTimelineServices,
  getWorkloadDistributionServices,
  exportDataServices,
} = await import('../../src/services/reportService.js');

const resetAll = () => {
  jest.clearAllMocks();
  for (const k of Object.keys(repoMock)) repoMock[k].mockReset();
};

describe('reportService', () => {
  beforeEach(resetAll);

  it('getDashboardStatsServices: retorna stats y llama repo', async () => {
    repoMock.getDashboardStats.mockResolvedValue({ users: 3 });
    const out = await getDashboardStatsServices();
    expect(repoMock.getDashboardStats).toHaveBeenCalledWith();
    expect(out).toEqual({ users: 3 });
  });

  it('getDashboardStatsServices: loggea y propaga error', async () => {
    repoMock.getDashboardStats.mockRejectedValue(new Error('boom'));
    await expect(getDashboardStatsServices()).rejects.toThrow('boom');
    expect(loggerMock.error).toHaveBeenCalledWith('Error en service getDashboardStats:', 'boom');
  });

  it('getUserProductivityReportServices: pasa params y defaults', async () => {
    repoMock.getUserProductivity.mockResolvedValue({ items: [], total: 0 });
    const out = await getUserProductivityReportServices({
      start_date: '2025-01-01',
      end_date: '2025-01-31',
      limit: 25,
      offset: 5,
    });
    expect(repoMock.getUserProductivity).toHaveBeenCalledWith({
      start_date: '2025-01-01',
      end_date: '2025-01-31',
      limit: 25,
      offset: 5,
    });
    expect(out).toEqual({ items: [], total: 0 });
  });

  it('getUserProductivityReportServices: usa defaults cuando faltan', async () => {
    repoMock.getUserProductivity.mockResolvedValue({ items: [1], total: 1 });
    const out = await getUserProductivityReportServices({});
    expect(repoMock.getUserProductivity).toHaveBeenCalledWith({
      start_date: null,
      end_date: null,
      limit: 10,
      offset: 0,
    });
    expect(out).toEqual({ items: [1], total: 1 });
  });

  it('getUserProductivityReportServices: log y propaga error', async () => {
    repoMock.getUserProductivity.mockRejectedValue(new Error('x'));
    await expect(getUserProductivityReportServices({})).rejects.toThrow('x');
    expect(loggerMock.error).toHaveBeenCalledWith(
      'Error en service getUserProductivityReport:',
      'x',
    );
  });

  it('getProjectReportServices: pasa filtros', async () => {
    repoMock.getProjectReport.mockResolvedValue([{ id: 1 }]);
    const out = await getProjectReportServices({ status: 'active', owner_id: 'u1' });
    expect(repoMock.getProjectReport).toHaveBeenCalledWith({ status: 'active', owner_id: 'u1' });
    expect(out).toEqual([{ id: 1 }]);
  });

  it('getProjectReportServices: error -> log y propaga', async () => {
    repoMock.getProjectReport.mockRejectedValue(new Error('bad'));
    await expect(getProjectReportServices({})).rejects.toThrow('bad');
    expect(loggerMock.error).toHaveBeenCalledWith('Error en service getProjectReport:', 'bad');
  });

  it('getTimeTrackingAnalysisServices: params + default group_by=day', async () => {
    repoMock.getTimeTrackingAnalysis.mockResolvedValue({ ok: true });
    const out = await getTimeTrackingAnalysisServices({
      user_id: 'u1',
      project_id: 'p1',
      start_date: '2025-01-01',
      end_date: '2025-01-31',
    });
    expect(repoMock.getTimeTrackingAnalysis).toHaveBeenCalledWith({
      user_id: 'u1',
      project_id: 'p1',
      start_date: '2025-01-01',
      end_date: '2025-01-31',
      group_by: 'day',
    });
    expect(out).toEqual({ ok: true });
  });

  it('getTimeTrackingAnalysisServices: respeta group_by', async () => {
    repoMock.getTimeTrackingAnalysis.mockResolvedValue({ ok: 1 });
    await getTimeTrackingAnalysisServices({ group_by: 'week' });
    expect(repoMock.getTimeTrackingAnalysis).toHaveBeenCalledWith({
      user_id: null,
      project_id: null,
      start_date: null,
      end_date: null,
      group_by: 'week',
    });
  });

  it('getTimeTrackingAnalysisServices: error -> log y propaga', async () => {
    repoMock.getTimeTrackingAnalysis.mockRejectedValue(new Error('e'));
    await expect(getTimeTrackingAnalysisServices({})).rejects.toThrow('e');
    expect(loggerMock.error).toHaveBeenCalledWith('Error en service getTimeTrackingAnalysis:', 'e');
  });

  it('importTasksFromCSVServices: 400 si falta file (no llama repo)', async () => {
    await expect(importTasksFromCSVServices({ file: null, userId: 'u1' })).rejects.toMatchObject({
      status: 400,
      message: 'Archivo CSV requerido',
    });
    expect(repoMock.importTasksFromCSV).not.toHaveBeenCalled();
    // el catch dentro del service loggea y re-lanza
    expect(loggerMock.error).toHaveBeenCalledWith(
      'Error en service importTasksFromCSV:',
      'Archivo CSV requerido',
    );
  });

  it('importTasksFromCSVServices: llama repo con file y userId', async () => {
    repoMock.importTasksFromCSV.mockResolvedValue({ inserted: 2 });
    const out = await importTasksFromCSVServices({ file: { path: 'f.csv' }, userId: 'u1' });
    expect(repoMock.importTasksFromCSV).toHaveBeenCalledWith({
      file: { path: 'f.csv' },
      userId: 'u1',
    });
    expect(out).toEqual({ inserted: 2 });
  });

  it('importTasksFromCSVServices: error del repo -> log y propaga', async () => {
    repoMock.importTasksFromCSV.mockRejectedValue(new Error('parse fail'));
    await expect(
      importTasksFromCSVServices({ file: { path: 'f.csv' }, userId: 'u1' }),
    ).rejects.toThrow('parse fail');
    expect(loggerMock.error).toHaveBeenCalledWith(
      'Error en service importTasksFromCSV:',
      'parse fail',
    );
  });

  it('getUserRankingServices: pasa params y defaults', async () => {
    repoMock.getUserRanking.mockResolvedValue([{ u: 1 }]);
    const out = await getUserRankingServices({
      start_date: 's',
      end_date: 'e',
      limit: 5,
      offset: 2,
    });
    expect(repoMock.getUserRanking).toHaveBeenCalledWith({
      start_date: 's',
      end_date: 'e',
      limit: 5,
      offset: 2,
    });
    expect(out).toEqual([{ u: 1 }]);
  });

  it('getUserRankingServices: error -> log y propaga', async () => {
    repoMock.getUserRanking.mockRejectedValue(new Error('r'));
    await expect(getUserRankingServices({})).rejects.toThrow('r');
    expect(loggerMock.error).toHaveBeenCalledWith('Error en service getUserRanking:', 'r');
  });

  it('getProjectTimelineServices: pasa params (incluye defaults)', async () => {
    repoMock.getProjectTimeline.mockResolvedValue([{ date: 'd1' }]);
    const out = await getProjectTimelineServices({
      project_id: 'p1',
      start_date: 's',
      end_date: 'e',
    });
    expect(repoMock.getProjectTimeline).toHaveBeenCalledWith({
      project_id: 'p1',
      start_date: 's',
      end_date: 'e',
    });
    expect(out).toEqual([{ date: 'd1' }]);
  });

  it('getProjectTimelineServices: error -> log y propaga', async () => {
    repoMock.getProjectTimeline.mockRejectedValue(new Error('t'));
    await expect(getProjectTimelineServices({})).rejects.toThrow('t');
    expect(loggerMock.error).toHaveBeenCalledWith('Error en service getProjectTimeline:', 't');
  });

  it('getWorkloadDistributionServices: pasa scope default=user', async () => {
    repoMock.getWorkloadDistribution.mockResolvedValue({ buckets: [] });
    const out = await getWorkloadDistributionServices({ status: 'open' });
    expect(repoMock.getWorkloadDistribution).toHaveBeenCalledWith({
      scope: 'user',
      status: 'open',
    });
    expect(out).toEqual({ buckets: [] });
  });

  it('getWorkloadDistributionServices: error -> log y propaga', async () => {
    repoMock.getWorkloadDistribution.mockRejectedValue(new Error('w'));
    await expect(getWorkloadDistributionServices({})).rejects.toThrow('w');
    expect(loggerMock.error).toHaveBeenCalledWith('Error en service getWorkloadDistribution:', 'w');
  });

  it('exportDataServices: pasa type/format/filters y retorna', async () => {
    repoMock.exportData.mockResolvedValue({ csv: 'a,b\n1,2' });
    const out = await exportDataServices({ type: 'ranking', format: 'csv', filters: { a: 1 } });
    expect(repoMock.exportData).toHaveBeenCalledWith({
      type: 'ranking',
      format: 'csv',
      filters: { a: 1 },
    });
    expect(out).toEqual({ csv: 'a,b\n1,2' });
  });

  it('exportDataServices: error -> log y propaga', async () => {
    repoMock.exportData.mockRejectedValue(new Error('exp'));
    await expect(exportDataServices({})).rejects.toThrow('exp');
    expect(loggerMock.error).toHaveBeenCalledWith('Error en service exportData:', 'exp');
  });
});
