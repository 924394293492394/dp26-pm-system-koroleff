import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js'

const authRouter = Router();
authRouter.get('/me', authMiddleware, AuthController.me)
authRouter.post('/login', AuthController.login)
authRouter.post('/register', AuthController.register)

export { authRouter };