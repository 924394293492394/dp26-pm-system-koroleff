import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { ProjectController } from './project.controller.js'

const projectRouter = Router()

projectRouter.use(authMiddleware)

projectRouter.post('/', ProjectController.create)
projectRouter.get('/', ProjectController.getAll)
projectRouter.get('/:id', ProjectController.getById)
projectRouter.patch('/:id', ProjectController.update)
projectRouter.delete('/:id', ProjectController.delete)

export { projectRouter };