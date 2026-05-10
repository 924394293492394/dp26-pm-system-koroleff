import { Router, Response, NextFunction } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { prisma } from '../../lib/prisma.js'

const activityRouter = Router()
activityRouter.use(authMiddleware)

activityRouter.get(
  '/:projectId/tasks/:taskId/activity',
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const page  = Math.max(1, Number(req.query.page)  || 1)
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 30))

      const [data, total] = await Promise.all([
        prisma.taskActivity.findMany({
          where: { taskId: req.params.taskId },
          include: {
            user: {
              select: {
                id: true, login: true, email: true,
                profile: { select: { firstName: true, lastName: true, avatarUrl: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip:  (page - 1) * limit,
          take:  limit,
        }),
        prisma.taskActivity.count({ where: { taskId: req.params.taskId } })
      ])

      res.json({
        success: true,
        data,
        meta: {
          total,
          pages:       Math.ceil(total / limit),
          currentPage: page,
          perPage:     limit,
        }
      })
    } catch (err) {
      next(err)
    }
  }
)

export { activityRouter }