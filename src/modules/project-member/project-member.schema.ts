import { z } from 'zod'
import { ProjectRole } from '@prisma/client'

export const projectParamsSchema = z.object({
  projectId: z.string().uuid()
})

export const memberParamsSchema = z.object({
  projectId: z.string().uuid(),
  userId: z.string().uuid()
})

export const addMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.nativeEnum(ProjectRole).optional()
})

export const updateMemberSchema = z.object({
  role: z.nativeEnum(ProjectRole)
})

export const memberFilterSchema = z.object({
  role: z.nativeEnum(ProjectRole).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10)

})

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10)
})

export type AddMemberInput = z.infer<typeof addMemberSchema>
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>
export type MemberFilterInput = z.infer<typeof memberFilterSchema>