import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware.js'
import GoalService from './goal.service.js'
import { createGoalSchema, 
  updateGoalSchema, 
  updateStatusSchema, 
  updateResponsibleSchema, 
  projectParamsSchema, 
  goalParamsSchema, 
  goalQuerySchema } 
  from './goal.schema.js'
import { successResponse } from '../../common/utils/response.js'

export class GoalController {
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = projectParamsSchema.parse(req.params)
      const data = createGoalSchema.parse(req.body)
      const goal = await GoalService.create(projectId, req.user!.userId, req.user!.role, data)
      res.status(201).json(successResponse(goal))
    } catch (error) {
      next(error)
    }
  }

  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = projectParamsSchema.parse(req.params)
      const filters = goalQuerySchema.parse(req.query)
      const result = await GoalService.getAll(projectId, req.user!.userId, req.user!.role, filters)
      res.json(successResponse(result.data, result.meta))
    } catch (error) {
      next(error)
    }
  }

  static async getOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId, goalId } = goalParamsSchema.parse(req.params)
      const goal = await GoalService.getOne(projectId, goalId, req.user!.userId, req.user!.role)
      res.json(successResponse(goal))
    } catch (error) {
      next(error)
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId, goalId } = goalParamsSchema.parse(req.params)
      const data = updateGoalSchema.parse(req.body)
      const goal = await GoalService.update(projectId, goalId, req.user!.userId, req.user!.role, data)
      res.json(successResponse(goal))
    } catch (error) {
      next(error)
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId, goalId } = goalParamsSchema.parse(req.params)
      await GoalService.delete(projectId, goalId, req.user!.userId, req.user!.role)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  static async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId, goalId } = goalParamsSchema.parse(req.params)
      const { status } = updateStatusSchema.parse(req.body)
      const goal = await GoalService.updateStatus(projectId, goalId, req.user!.userId, req.user!.role, status)
      res.json(successResponse(goal))
    } catch (error) {
      next(error)
    }
  }

  static async updateResponsible(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId, goalId } = goalParamsSchema.parse(req.params)
      const { responsibleUserId } = updateResponsibleSchema.parse(req.body)
      const goal = await GoalService.updateResponsible(projectId, goalId, req.user!.userId, req.user!.role, responsibleUserId)
      res.json(successResponse(goal))
    } catch (error) {
      next(error)
    }
  }

  static async getMyGoals(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = projectParamsSchema.parse(req.params)
      const goals = await GoalService.getMyGoals(projectId, req.user!.userId)
      res.json(successResponse(goals))
    } catch (error) {
      next(error)
    }
  }

  static async getSystemGoals(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await GoalService.getSystemGoals()
      res.json(successResponse(result.data, result.meta))
    } catch (error) {
      next(error)
    }
  }
}