import { z } from 'zod'

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  position: z.string().optional(),
  avatarUrl: z.string().url().optional()
})

export const userParamsSchema = z.object({
  userId: z.string().uuid()
})

export const userQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  search: z.string().optional()
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type UserQuery = z.infer<typeof userQuerySchema>