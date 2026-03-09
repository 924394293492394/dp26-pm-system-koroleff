import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { ProfileController } from './profile.controller.js'

const profileRouter = Router()

profileRouter.use(authMiddleware)

//users cm-09/03/2026 Korolev E.V.
profileRouter.get('/', ProfileController.getMy)
profileRouter.get('/users/:userId', ProfileController.getPublic)
profileRouter.patch('/', ProfileController.updateMy)

//adminka cm-09/03/2026 Korolev E.V.
profileRouter.get('/system/users', ProfileController.getUsers)
profileRouter.patch('/system/users/:userId', ProfileController.adminUpdate)

export { profileRouter }