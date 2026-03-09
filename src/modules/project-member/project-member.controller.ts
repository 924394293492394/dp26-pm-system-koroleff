import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware.js'
import ProjectMemberService from './project-member.service.js'
import {
  addMemberSchema,
  updateMemberSchema,
  projectParamsSchema,
  memberParamsSchema,
  memberFilterSchema
} from './project-member.schema.js'
import { successResponse } from '../../common/utils/response.js'

export class ProjectMemberController {

  static async getMyMembership(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = projectParamsSchema.parse(req.params)
      const member = await ProjectMemberService.getMyMembership(
        projectId,
        req.user!.userId,
        req.user!.role
      )
      res.json(successResponse(member))
    } catch (error) {
      next(error)
    }
  }

  static async add(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = projectParamsSchema.parse(req.params)
      const data = addMemberSchema.parse(req.body)
      const member = await ProjectMemberService.add(
        projectId,
        req.user!.userId,
        req.user!.role,
        data
      )
      res.status(201).json(successResponse(member))
    } catch (error) {
      next(error)
    }
  }

  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = projectParamsSchema.parse(req.params)
      const filters = memberFilterSchema.parse(req.query)
      const members = await ProjectMemberService.getAll(
        projectId,
        req.user!.userId,
        req.user!.role,
        filters
      )
      res.json(successResponse(members))
    } catch (error) {
      next(error)
    }
  }

  static async getOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId, userId } = memberParamsSchema.parse(req.params)
      const member = await ProjectMemberService.getOne(
        projectId,
        req.user!.userId,
        req.user!.role,
        userId
      )
      res.json(successResponse(member))
    } catch (error) {
      next(error)
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId, userId } = memberParamsSchema.parse(req.params)
      const data = updateMemberSchema.parse(req.body)
      const member = await ProjectMemberService.update(
        projectId,
        req.user!.userId,
        req.user!.role,
        userId,
        data
      )
      res.json(successResponse(member))
    } catch (error) {
      next(error)
    }
  }

  static async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId, userId } = memberParamsSchema.parse(req.params)
      await ProjectMemberService.remove(
        projectId,
        req.user!.userId,
        req.user!.role,
        userId
      )
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  static async leaveProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = projectParamsSchema.parse(req.params)
      await ProjectMemberService.leaveProject(
        projectId,
        req.user!.userId,
        req.user!.role
      )
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

}