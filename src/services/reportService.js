import { ReportRepositoryPg } from '../infrastructure/persistence/pg/ReportRepositoryPg.js';
import logger from '../utils/logger.js';

const repo = new ReportRepositoryPg();

export const getDashboardStatsServices = async () => {
  try {
    return await repo.getDashboardStats();
  } catch (err) {
    logger.error('Error en service getDashboardStats:', err.message);
    throw err;
  }
};

export const getUserProductivityReportServices = async ({
  start_date = null,
  end_date = null,
  limit = 10,
  offset = 0,
}) => {
  try {
    return await repo.getUserProductivity({ start_date, end_date, limit, offset });
  } catch (err) {
    logger.error('Error en service getUserProductivityReport:', err.message);
    throw err;
  }
};

export const getProjectReportServices = async ({ status = null, owner_id = null }) => {
  try {
    return await repo.getProjectReport({ status, owner_id });
  } catch (err) {
    logger.error('Error en service getProjectReport:', err.message);
    throw err;
  }
};

export const getTimeTrackingAnalysisServices = async ({
  user_id = null,
  project_id = null,
  start_date = null,
  end_date = null,
  group_by = 'day',
}) => {
  try {
    return await repo.getTimeTrackingAnalysis({
      user_id,
      project_id,
      start_date,
      end_date,
      group_by,
    });
  } catch (err) {
    logger.error('Error en service getTimeTrackingAnalysis:', err.message);
    throw err;
  }
};

export const importTasksFromCSVServices = async ({ file, userId }) => {
  try {
    if (!file) {
      const e = new Error('Archivo CSV requerido');
      e.status = 400;
      throw e;
    }
    return await repo.importTasksFromCSV({ file, userId });
  } catch (err) {
    logger.error('Error en service importTasksFromCSV:', err.message);
    throw err;
  }
};

export const getUserRankingServices = async ({
  start_date = null,
  end_date = null,
  limit = 10,
  page = 1,
}) => {
  try {
    return await repo.getUserRanking({ start_date, end_date, limit, page });
  } catch (err) {
    logger.error('Error en service getUserRanking:', err.message);
    throw err;
  }
};

export const getProjectTimelineServices = async ({
  project_id = null,
  start_date = null,
  end_date = null,
}) => {
  try {
    return await repo.getProjectTimeline({ project_id, start_date, end_date });
  } catch (err) {
    logger.error('Error en service getProjectTimeline:', err.message);
    throw err;
  }
};

export const getWorkloadDistributionServices = async ({ scope = 'user', status = null }) => {
  try {
    return await repo.getWorkloadDistribution({ scope, status });
  } catch (err) {
    logger.error('Error en service getWorkloadDistribution:', err.message);
    throw err;
  }
};

export const exportDataServices = async ({
  type = 'productivity',
  format = 'csv',
  filters = {},
}) => {
  try {
    return await repo.exportData({ type, format, filters });
  } catch (err) {
    logger.error('Error en service exportData:', err.message);
    throw err;
  }
};
