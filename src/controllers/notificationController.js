import {
  listQuery,
  markReadParams,
  markManyBody,
  prefsBody,
  templateBody,
} from '../services/validations/notification.schema.js';
import {
  listNotifications,
  markNotificationRead,
  markManyRead,
  upsertPreferences,
  getPreferences,
  upsertTemplate,
} from '../services/notificationService.js';
import logger from '../utils/logger.js';

export const list = async (req, res) => {
  try {
    const { error, value } = listQuery.validate(req.query);
    if (error) return res.status(400).json({ error: error.message });
    const userId = req.user?.userId;
    const { items, total } = await listNotifications({ userId, ...value });
    res.json({ success: true, items, total, page: value.page, limit: value.limit });
  } catch (e) {
    logger.error('notifications.list:', e.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const markRead = async (req, res) => {
  try {
    const { error } = markReadParams.validate(req.params);
    if (error) return res.status(400).json({ error: error.message });
    const ok = await markNotificationRead({ userId: req.user?.userId, id: req.params.id });
    if (!ok) return res.status(404).json({ error: 'No encontrada' });
    res.json({ success: true });
  } catch (e) {
    logger.error('notifications.markRead:', e.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const markMany = async (req, res) => {
  try {
    const { error, value } = markManyBody.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });
    const count = await markManyRead({ userId: req.user?.userId, ids: value.ids, all: value.all });
    res.json({ success: true, updated: count });
  } catch (e) {
    logger.error('notifications.markMany:', e.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getUserPrefs = async (req, res) => {
  try {
    const prefs = await getPreferences({ userId: req.user?.userId });
    res.json({ success: true, prefs });
  } catch (e) {
    logger.error('notifications.getUserPrefs:', e.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const putUserPrefs = async (req, res) => {
  try {
    const { error, value } = prefsBody.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });
    const prefs = await upsertPreferences({ userId: req.user?.userId, prefs: value });
    res.json({ success: true, prefs });
  } catch (e) {
    logger.error('notifications.putUserPrefs:', e.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const upsertEmailTemplate = async (req, res) => {
  try {
    const { error, value } = templateBody.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });
    const tpl = await upsertTemplate(value);
    res.json({ success: true, template: tpl });
  } catch (e) {
    logger.error('notifications.upsertEmailTemplate:', e.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
