import express from 'express';
import { getProjectStats } from '../controllers/projectController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/:id/stats', authenticateToken, getProjectStats);

export default router;
