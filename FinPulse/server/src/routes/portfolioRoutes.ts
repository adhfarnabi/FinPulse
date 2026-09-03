import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getPortfolio, getPortfolioPositions, postTransaction } from '../controllers/portfolioWatchlistAnalyticsController';

const router = Router();
router.use(requireAuth);
router.get('/', getPortfolio);
router.get('/positions', getPortfolioPositions);
router.post('/transactions', postTransaction);
export default router;
