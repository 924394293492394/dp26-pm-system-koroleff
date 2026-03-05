import { z } from 'zod'
import { GoalStatus } from '@prisma/client'

export const projectParamsSchema = z.object({
  projectId: z.string().uuid()
})

export const goalParamsSchema = z.object({
  projectId: z.string().uuid(),
  goalId: z.string().uuid()
})

export const goalQuerySchema = z.object({
  status: z.nativeEnum(GoalStatus).optional(),
  responsibleUserId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
})

export const createGoalSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  responsibleUserId: z.string().uuid().optional()
})

export const updateGoalSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  status: z.nativeEnum(GoalStatus).optional(),
  responsibleUserId: z.string().uuid().nullable().optional()
})

export const updateStatusSchema = z.object({
  status: z.nativeEnum(GoalStatus)
})

export const updateResponsibleSchema = z.object({
  responsibleUserId: z.string().uuid().nullable()
})

export type CreateGoalInput = z.infer<typeof createGoalSchema>
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>
export type GoalQuery = z.infer<typeof goalQuerySchema>