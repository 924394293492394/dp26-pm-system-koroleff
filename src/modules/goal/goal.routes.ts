import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { GoalController } from './goal.controller.js'

const goalRouter = Router()
goalRouter.use(authMiddleware)

goalRouter.get('/:projectId/goals/my', GoalController.getMyGoals)
goalRouter.post('/:projectId/goals', GoalController.create)
goalRouter.get('/:projectId/goals', GoalController.getAll)
goalRouter.get('/:projectId/goals/:goalId', GoalController.getOne)
goalRouter.patch('/:projectId/goals/:goalId', GoalController.update)
goalRouter.patch('/:projectId/goals/:goalId/status', GoalController.updateStatus)
goalRouter.patch('/:projectId/goals/:goalId/responsible', GoalController.updateResponsible)
goalRouter.delete('/:projectId/goals/:goalId', GoalController.delete)
goalRouter.post('/:projectId/goals/:goalId/pin', GoalController.pinGoal)
goalRouter.delete('/:projectId/goals/:goalId/pin', GoalController.unpinGoal)

export { goalRouter }

const globalGoalRouter = Router()
globalGoalRouter.use(authMiddleware)
globalGoalRouter.get('/', GoalController.getAllGlobal)

export { globalGoalRouter }