import { Router } from 'express'
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js'
import { GoalController } from './goal.controller.js'

const goalRouter = Router()

goalRouter.use(authMiddleware)

goalRouter.get(
  '/system/goals',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  GoalController.getSystemGoals
)

goalRouter.get('/:projectId/goals/my', GoalController.getMyGoals)
goalRouter.post('/:projectId/goals', requireRole(['OWNER', 'MANAGER']), GoalController.create)
goalRouter.get('/:projectId/goals', GoalController.getAll)
goalRouter.get('/:projectId/goals/:goalId', GoalController.getOne)
goalRouter.patch('/:projectId/goals/:goalId', requireRole(['OWNER', 'MANAGER']), GoalController.update)
goalRouter.patch('/:projectId/goals/:goalId/status', requireRole(['OWNER', 'MANAGER']), GoalController.updateStatus)
goalRouter.patch('/:projectId/goals/:goalId/responsible', requireRole(['OWNER', 'MANAGER']), GoalController.updateResponsible)
goalRouter.delete('/:projectId/goals/:goalId', requireRole(['OWNER', 'MANAGER']), GoalController.delete)

export { goalRouter }