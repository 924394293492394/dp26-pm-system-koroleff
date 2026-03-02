import { Response } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware.js'
import ProfileService from './profile.service.js'
import { updateProfileSchema } from './profile.schema.js'

export class ProfileController {

  static async get(req: AuthRequest, res: Response) {
    try {
      const profile = await ProfileService.get(req.user!.userId)
      res.json(profile)
    } catch (error: any) {
      res.status(400).json({ message: error.message })
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const data = updateProfileSchema.parse(req.body)

      const profile = await ProfileService.update(
        req.user!.userId,
        data
      )

      res.json(profile)
    } catch (error: any) {
      res.status(400).json({ message: error.message })
    }
  }
}