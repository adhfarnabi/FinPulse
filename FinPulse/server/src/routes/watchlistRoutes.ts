import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getWatchlists,
  postWatchlist,
  getWatchlistById,
  removeWatchlist,
  postWatchlistItem,
  removeWatchlistItemHandler,
} from '../controllers/portfolioWatchlistAnalyticsController';

const router = Router();
router.use(requireAuth);
router.get('/', getWatchlists);
router.post('/', postWatchlist);
router.get('/:id', getWatchlistById);
router.delete('/:id', removeWatchlist);
router.post('/:id/items', postWatchlistItem);
router.delete('/:id/items/:symbol', removeWatchlistItemHandler);
export default router;
