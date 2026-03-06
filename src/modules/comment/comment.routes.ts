import { Router } from 'express'
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js'
import { CommentController } from './comment.controller.js'

const commentRouter = Router({ mergeParams: true })

commentRouter.use(authMiddleware)

commentRouter.get(
    '/system/comments',
    requireRole(['ADMIN', 'SUPER_ADMIN']),
    CommentController.systemComments
)

commentRouter.post('/projects/:projectId/tasks/:taskId/comments', CommentController.create)
commentRouter.get('/projects/:projectId/tasks/:taskId/comments', CommentController.getAll)
commentRouter.get('/projects/:projectId/tasks/:taskId/comments/:commentId', CommentController.getOne)
commentRouter.patch('/projects/:projectId/tasks/:taskId/comments/:commentId', CommentController.update)
commentRouter.delete('/projects/:projectId/tasks/:taskId/comments/:commentId', CommentController.delete)

export { commentRouter }