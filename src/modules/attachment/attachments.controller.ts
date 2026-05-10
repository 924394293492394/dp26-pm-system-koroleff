import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware.js'
import AttachmentService from './attachment.service.js'

export class AttachmentController {

  static async upload(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projectId = req.params.projectId as string
      const taskId    = req.params.taskId    as string
      const { userId, role } = req.user!

      const files = req.files as Express.Multer.File[]

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'No files provided' }
        })
      }

      const attachments = await AttachmentService.upload(projectId, taskId, userId, role, files)
      res.status(201).json({ success: true, data: attachments })
    } catch (err) {
      next(err)
    }
  }

  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projectId = req.params.projectId as string
      const taskId    = req.params.taskId    as string
      const { userId, role } = req.user!

      const data = await AttachmentService.getAll(projectId, taskId, userId, role)
      res.json({ success: true, data })
    } catch (err) {
      next(err)
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projectId    = req.params.projectId    as string
      const taskId       = req.params.taskId       as string
      const attachmentId = req.params.attachmentId as string
      const { userId, role } = req.user!

      await AttachmentService.delete(projectId, taskId, attachmentId, userId, role)
      res.json({ success: true })
    } catch (err) {
      next(err)
    }
  }
}