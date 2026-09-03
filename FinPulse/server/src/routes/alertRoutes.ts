import { Router } from 'express';
import { getAlerts, getRecentAlertsHandler, markAlertRead, markAlertUnread, markAllRead } from '../controllers/marketEventAlertController';

const router = Router();
router.get('/recent', getRecentAlertsHandler);
router.post('/mark-all-read', markAllRead);
router.patch('/:id/read', markAlertRead);
router.patch('/:id/unread', markAlertUnread);
router.get('/', getAlerts);
export default router;
