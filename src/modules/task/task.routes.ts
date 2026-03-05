import { Router } from 'express'
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js'
import { TaskController } from './task.controller.js'

const taskRouter = Router()

taskRouter.use(authMiddleware)

taskRouter.get(
  '/system/tasks',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  TaskController.getSystemTasks
)
taskRouter.get('/:projectId/tasks/my', TaskController.getMyTasksInProject)
taskRouter.post('/:projectId/tasks', TaskController.create)
taskRouter.get('/:projectId/tasks', TaskController.getAll)
taskRouter.get('/:projectId/tasks/:taskId', TaskController.getOne)
taskRouter.patch('/:projectId/tasks/:taskId', TaskController.update)
taskRouter.delete('/:projectId/tasks/:taskId', TaskController.delete)

export { taskRouter }