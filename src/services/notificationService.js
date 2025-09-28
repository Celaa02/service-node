import logger from '../utils/logger.js';
import { NotificationRepositoryPg } from '../infrastructure/persistence/pg/NotificationRepositoryPg.js';
import { UserRepositoryPg } from '../infrastructure/persistence/pg/UserRepositoryPg.js';

const repo = new NotificationRepositoryPg();
const userRepo = new UserRepositoryPg();

export const listNotifications = async ({ userId, page = 1, limit = 10, only_unread = false }) => {
  try {
    return await repo.listByUser({ userId, page, limit, only_unread });
  } catch (e) {
    logger.error('listNotifications:', e.message);
    throw e;
  }
};

export const markNotificationRead = async ({ userId, id }) => {
  try {
    return await repo.markRead({ userId, id });
  } catch (e) {
    logger.error('markNotificationRead:', e.message);
    throw e;
  }
};

export const markManyRead = async ({ userId, ids, all = false }) => {
  try {
    return await repo.markReadMany({ userId, ids, all });
  } catch (e) {
    logger.error('markManyRead:', e.message);
    throw e;
  }
};

export const upsertPreferences = async ({ userId, prefs }) => {
  try {
    return await repo.upsertPreferences({ userId, prefs });
  } catch (e) {
    logger.error('upsertPreferences:', e.message);
    throw e;
  }
};

export const getPreferences = async ({ userId }) => {
  try {
    return await repo.getPreferences({ userId });
  } catch (e) {
    logger.error('getPreferences:', e.message);
    throw e;
  }
};

export const upsertTemplate = async ({ type, locale = 'es', subject, html }) => {
  try {
    return await repo.upsertTemplate({ type, locale, subject, html });
  } catch (e) {
    logger.error('upsertTemplate:', e.message);
    throw e;
  }
};

export const getTemplate = async ({ type, locale = 'es' }) => {
  try {
    return await repo.getTemplate({ type, locale });
  } catch (e) {
    logger.error('getTemplate:', e.message);
    throw e;
  }
};

/**
 * Crear notificación + disparar RT/email según preferencias
 * @param {{ userId:string, type:string, title:string, body:string, metadata?:object, locale?:string, io?:import('socket.io').Server, mailer?:{send:Function} }} p
 */
export const notifyUser = async ({
  userId,
  type,
  title,
  message,
  related_id,
  is_read,
  io,
  sendMail,
}) => {
  const notif = await repo.create({ userId, type, title, message, related_id, is_read });
  try {
    if (io) io.to(`user:${userId}`).emit('notification:new', notif);
  } catch (e) {
    logger.error('notifyUser RT:', e.message);
  }
  try {
    const prefs = await repo.getPreferences({ userId });
    const emailEnabled = prefs?.email_enabled ?? true;
    if (emailEnabled) {
      const infoUser = await userRepo.getProfileById(userId);
      const subject = type;
      const tpl = `<h2>Hola {{username}}</h2><p>Tienes una nueva tarea: <b>{{title}}</b></p>`;
      const html = renderTemplate(tpl, { username: infoUser.username, title: title });
      await sendMail({ to: infoUser.email, subject, html });
    }
  } catch (e) {
    logger.error('notifyUser Email:', e.message);
  }

  return notif;
};

export const renderTemplate = (tpl, data) =>
  String(tpl).replace(/{{\s*(\w+)\s*}}/g, (_, k) => data?.[k] ?? '');
