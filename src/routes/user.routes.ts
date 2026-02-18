import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';
import { createUserSchema, updateUserSchema } from '../validators/userValidator';

const router = Router();
const userController = new UserController();

router.post('/', validateRequest(createUserSchema), userController.create);
router.get('/', authMiddleware, userController.findAll);
router.get('/:id', authMiddleware, userController.findById);
router.put('/:id', authMiddleware, validateRequest(updateUserSchema), userController.update);
router.delete('/:id', authMiddleware, userController.delete);

export default router;
