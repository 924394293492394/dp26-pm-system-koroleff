import { Response } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware.js'
import TaskService from './task.service.js'
import {
  createTaskSchema,
  updateTaskSchema,
  projectParamsSchema,
  taskParamsSchema
} from './task.schema.js'

export class TaskController {

  static async create(req: AuthRequest, res: Response) {
    try {
      const { projectId } = projectParamsSchema.parse(req.params)
      const data = createTaskSchema.parse(req.body)

      const task = await TaskService.create(
        projectId,
        req.user!.userId,
        data
      )

      res.status(201).json(task)
    } catch (error: any) {
      res.status(400).json({ message: error.message })
    }
  }

  static async getAll(req: AuthRequest, res: Response) {
    try {
      const { projectId } = projectParamsSchema.parse(req.params)

      const tasks = await TaskService.getAll(
        projectId,
        req.user!.userId
      )

      res.json(tasks)
    } catch (error: any) {
      res.status(400).json({ message: error.message })
    }
  }

  static async getOne(req: AuthRequest, res: Response) {
    try {
      const { projectId, taskId } = taskParamsSchema.parse(req.params)

      const task = await TaskService.getOne(
        projectId,
        taskId,
        req.user!.userId
      )

      res.json(task)
    } catch (error: any) {
      res.status(400).json({ message: error.message })
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
        data
      )

      res.json(updated)
    } catch (error: any) {
      res.status(400).json({ message: error.message })
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const { projectId, taskId } = taskParamsSchema.parse(req.params)

      await TaskService.delete(
        projectId,
        taskId,
        req.user!.userId
      )

      res.status(204).send()
    } catch (error: any) {
      res.status(400).json({ message: error.message })
    }
  }
}