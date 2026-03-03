import { z } from 'zod'
import { TaskStatus, TaskPriority } from '@prisma/client'

export const projectParamsSchema = z.object({
  projectId: z.string().uuid()
})

export const taskParamsSchema = z.object({
  projectId: z.string().uuid(),
  taskId: z.string().uuid()
})

export const createTaskSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  goalId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional()
})

export const updateTaskSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  goalId: z.string().uuid().nullable().optional(),
  assignedTo: z.string().uuid().nullable().optional()
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>