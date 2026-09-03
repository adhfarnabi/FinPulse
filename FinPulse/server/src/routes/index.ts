import { Router } from 'express';
import authRoutes from './authRoutes';
import stockRoutes from './stockRoutes';
import marketRoutes from './marketRoutes';
import eventRoutes from './eventRoutes';
import alertRoutes from './alertRoutes';
import alertRuleRoutes from './alertRuleRoutes';
import portfolioRoutes from './portfolioRoutes';
import watchlistRoutes from './watchlistRoutes';
import analyticsRoutes from './analyticsRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/stocks', stockRoutes);
router.use('/market', marketRoutes);
router.use('/events', eventRoutes);
router.use('/alerts', alertRoutes);
router.use('/alert-rules', alertRuleRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/watchlists', watchlistRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
