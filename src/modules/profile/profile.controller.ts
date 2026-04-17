import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware.js'
import ProfileService from './profile.service.js'
import {
  updateProfileSchema,
  userParamsSchema,
  userQuerySchema,
  userSearchQuerySchema
} from './profile.schema.js'
import { successResponse } from '../../common/utils/response.js'

export class ProfileController {

  static async getMy(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await ProfileService.getMyProfile(req.user!.userId)
      res.json(successResponse(profile))
    } catch (e) { next(e) }
  }

  static async updateMy(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = updateProfileSchema.parse(req.body)
      const profile = await ProfileService.updateMyProfile(
        req.user!.userId,
        data
      )
      res.json(successResponse(profile))
    } catch (e) { next(e) }
  }

  static async getPublic(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = userParamsSchema.parse(req.params)
      const profile = await ProfileService.getPublicProfile(
        userId,
        req.user!.role
      )
      res.json(successResponse(profile))
    } catch (e) { next(e) }
  }

  static async adminUpdate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = userParamsSchema.parse(req.params)
      const data = updateProfileSchema.parse(req.body)
      const profile = await ProfileService.adminUpdateProfile(
        req.user!.userId,
        req.user!.role,
        userId,
        data
      )
      res.json(successResponse(profile))
    } catch (e) { next(e) }
  }

  static async getUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = userQuerySchema.parse(req.query)
      const result = await ProfileService.getUsers(
        req.user!.role,
        query
      )
      res.json(successResponse(result.data, result.meta))
    } catch (e) { next(e) }
  }

  static async searchUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = userSearchQuerySchema.parse(req.query)
      const result = await ProfileService.searchUsers(query)
      res.json(successResponse(result))
    } catch (e) { next(e) }
  }
}