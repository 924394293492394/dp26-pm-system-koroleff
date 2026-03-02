import { Request, Response } from 'express'
import AuthService from './auth.service.js' // Теперь это default импорт
import { AuthRequest } from '../../middleware/auth.middleware.js'
import { registerSchema, loginSchema } from './auth.schema.js'

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const data = registerSchema.parse(req.body)
      const user = await AuthService.register(data)

      res.status(201).json({
        id: user.id,
        login: user.login,
        email: user.email
      })
    } catch (error: any) {
      res.status(400).json({ message: error.message })
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const data = loginSchema.parse(req.body)
      const result = await AuthService.login(data)

      res.json(result)
    } catch (error: any) {
      res.status(400).json({ message: error.message })
    }
  }

  static async me(req: AuthRequest, res: Response) {
    try {
      const user = await AuthService.getMe(req.user!.userId)
      res.json(user)
    } catch (error: any) {
      res.status(400).json({ message: error.message })
    }
  }
}