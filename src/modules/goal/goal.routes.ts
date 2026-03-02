import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { GoalController } from './goal.controller.js'

const goalRouter = Router()

goalRouter.use(authMiddleware)

goalRouter.post('/:projectId/goals', GoalController.create)
goalRouter.get('/:projectId/goals', GoalController.getAll)
goalRouter.get('/:projectId/goals/:goalId', GoalController.getOne)
goalRouter.patch('/:projectId/goals/:goalId', GoalController.update)
goalRouter.delete('/:projectId/goals/:goalId', GoalController.delete)

export { goalRouter };