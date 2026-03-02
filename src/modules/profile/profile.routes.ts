import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { ProfileController } from './profile.controller.js'

const profileRouter = Router()

profileRouter.use(authMiddleware)

profileRouter.get('/', ProfileController.get)
profileRouter.patch('/', ProfileController.update)

export { profileRouter };