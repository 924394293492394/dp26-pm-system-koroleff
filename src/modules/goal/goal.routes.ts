import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { GoalController } from './goal.controller.js'

const goalRouter = Router()

goalRouter.use(authMiddleware)

goalRouter.get('/:projectId/goals/my', GoalController.getMyGoals)
goalRouter.get('/:projectId/goals', GoalController.getAll)
goalRouter.get('/:projectId/goals/:goalId', GoalController.getOne)
goalRouter.patch('/:projectId/goals/:goalId', GoalController.update)
goalRouter.patch('/:projectId/goals/:goalId/status', GoalController.updateStatus) // 50n50 mb del
goalRouter.patch('/:projectId/goals/:goalId/responsible', GoalController.updateResponsible) // 50n50 mb del
goalRouter.delete('/:projectId/goals/:goalId', GoalController.delete)

export { goalRouter }

//          cm-07/03/2026 Korolev E.V.
//  реализован модуль на 9/10! (все предусмотрено).
//  Возможно, надо будет сделать универсальные патч на изменение любого поля в целях