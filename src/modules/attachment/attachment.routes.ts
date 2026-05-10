import { Router, Response, NextFunction } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuid } from 'uuid'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { AttachmentController } from './attachments.controller.js'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../middleware/error.middleware.js'

const UPLOAD_DIR = path.resolve('uploads')

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })
    cb(null, UPLOAD_DIR)
  },
  filename: (_req, file, cb) => {
    const raw = file.originalname;

    try {
      // Всегда пробуем декодировать latin1 → utf8
      const decoded = Buffer.from(raw, 'latin1').toString('utf8');

      // Берём decoded если:
      // 1. В decoded появилась кириллица (значит исходник был latin1-encoded UTF-8)
      // 2. Decoded не содержит символа замены (декодирование прошло чисто)
      const decodedHasCyrillic = /[а-яёА-ЯЁ]/.test(decoded);
      const decodedIsClean = !decoded.includes('\uFFFD');
      const rawAlreadyHasCyrillic = /[а-яёА-ЯЁ]/.test(raw);

      if (!rawAlreadyHasCyrillic && decodedHasCyrillic && decodedIsClean) {
        file.originalname = decoded;
      }

    } catch {

    }

    const ext = path.extname(file.originalname) || '';
    cb(null, `${uuid()}${ext}`);
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,   // 50 МБ на файл
    files: 5,                     // максимум 5 файлов за раз
  }
})

const attachmentRouter = Router()
attachmentRouter.use(authMiddleware)

attachmentRouter.post(
  '/:projectId/tasks/:taskId/attachments',
  upload.array('files', 5),
  AttachmentController.upload
)

attachmentRouter.get(
  '/:projectId/tasks/:taskId/attachments',
  AttachmentController.getAll
)

attachmentRouter.delete(
  '/:projectId/tasks/:taskId/attachments/:attachmentId',
  AttachmentController.delete
)

//скачивание с авторизацией и правильным UTF-8 именем
attachmentRouter.get(
  '/:projectId/tasks/:taskId/attachments/:attachmentId/download',
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { attachmentId, taskId } = req.params

      const attachment = await prisma.taskAttachment.findFirst({
        where: { id: attachmentId, taskId }
      })

      if (!attachment) throw new AppError('NOT_FOUND', 'Attachment not found', 404)

      const filePath = path.join(UPLOAD_DIR, path.basename(attachment.url))
      if (!fs.existsSync(filePath)) {
        throw new AppError('FILE_NOT_FOUND', 'File not found on disk', 404)
      }

      // RFC 5987, кодирование UTF-8 имён в Content-Disposition
      const encodedName = encodeURIComponent(attachment.fileName)

      res.setHeader('Content-Type', attachment.mimeType || 'application/octet-stream')
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedName}`)
      res.setHeader('Content-Length', String(fs.statSync(filePath).size))
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition')

      fs.createReadStream(filePath).pipe(res)
    } catch (err) {
      next(err)
    }
  }
)

export { attachmentRouter }