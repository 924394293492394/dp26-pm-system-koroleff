import { Response } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware.js'
import ProjectService from './project.service.js'
import {
  createProjectSchema,
  updateProjectSchema,
  projectParamsSchema
} from './project.schema.js'

export class ProjectController {

  static async create(req: AuthRequest, res: Response) {
    try {
      const data = createProjectSchema.parse(req.body)
      const project = await ProjectService.create(req.user!.userId, data)
      res.status(201).json(project)
    } catch (error: any) {
      res.status(400).json({ message: error.message })
    }
  }

  static async getAll(req: AuthRequest, res: Response) {
    try {
      const projects = await ProjectService.getAll(req.user!.userId)
      res.json(projects)
    } catch (error: any) {
      res.status(400).json({ message: error.message })
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = projectParamsSchema.parse(req.params)
      const project = await ProjectService.getById(req.user!.userId, id)
      res.json(project)
    } catch (error: any) {
      res.status(400).json({ message: error.message })
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const { id } = projectParamsSchema.parse(req.params)
      const data = updateProjectSchema.parse(req.body)

      const project = await ProjectService.update(
        req.user!.userId,
        id,
        data
      )

      res.json(project)
    } catch (error: any) {
      res.status(400).json({ message: error.message })
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = projectParamsSchema.parse(req.params)
      await ProjectService.delete(req.user!.userId, id)
      res.status(204).send()
    } catch (error: any) {
      res.status(400).json({ message: error.message })
    }
  }
}