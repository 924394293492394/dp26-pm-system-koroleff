import { Response } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware.js'
import CommentService from './comment.service.js'
import {
    createCommentSchema,
    updateCommentSchema,
    commentParamsSchema
} from './comment.schema.js'

export class CommentController {

    static async create(req: AuthRequest, res: Response) {
        try {
            const { projectId, taskId } = commentParamsSchema.parse(req.params)
            const data = createCommentSchema.parse(req.body)

            const comment = await CommentService.create(
                projectId,
                taskId,
                req.user!.userId,
                data
            )

            res.status(201).json(comment)
        } catch (error: any) {
            res.status(400).json({ message: error.message })
        }
    }

    static async getAll(req: AuthRequest, res: Response) {
        try {
            const { projectId, taskId } = commentParamsSchema.parse(req.params)

            const comments = await CommentService.getAll(
                projectId,
                taskId,
                req.user!.userId
            )

            res.json(comments)
        } catch (error: any) {
            res.status(400).json({ message: error.message })
        }
    }

    static async update(req: AuthRequest, res: Response) {
        try {
            const { projectId, taskId, commentId } = commentParamsSchema.parse(req.params)
            const data = updateCommentSchema.parse(req.body)

            const updated = await CommentService.update(
                projectId,
                taskId,
                commentId!,
                req.user!.userId,
                data
            )

            res.json(updated)
        } catch (error: any) {
            res.status(400).json({ message: error.message })
        }
    }

    static async delete(req: AuthRequest, res: Response) {
        try {
            const { projectId, taskId, commentId } = commentParamsSchema.parse(req.params)

            await CommentService.delete(
                projectId,
                taskId,
                commentId!,
                req.user!.userId
            )

            res.status(204).send()
        } catch (error: any) {
            res.status(400).json({ message: error.message })
        }
    }
}