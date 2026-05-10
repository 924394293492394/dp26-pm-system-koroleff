import { Router, Response, NextFunction } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import DashboardService from './dashboard.service.js'

const dashboardRouter = Router()
dashboardRouter.use(authMiddleware)

dashboardRouter.get('/summary', async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await DashboardService.getSummary(req.user.userId, req.user.role)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
})

export { dashboardRouter }