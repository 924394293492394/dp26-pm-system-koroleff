import { Response } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware.js'
import GoalService from './goal.service.js'
import {
  createGoalSchema,
  updateGoalSchema,
  projectParamsSchema,
  goalParamsSchema
} from './goal.schema.js'

export class GoalController {

  static async create(req: AuthRequest, res: Response) {
    try {
      const { projectId } = projectParamsSchema.parse(req.params)
      const data = createGoalSchema.parse(req.body)

      const goal = await GoalService.create(
        projectId,
        req.user!.userId,
        data
      )

      res.status(201).json(goal)
    } catch (error: any) {
      res.status(400).json({ message: error.message })
    }
  }

  static async getAll(req: AuthRequest, res: Response) {
    try {
      const { projectId } = projectParamsSchema.parse(req.params)

      const goals = await GoalService.getAll(
        projectId,
        req.user!.userId
      )

      res.json(goals)
    } catch (error: any) {
      res.status(400).json({ message: error.message })
    }
  }

  static async getOne(req: AuthRequest, res: Response) {
    try {
      const { projectId, goalId } = goalParamsSchema.parse(req.params)

      const goal = await GoalService.getOne(
        projectId,
        goalId,
        req.user!.userId
      )

      res.json(goal)
    } catch (error: any) {
      res.status(400).json({ message: error.message })
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const { projectId, goalId } = goalParamsSchema.parse(req.params)
      const data = updateGoalSchema.parse(req.body)

      const updated = await GoalService.update(
        projectId,
        goalId,
        req.user!.userId,
        data
      )

      res.json(updated)
    } catch (error: any) {
      res.status(400).json({ message: error.message })
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const { projectId, goalId } = goalParamsSchema.parse(req.params)

      await GoalService.delete(
        projectId,
        goalId,
        req.user!.userId
      )

      res.status(204).send()
    } catch (error: any) {
      res.status(400).json({ message: error.message })
    }
  }
}