import { Router } from 'express';
import { MessageController } from '../controllers/MessageController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const messageController = new MessageController();

router.post('/process', authMiddleware, messageController.process);
router.post('/analyze-intent', authMiddleware, messageController.analyzeIntent);

export default router;
