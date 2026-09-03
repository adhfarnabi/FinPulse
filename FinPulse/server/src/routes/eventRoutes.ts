import { Router } from 'express';
import { getEvents, getRecentEventsHandler, getEventByIdHandler } from '../controllers/marketEventAlertController';

const router = Router();
router.get('/recent', getRecentEventsHandler);
router.get('/:eventId', getEventByIdHandler);
router.get('/', getEvents);
export default router;
