import { z } from 'zod'

export const commentParamsSchema = z.object({
    projectId: z.string().uuid(),
    taskId: z.string().uuid(),
    commentId: z.string().uuid().optional()
})

export const createCommentSchema = z.object({
    text: z.string().min(1, 'Comment text is required')
})

export const updateCommentSchema = z.object({
    text: z.string().min(1).optional()
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>