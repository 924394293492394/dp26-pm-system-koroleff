import { z } from 'zod'
import { ProjectRole } from '@prisma/client'

export const addMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.nativeEnum(ProjectRole).optional()
})

export const updateMemberSchema = z.object({
  role: z.nativeEnum(ProjectRole)
})

export const projectParamsSchema = z.object({
  projectId: z.string().uuid()
})

export const memberParamsSchema = z.object({
  projectId: z.string().uuid(),
  userId: z.string().uuid()
})

export type AddMemberInput = z.infer<typeof addMemberSchema>
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>