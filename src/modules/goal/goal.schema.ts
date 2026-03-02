import { z } from 'zod'
import { GoalStatus } from '@prisma/client'

export const projectParamsSchema = z.object({
  projectId: z.string().uuid()
})

export const goalParamsSchema = z.object({
  projectId: z.string().uuid(),
  goalId: z.string().uuid()
})

export const createGoalSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  responsibleUserId: z.string().uuid().optional()
})

export const updateGoalSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  status: z.nativeEnum(GoalStatus).optional(),
  responsibleUserId: z.string().uuid().nullable().optional()
})

export type CreateGoalInput = z.infer<typeof createGoalSchema>
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>