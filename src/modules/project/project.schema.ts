import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional()
})

export const updateProjectSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  isArchived: z.boolean().optional()
})

export const projectParamsSchema = z.object({
  id: z.string().uuid()
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>