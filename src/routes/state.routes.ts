import { Router } from 'express';
import { StateController } from '../controllers/StateController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const stateController = new StateController();

router.post('/init', authMiddleware, stateController.initState);
router.get('/:user_id', authMiddleware, stateController.getState);
router.get('/:user_id/can-advance', authMiddleware, stateController.canAdvance);
router.post('/:user_id/advance', authMiddleware, stateController.advanceState);
router.put('/:user_id/emotional', authMiddleware, stateController.updateEmotionalState);
router.put('/:user_id/context', authMiddleware, stateController.updateContext);
router.delete('/:user_id', authMiddleware, stateController.resetState);
router.get('/:user_id/info', authMiddleware, stateController.getPhaseInfo);

export default router;
