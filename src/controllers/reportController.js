import {
  exportDataServices,
  getDashboardStatsServices,
  getProjectReportServices,
  getProjectTimelineServices,
  getTimeTrackingAnalysisServices,
  getUserProductivityReportServices,
  getUserRankingServices,
  getWorkloadDistributionServices,
  importTasksFromCSVServices,
} from '../services/reportService.js';
import logger from '../utils/logger.js';
import multer from 'multer';
import {
  rankingQuery,
  timelineQuery,
  workloadQuery,
} from '../services/validations/reports.schema.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export const upload = multer({ storage });

export const getDashboardStats = async (req, res) => {
  try {
    const stats = await getDashboardStatsServices();
    return res.json({ success: true, stats });
  } catch (err) {
    logger.error('getDashboardStats:', err.message);
    return res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : 'Error interno del servidor' });
  }
};

export const getUserProductivityReport = async (req, res) => {
  try {
    const { start_date, end_date, limit, offset } = req.query;
    const data = await getUserProductivityReportServices({
      start_date: start_date ?? null,
      end_date: end_date ?? null,
      limit: Number(limit ?? 10),
      offset: Number(offset ?? 0),
    });
    return res.json({ success: true, ...data });
  } catch (err) {
    logger.error('getUserProductivityReport:', err.message);
    return res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : 'Error interno del servidor' });
  }
};

export const getProjectReport = async (req, res) => {
  try {
    const { status, owner_id } = req.query;
    const projects = await getProjectReportServices({
      status: status ?? null,
      owner_id: owner_id ?? null,
    });
    return res.json({ success: true, projects });
  } catch (err) {
    logger.error('getProjectReport:', err.message);
    return res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : 'Error interno del servidor' });
  }
};

export const getTimeTrackingAnalysis = async (req, res) => {
  try {
    const { user_id, project_id, start_date, end_date, group_by } = req.query;
    const analysis = await getTimeTrackingAnalysisServices({
      user_id: user_id ?? null,
      project_id: project_id ?? null,
      start_date: start_date ?? null,
      end_date: end_date ?? null,
      group_by: group_by ?? 'day',
    });
    return res.json({ success: true, group_by: group_by ?? 'day', analysis });
  } catch (err) {
    logger.error('getTimeTrackingAnalysis:', err.message);
    return res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : 'Error interno del servidor' });
  }
};

export const getUserRanking = async (req, res) => {
  try {
    const { error } = rankingQuery.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Parametros no validos',
        details: error.details.map((d) => d.message),
      });
    }
    const { start_date, end_date, limit, page } = req.query;
    const ranking = await getUserRankingServices({
      start_date: start_date ?? null,
      end_date: end_date ?? null,
      limit: Number(limit ?? 10),
      page: Number(page ?? 0),
    });
    console.log('🚀 ~ getUserRanking ~ ranking:', ranking);
    return res.json({ success: true, ranking });
  } catch (err) {
    logger.error('getUserRanking:', err.message);
    return res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : 'Error interno del servidor' });
  }
};

export const getProjectTimeline = async (req, res) => {
  try {
    const { error } = timelineQuery.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Parametros no validos',
        details: error.details.map((d) => d.message),
      });
    }
    const { project_id, start_date, end_date } = req.query;
    const timeline = await getProjectTimelineServices({
      project_id: project_id ?? null,
      start_date: start_date ?? null,
      end_date: end_date ?? null,
    });
    return res.json({ success: true, timeline });
  } catch (err) {
    logger.error('getProjectTimeline:', err.message);
    return res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : 'Error interno del servidor' });
  }
};

export const getWorkloadDistribution = async (req, res) => {
  try {
    const { error } = workloadQuery.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Parametros no validos',
        details: error.details.map((d) => d.message),
      });
    }
    const { scope, status } = req.query;
    const distribution = await getWorkloadDistributionServices({
      scope: scope ?? 'user',
      status: status ?? null,
    });
    return res.json({ success: true, scope: scope ?? 'user', distribution });
  } catch (err) {
    logger.error('getWorkloadDistribution:', err.message);
    return res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : 'Error interno del servidor' });
  }
};

export const importTasksFromCSV = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user?.userId;
    const result = await importTasksFromCSVServices({ file, userId });
    return res.json({ success: true, ...result });
  } catch (err) {
    logger.error('importTasksFromCSV:', err.message);
    return res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : 'Error interno del servidor' });
  }
};

export const exportData = async (req, res) => {
  try {
    const { type = 'productivity', format = 'csv', filters = {} } = req.body || {};
    const out = await exportDataServices({ type, format, filters });

    if (out?.buffer && out?.contentType) {
      res.setHeader('Content-Type', out.contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${out.filename || `${type}.${format}`}`,
      );
      return res.status(200).send(out.buffer);
    }

    if (typeof out?.csv === 'string') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=${out.filename || `${type}.csv`}`);
      return res.status(200).send(out.csv);
    }

    return res.json({ success: true, data: out });
  } catch (err) {
    logger.error('exportData:', err.message);
    return res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : 'Error interno del servidor' });
  }
};
