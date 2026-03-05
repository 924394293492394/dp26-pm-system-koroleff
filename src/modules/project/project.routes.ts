import { Router } from 'express'
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js'
import { ProjectController } from './project.controller.js'

const projectRouter = Router()

projectRouter.use(authMiddleware)

projectRouter.get(
    '/system/projects',
    requireRole(['ADMIN', 'SUPER_ADMIN']),
    ProjectController.getSystemProjects
)

projectRouter.get('/my', ProjectController.getMyProjects)
projectRouter.post('/', ProjectController.create)
projectRouter.get('/', ProjectController.getAll)
projectRouter.get('/:id', ProjectController.getById)
projectRouter.patch('/:id', ProjectController.update)
projectRouter.patch('/:id/archive', ProjectController.archive)
projectRouter.patch('/:id/unarchive', ProjectController.unarchive)
projectRouter.delete('/:id', ProjectController.delete)

export { projectRouter }