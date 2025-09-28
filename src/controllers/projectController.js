import { getProjectStatsService } from '../services/projectService.js';
import logger from '../utils/logger.js';

export const getProjectStats = async (req, res, next) => {
  try {
    const stats = await getProjectStatsService(req.params.id);
    return res.json({ success: true, ...stats });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    logger.error('getProjectStats error:', err.message);
    next(err);
  }
};
