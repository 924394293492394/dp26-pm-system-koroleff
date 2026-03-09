import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { ProjectMemberController } from './project-member.controller.js'

const projectMemberRouter = Router()

projectMemberRouter.use(authMiddleware)

projectMemberRouter.get('/:projectId/members/me', ProjectMemberController.getMyMembership)
projectMemberRouter.post('/:projectId/members', ProjectMemberController.add)
projectMemberRouter.get('/:projectId/members', ProjectMemberController.getAll)
projectMemberRouter.get('/:projectId/members/:userId', ProjectMemberController.getOne)
projectMemberRouter.patch('/:projectId/members/:userId', ProjectMemberController.update)
projectMemberRouter.delete('/:projectId/members/:userId', ProjectMemberController.remove)
projectMemberRouter.post('/:projectId/members/leave', ProjectMemberController.leaveProject)

export { projectMemberRouter }

//          cm-08/03/2026 Korolev E.V.
//  реализован модуль на 12+/10, все предусмотрено.