import { z } from 'zod'

export const registerSchema = z.object({
  login: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6)
})

export const loginSchema = z.object({
  login: z.string(),
  password: z.string()
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>