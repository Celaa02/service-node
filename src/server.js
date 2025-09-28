import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import YAML from 'yamljs';
import swaggerUi from 'swagger-ui-express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { connectDB } from './config/database.js';
import logger from './utils/logger.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import taskRoutes from './routes/tasks.js';
import reportRoutes from './routes/reports.js';
import projectRoutes from './routes/project.js';
import notificationRoutes from './routes/notifications.js';

import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const docPath = path.resolve(__dirname, '../docs/openapi.yaml');
const swaggerDocument = YAML.load(docPath);

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }));
app.get('/docs.json', (_req, res) => res.json(swaggerDocument));
app.use('/api', rateLimiter);

await connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const server = http.createServer(app);
export const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH'] },
});

io.use((socket, next) => {
  const userId = socket.handshake.auth?.userId;
  if (!userId) return next(new Error('unauthorized'));
  socket.data.userId = userId;
  next();
});

io.on('connection', (socket) => {
  const { userId } = socket.data;
  socket.join(`user:${userId}`);
  logger.info(`Socket conectado user:${userId}`);
  socket.on('disconnect', () => logger.info(`Socket desconectado user:${userId}`));
});

server.listen(PORT, () => {
  logger.info(`Servidor corriendo en puerto ${PORT}`);
});

export { app, server };
