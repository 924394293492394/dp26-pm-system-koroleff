import { z } from 'zod'

export const commentParamsSchema = z.object({
    projectId: z.string().uuid(),
    taskId: z.string().uuid(),
    commentId: z.string().uuid().optional()
})

export const createCommentSchema = z.object({
    text: z.string().min(1).max(5000)
})

export const updateCommentSchema = z.object({
    text: z.string().min(1).max(5000).optional()
})

export const commentQuerySchema = z.object({
    search: z.string().optional(),
    userId: z.string().uuid().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20)
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>
export type CommentQuery = z.infer<typeof commentQuerySchema>