import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getAlertRules, postAlertRule, getAlertRuleById, patchAlertRule, removeAlertRule } from '../controllers/alertRuleController';

const router = Router();
router.use(requireAuth);
router.get('/', getAlertRules);
router.post('/', postAlertRule);
router.get('/:id', getAlertRuleById);
router.patch('/:id', patchAlertRule);
router.delete('/:id', removeAlertRule);
export default router;
