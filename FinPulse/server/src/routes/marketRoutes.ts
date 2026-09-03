import { Router } from 'express';
import { getMarketOverviewHandler } from '../controllers/marketEventAlertController';

const router = Router();
router.get('/overview', getMarketOverviewHandler);
export default router;
