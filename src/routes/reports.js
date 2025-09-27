import express from 'express';
import {
  getDashboardStats,
  getUserProductivityReport,
  getProjectReport,
  getTimeTrackingAnalysis,
  importTasksFromCSV,
  upload,
  getUserRanking,
  getProjectTimeline,
  getWorkloadDistribution,
  exportData,
} from '../controllers/reportController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', authenticateToken, getDashboardStats);
router.get(
  '/productivity',
  authenticateToken,
  authorizeRoles('manager', 'admin'),
  getUserProductivityReport,
);
router.get('/projects', authenticateToken, getProjectReport);
router.get('/time-analysis', authenticateToken, getTimeTrackingAnalysis);
router.get('/user-ranking', authenticateToken, authorizeRoles('manager', 'admin'), getUserRanking);
router.get('/project-timeline', authenticateToken, getProjectTimeline);
router.get('/workload-distribution', authenticateToken, getWorkloadDistribution);
router.post('/import-tasks', authenticateToken, upload.single('csvFile'), importTasksFromCSV);
router.post('/export-data', authenticateToken, authorizeRoles('manager', 'admin'), exportData);

export default router;
