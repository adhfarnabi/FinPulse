import { Router } from 'express';
import { getStocks, getStockBySymbol, getStockHistoryHandler } from '../controllers/stockController';

const router = Router();
router.get('/', getStocks);
router.get('/:symbol', getStockBySymbol);
router.get('/:symbol/history', getStockHistoryHandler);
export default router;
