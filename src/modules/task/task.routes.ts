import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { TaskController } from './task.controller.js'

const taskRouter = Router()

taskRouter.use(authMiddleware)

taskRouter.get('/:projectId/tasks/my', TaskController.getMyTasksInProject)
taskRouter.post('/:projectId/tasks', TaskController.create)
taskRouter.get('/:projectId/tasks', TaskController.getAll)
taskRouter.get('/:projectId/tasks/:taskId', TaskController.getOne)
taskRouter.patch('/:projectId/tasks/:taskId', TaskController.update)
taskRouter.delete('/:projectId/tasks/:taskId', TaskController.delete)

export { taskRouter }

//          cm-08/03/2026 Korolev E.V.
//  доб. изменение тасков для создателя и ответственного привязанной цели
//  mb убрать {
// "success": true,
// "data": {
//     "id": "6f2f47cd-097a-4d9f-a9ef-fc3d0f864cc5",
//     "projectId": "95f9ef55-985a-4ed5-b199-51b0e9c395ce",
//     "goalId": "2a4fb6b5-3816-440f-8500-ae942554601e",
//     "createdBy": "44b8159b-11ed-43c6-8a4d-2b5ce577f06d",
//     "assignedTo": null,
//     "title": "test new task108657 with goal16756",
//     "description": "some text inner goal16756",
//     "status": "TODO",
//     "priority": "MEDIUM",
//     "createdAt": "2026-03-08T05:55:32.042Z",
//     "updatedAt": "2026-03-08T05:55:32.042Z",
//     "isDeleted": false,
//     "assignee": null
// },
// "meta": {}
//}