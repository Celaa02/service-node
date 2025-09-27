import express from 'express';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  addComment,
} from '../controllers/taskController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createTaskSchema, getTasksQuerySchema } from '../services/validations/task.schema.js';

const router = express.Router();

router.post('/', authenticateToken, validate({ body: createTaskSchema }), createTask);
router.get('/', authenticateToken, validate({ query: getTasksQuerySchema }), getTasks);
router.get('/:id', authenticateToken, getTaskById);
router.put('/:id', authenticateToken, updateTask);
router.delete('/:id', authenticateToken, deleteTask);

router.post('/:id/comments', addComment);

export default router;
