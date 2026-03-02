import { z } from 'zod'

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  position: z.string().optional(),
  avatarUrl: z.string().url().optional()
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>