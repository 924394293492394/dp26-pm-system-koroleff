import { z } from 'zod';

export const projectParamsSchema = z.object({
  id: z.string().uuid()
});

export const createProjectSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional()
});

export const updateProjectSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  isArchived: z.boolean().optional()
});

export const projectFilterSchema = z.object({
  search: z.string().optional(),
  sort: z.string().optional(),
  isArchived: z.preprocess((val) => {
    if (val === undefined || val === '') return undefined;
    if (val === 'true'  || val === true)  return true;
    if (val === 'false' || val === false) return false;
    return undefined;
  }, z.boolean().optional()),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10)
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectFilterInput = z.infer<typeof projectFilterSchema>;