import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  list,
  markRead,
  markMany,
  getUserPrefs,
  putUserPrefs,
  upsertEmailTemplate,
} from '../controllers/notificationController.js';

const router = Router();

router.use(authenticateToken);

router.get('/', list);

router.patch('/:id/read', markRead);

router.patch('/read-many', markMany);

router.get('/preferences/me', getUserPrefs);
router.put('/preferences/me', putUserPrefs);

router.post('/templates', authenticateToken, upsertEmailTemplate);

export default router;
