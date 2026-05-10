import { Router, Response, NextFunction } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../middleware/error.middleware.js'

const VALID_LINK_TYPES = ['GIT_BRANCH', 'PULL_REQUEST', 'EXTERNAL_URL', 'FIGMA', 'NOTION', 'JIRA']

const linkRouter = Router()
linkRouter.use(authMiddleware)

linkRouter.get(
  '/:projectId/tasks/:taskId/links',
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const data = await prisma.taskLink.findMany({
        where: { taskId: req.params.taskId, isDeleted: false },
        include: {
          creator: { select: { id: true, login: true } }
        },
        orderBy: { createdAt: 'asc' }
      })
      res.json({ success: true, data })
    } catch (err) {
      next(err)
    }
  }
)

linkRouter.post(
  '/:projectId/tasks/:taskId/links',
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { url, label, type } = req.body

      if (!url || !url.trim()) {
        throw new AppError('VALIDATION', 'URL is required', 400)
      }

      const linkType = type && VALID_LINK_TYPES.includes(type) ? type : 'EXTERNAL_URL'

      const link = await prisma.taskLink.create({
        data: {
          taskId:    req.params.taskId,
          url:       url.trim(),
          label:     label?.trim() || null,
          type:      linkType,
          createdBy: req.user.userId,
        },
        include: {
          creator: { select: { id: true, login: true } }
        }
      })

      res.status(201).json({ success: true, data: link })
    } catch (err) {
      next(err)
    }
  }
)

linkRouter.delete(
  '/:projectId/tasks/:taskId/links/:linkId',
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const link = await prisma.taskLink.findFirst({
        where: { id: req.params.linkId, taskId: req.params.taskId, isDeleted: false }
      })

      if (!link) {
        throw new AppError('NOT_FOUND', 'Link not found', 404)
      }

      await prisma.taskLink.update({
        where: { id: req.params.linkId },
        data:  { isDeleted: true }
      })

      res.json({ success: true })
    } catch (err) {
      next(err)
    }
  }
)

export { linkRouter }