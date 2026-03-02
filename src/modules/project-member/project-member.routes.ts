import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { ProjectMemberController } from './project-member.controller.js'

const projectMemberRouter = Router()

projectMemberRouter.use(authMiddleware)

projectMemberRouter.post('/:projectId/members', ProjectMemberController.add)
projectMemberRouter.get('/:projectId/members', ProjectMemberController.getAll)
projectMemberRouter.patch('/:projectId/members/:userId', ProjectMemberController.update)
projectMemberRouter.delete('/:projectId/members/:userId', ProjectMemberController.remove)

export { projectMemberRouter };