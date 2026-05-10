import { Router, Request, Response, NextFunction } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import ChecklistService from './checklist.service.js'

const checklistRouter = Router()
checklistRouter.use(authMiddleware)

checklistRouter.get(
  '/:projectId/tasks/:taskId/checklist',
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const data = await ChecklistService.getAll(
        req.params.projectId,
        req.params.taskId,
        req.user.userId,
        req.user.role
      )
      res.json({ success: true, data })
    } catch (err) {
      next(err)
    }
  }
)

checklistRouter.post(
  '/:projectId/tasks/:taskId/checklist',
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const item = await ChecklistService.create(
        req.params.projectId,
        req.params.taskId,
        req.user.userId,
        req.user.role,
        req.body.text
      )
      res.status(201).json({ success: true, data: item })
    } catch (err) {
      next(err)
    }
  }
)

checklistRouter.patch(
  '/:projectId/tasks/:taskId/checklist/:itemId',
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const item = await ChecklistService.update(
        req.params.projectId,
        req.params.taskId,
        req.params.itemId,
        req.user.userId,
        req.user.role,
        req.body
      )
      res.json({ success: true, data: item })
    } catch (err) {
      next(err)
    }
  }
)

checklistRouter.delete(
  '/:projectId/tasks/:taskId/checklist/:itemId',
  async (req: any, res: Response, next: NextFunction) => {
    try {
      await ChecklistService.delete(
        req.params.projectId,
        req.params.taskId,
        req.params.itemId,
        req.user.userId,
        req.user.role
      )
      res.json({ success: true })
    } catch (err) {
      next(err)
    }
  }
)

export { checklistRouter }