import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getAnalyticsSummaryHandler,
  getAnalyticsPerformance,
  getAnalyticsEvents,
  getAnalyticsGainersLosers,
} from '../controllers/portfolioWatchlistAnalyticsController';

const router = Router();
router.use(requireAuth);
router.get('/summary', getAnalyticsSummaryHandler);
router.get('/performance', getAnalyticsPerformance);
router.get('/events', getAnalyticsEvents);
router.get('/gainers-losers', getAnalyticsGainersLosers);
export default router;
