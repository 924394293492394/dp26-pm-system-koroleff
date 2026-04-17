import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { ProfileController } from './profile.controller.js'

const profileRouter = Router()
profileRouter.use(authMiddleware)

// Профиль текущего пользователя
profileRouter.get('/', ProfileController.getMy)
profileRouter.patch('/', ProfileController.updateMy)

// Поиск пользователей
profileRouter.get('/users/search', ProfileController.searchUsers)

// Публичный профиль
profileRouter.get('/users/:userId', ProfileController.getPublic)

// Adminка
profileRouter.get('/system/users', ProfileController.getUsers)
profileRouter.patch('/system/users/:userId', ProfileController.adminUpdate)

export { profileRouter }