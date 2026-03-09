import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware.js'
import TaskService from './task.service.js'
import { successResponse } from '../../common/utils/response.js'
import {
  createTaskSchema,
  updateTaskSchema,
  projectParamsSchema,
  taskParamsSchema,
  taskFilterSchema
} from './task.schema.js'

export class TaskController {

  static async getMyTasksInProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = projectParamsSchema.parse(req.params)
      const filters = taskFilterSchema.parse(req.query)
      const result = await TaskService.getMyTasksInProject(
        req.user!.userId,
        projectId,
        req.user!.role,
        filters
      )
      res.json(successResponse(result.data, result.meta))
    } catch (error) {
      next(error)
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = projectParamsSchema.parse(req.params)
      const data = createTaskSchema.parse(req.body)
      const task = await TaskService.create(
        projectId,
        req.user!.userId,
        req.user!.role,
        data
      )
      res.status(201).json(successResponse(task))
    } catch (error) {
      next(error)
    }
  }

  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = projectParamsSchema.parse(req.params)
      const filters = taskFilterSchema.parse(req.query)
      const result = await TaskService.getAll(
        projectId,
        req.user!.userId,
        req.user!.role,
        filters
      )
      res.json(successResponse(result.data, result.meta))
    } catch (error) {
      next(error)
    }
  }

  static async getOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId, taskId } = taskParamsSchema.parse(req.params)
      const task = await TaskService.getOne(
        projectId,
        taskId,
        req.user!.userId,
        req.user!.role
      )
      res.json(successResponse(task))
    } catch (error) {
      next(error)
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId, taskId } = taskParamsSchema.parse(req.params)
      const data = updateTaskSchema.parse(req.body)
      const task = await TaskService.update(
        projectId,
        taskId,
        req.user!.userId,
        req.user!.role,
        data
      )
      res.json(successResponse(task))
    } catch (error) {
      next(error)
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId, taskId } = taskParamsSchema.parse(req.params)
      await TaskService.delete(
        projectId,
        taskId,
        req.user!.userId,
        req.user!.role
      )
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

}