import { Router } from 'express'
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js'
import { ProjectMemberController } from './project-member.controller.js'

const projectMemberRouter = Router()

projectMemberRouter.use(authMiddleware)

projectMemberRouter.get(
    '/system/project-members',
    requireRole(['ADMIN', 'SUPER_ADMIN']),
    ProjectMemberController.getSystemMembers
)

projectMemberRouter.get('/:projectId/members/me', ProjectMemberController.getMyMembership)
projectMemberRouter.post('/:projectId/members', requireRole(['OWNER', 'MANAGER']), ProjectMemberController.add)
projectMemberRouter.get('/:projectId/members', ProjectMemberController.getAll)
projectMemberRouter.get('/:projectId/members/:userId', ProjectMemberController.getOne)
projectMemberRouter.patch('/:projectId/members/:userId', requireRole(['OWNER', 'MANAGER']), ProjectMemberController.update)
projectMemberRouter.delete('/:projectId/members/:userId', requireRole(['OWNER', 'MANAGER']), ProjectMemberController.remove)
projectMemberRouter.post('/:projectId/members/leave', ProjectMemberController.leaveProject)

export { projectMemberRouter }