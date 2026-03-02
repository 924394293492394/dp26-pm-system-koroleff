import { Response } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware.js'
import ProjectMemberService from './project-member.service.js'
import {
  addMemberSchema,
  updateMemberSchema,
  projectParamsSchema,
  memberParamsSchema
} from './project-member.schema.js'

export class ProjectMemberController {

  static async add(req: AuthRequest, res: Response) {
    try {
      const { projectId } = projectParamsSchema.parse(req.params)
      const data = addMemberSchema.parse(req.body)

      const member = await ProjectMemberService.add(
        projectId,
        req.user!.userId,
        data
      )

      res.status(201).json(member)
    } catch (error: any) {
      res.status(400).json({ message: error.message })
    }
  }

  static async getAll(req: AuthRequest, res: Response) {
    try {
      const { projectId } = projectParamsSchema.parse(req.params)

      const members = await ProjectMemberService.getAll(
        projectId,
        req.user!.userId
      )

      res.json(members)
    } catch (error: any) {
      res.status(400).json({ message: error.message })
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const { projectId, userId } = memberParamsSchema.parse(req.params)
      const data = updateMemberSchema.parse(req.body)

      const updated = await ProjectMemberService.update(
        projectId,
        req.user!.userId,
        userId,
        data
      )

      res.json(updated)
    } catch (error: any) {
      res.status(400).json({ message: error.message })
    }
  }

  static async remove(req: AuthRequest, res: Response) {
    try {
      const { projectId, userId } = memberParamsSchema.parse(req.params)

      await ProjectMemberService.remove(
        projectId,
        req.user!.userId,
        userId
      )

      res.status(204).send()
    } catch (error: any) {
      res.status(400).json({ message: error.message })
    }
  }
}