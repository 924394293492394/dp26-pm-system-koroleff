import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { ProfileController } from './profile.controller.js'

const profileRouter = Router()
profileRouter.use(authMiddleware)

profileRouter.get('/', ProfileController.getMy)
profileRouter.patch('/', ProfileController.updateMy)
profileRouter.get('/users/search', ProfileController.searchUsers)
profileRouter.get('/users/:userId', ProfileController.getPublic)
profileRouter.get('/system/users', ProfileController.getUsers)
profileRouter.patch('/system/users/:userId', ProfileController.adminUpdate)

export { profileRouter }