import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { CommentController } from './comment.controller.js'

const commentRouter = Router({ mergeParams: true })

commentRouter.use(authMiddleware)

commentRouter.post('/:projectId/tasks/:taskId/comments', CommentController.create)
commentRouter.get('/:projectId/tasks/:taskId/comments', CommentController.getAll)
commentRouter.patch('/:projectId/tasks/:taskId/comments/:commentId', CommentController.update)
commentRouter.delete('/:projectId/tasks/:taskId/comments/:commentId', CommentController.delete)

export { commentRouter }