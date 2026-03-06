import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware.js'
import CommentService from './comment.service.js'
import {
    createCommentSchema,
    updateCommentSchema,
    commentParamsSchema,
    commentQuerySchema
} from './comment.schema.js'

export class CommentController {

    static async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { projectId, taskId } = commentParamsSchema.parse(req.params)
            const data = createCommentSchema.parse(req.body)
            const comment = await CommentService.create(
                projectId,
                taskId,
                req.user!.userId,
                req.user!.role,
                data
            )
            res.status(201).json(comment)
        } catch (e) { next(e) }
    }

    static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { projectId, taskId } = commentParamsSchema.parse(req.params)
            const query = commentQuerySchema.parse(req.query)
            const comments = await CommentService.getAll(
                projectId,
                taskId,
                req.user!.userId,
                req.user!.role,
                query
            )
            res.json(comments)
        } catch (e) { next(e) }
    }

    static async getOne(req: AuthRequest, res: Response, next: NextFunction) {
        try {

            const { projectId, taskId, commentId } = commentParamsSchema.parse(req.params)
            const comment = await CommentService.getOne(
                projectId,
                taskId,
                commentId!,
                req.user!.userId,
                req.user!.role
            )
            res.json(comment)
        } catch (e) { next(e) }
    }

    static async update(req: AuthRequest, res: Response, next: NextFunction) {
        try {

            const { projectId, taskId, commentId } = commentParamsSchema.parse(req.params)
            const data = updateCommentSchema.parse(req.body)
            const updated = await CommentService.update(
                projectId,
                taskId,
                commentId!,
                req.user!.userId,
                req.user!.role,
                data
            )
            res.json(updated)
        } catch (e) { next(e) }
    }

    static async delete(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { projectId, taskId, commentId } = commentParamsSchema.parse(req.params)
            await CommentService.delete(
                projectId,
                taskId,
                commentId!,
                req.user!.userId,
                req.user!.role
            )
            res.status(204).send()
        } catch (e) { next(e) }
    }

    static async systemComments(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const query = commentQuerySchema.parse(req.query)
            const comments = await CommentService.systemComments(query)
            res.json(comments)
        } catch (e) { next(e) }
    }
}