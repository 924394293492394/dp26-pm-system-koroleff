import { Response } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware.js'
import TaskService from './task.service.js'
import { successResponse, errorResponse } from '../../common/utils/response.js'
import {
  createTaskSchema,
  updateTaskSchema,
  projectParamsSchema,
  taskParamsSchema,
  taskFilterSchema
} from './task.schema.js'

export class TaskController {

  static async getSystemTasks(req: AuthRequest, res: Response) {
    try {

      const filters = taskFilterSchema.parse(req.query)

      const tasks = await TaskService.getSystemTasks(filters)

      res.json(successResponse(tasks))

    } catch (error: any) {

      res.status(400).json(
        errorResponse({ code: 'TASK_FETCH_FAILED', message: error.message })
      )

    }
  }

  static async getMyTasksInProject(req: AuthRequest, res: Response) {
    try {

      const { projectId } = projectParamsSchema.parse(req.params)
      const filters = taskFilterSchema.parse(req.query)

      const tasks = await TaskService.getMyTasksInProject(
        req.user!.userId,
        projectId,
        req.user!.role,
        filters
      )

      res.json(successResponse(tasks))

    } catch (error: any) {

      res.status(403).json(
        errorResponse({
          code: 'ACCESS_DENIED',
          message: error.message
        })
      )

    }
  }

  static async create(req: AuthRequest, res: Response) {
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

    } catch (error: any) {

      res.status(400).json(
        errorResponse({ code: 'TASK_CREATE_FAILED', message: error.message })
      )

    }
  }

  static async getAll(req: AuthRequest, res: Response) {
    try {

      const { projectId } = projectParamsSchema.parse(req.params)
      const filters = taskFilterSchema.parse(req.query)

      const tasks = await TaskService.getAll(
        projectId,
        req.user!.userId,
        req.user!.role,
        filters
      )

      res.json(successResponse(tasks))

    } catch (error: any) {

      res.status(400).json(
        errorResponse({ code: 'TASK_FETCH_FAILED', message: error.message })
      )

    }
  }

  static async getOne(req: AuthRequest, res: Response) {
    try {

      const { projectId, taskId } = taskParamsSchema.parse(req.params)

      const task = await TaskService.getOne(
        projectId,
        taskId,
        req.user!.userId,
        req.user!.role
      )

      res.json(successResponse(task))

    } catch (error: any) {

      res.status(404).json(
        errorResponse({ code: 'TASK_NOT_FOUND', message: error.message })
      )

    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {

      const { projectId, taskId } = taskParamsSchema.parse(req.params)
      const data = updateTaskSchema.parse(req.body)

      const updated = await TaskService.update(
        projectId,
        taskId,
        req.user!.userId,
        req.user!.role,
        data
      )

      res.json(successResponse(updated))

    } catch (error: any) {

      res.status(400).json(
        errorResponse({ code: 'TASK_UPDATE_FAILED', message: error.message })
      )

    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {

      const { projectId, taskId } = taskParamsSchema.parse(req.params)

      await TaskService.delete(
        projectId,
        taskId,
        req.user!.userId,
        req.user!.role
      )

      res.status(204).json(successResponse({}, {}))

    } catch (error: any) {

      res.status(400).json(
        errorResponse({ code: 'TASK_DELETE_FAILED', message: error.message })
      )

    }
  }

}