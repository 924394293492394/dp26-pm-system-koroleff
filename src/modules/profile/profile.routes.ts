import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuid } from 'uuid'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { ProfileController } from './profile.controller.js'
import { AppError } from '../../middleware/error.middleware.js'

// ── Хранилище аватарок ──
const AVATAR_DIR = path.resolve('uploads/avatars')
if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true })

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename:    (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
    cb(null, `${uuid()}${ext}`)
  }
})

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },   // 5 МБ
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new AppError('INVALID_TYPE', 'Разрешены только изображения', 400) as any)
    }
  }
})

const profileRouter = Router()
profileRouter.use(authMiddleware)

// Мой профиль
profileRouter.get('/',    ProfileController.getMy)
profileRouter.patch('/',  ProfileController.updateMy)

// Загрузка аватара
profileRouter.post('/avatar',   avatarUpload.single('avatar'), ProfileController.uploadAvatar)
profileRouter.delete('/avatar', ProfileController.deleteAvatar)

// Пользователи 
profileRouter.get('/users/search',           ProfileController.searchUsers)
profileRouter.get('/users/:userId',          ProfileController.getPublic)
profileRouter.get('/system/users',           ProfileController.getUsers)
profileRouter.patch('/system/users/:userId', ProfileController.adminUpdate)

export { profileRouter }