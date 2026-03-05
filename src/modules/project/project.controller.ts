import { Response } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware.js'
import ProjectService from './project.service.js'
import {
  createProjectSchema,
  updateProjectSchema,
  projectParamsSchema,
  projectFilterSchema
} from './project.schema.js'
import { successResponse, errorResponse } from '../../common/utils/response.js'

export class ProjectController {

  static async getSystemProjects(req: AuthRequest, res: Response) {
    try {

      const filters = projectFilterSchema.parse(req.query)

      const projects = await ProjectService.getSystemProjects(filters)

      res.json(successResponse(projects))

    } catch (error: any) {

      res.status(400).json(
        errorResponse({
          code: 'PROJECT_FETCH_FAILED',
          message: error.message
        })
      )

    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {

      const data = createProjectSchema.parse(req.body)

      const project = await ProjectService.create(
        req.user!.userId,
        data
      )

      res.status(201).json(successResponse(project))

    } catch (error: any) {

      res.status(400).json(
        errorResponse({
          code: 'PROJECT_CREATE_FAILED',
          message: error.message
        })
      )

    }
  }

  static async getMyProjects(req: AuthRequest, res: Response) {
    try {

      const filters = projectFilterSchema.parse(req.query)

      const projects = await ProjectService.getMyProjects(
        req.user!.userId,
        filters
      )

      res.json(successResponse(projects))

    } catch (error: any) {

      res.status(400).json(
        errorResponse({
          code: 'PROJECT_FETCH_FAILED',
          message: error.message
        })
      )

    }
  }

  static async getAll(req: AuthRequest, res: Response) {
    try {

      const filters = projectFilterSchema.parse(req.query)

      const projects = await ProjectService.getAll(
        req.user!.userId,
        req.user!.role,
        filters
      )

      res.json(successResponse(projects))

    } catch (error: any) {

      res.status(400).json(
        errorResponse({
          code: 'PROJECT_FETCH_FAILED',
          message: error.message
        })
      )

    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {

      const { id } = projectParamsSchema.parse(req.params)

      const project = await ProjectService.getById(
        req.user!.userId,
        req.user!.role,
        id
      )

      res.json(successResponse(project))

    } catch (error: any) {

      res.status(404).json(
        errorResponse({
          code: 'PROJECT_NOT_FOUND',
          message: error.message
        })
      )

    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {

      const { id } = projectParamsSchema.parse(req.params)
      const data = updateProjectSchema.parse(req.body)

      const project = await ProjectService.update(
        req.user!.userId,
        req.user!.role,
        id,
        data
      )

      res.json(successResponse(project))

    } catch (error: any) {

      res.status(400).json(
        errorResponse({
          code: 'PROJECT_UPDATE_FAILED',
          message: error.message
        })
      )

    }
  }

  static async archive(req: AuthRequest, res: Response) {
    try {

      const { id } = projectParamsSchema.parse(req.params)

      const project = await ProjectService.archive(
        req.user!.userId,
        req.user!.role,
        id
      )

      res.json(successResponse(project))

    } catch (error: any) {

      res.status(400).json(
        errorResponse({
          code: 'PROJECT_ARCHIVE_FAILED',
          message: error.message
        })
      )

    }
  }

  static async unarchive(req: AuthRequest, res: Response) {
    try {

      const { id } = projectParamsSchema.parse(req.params)

      const project = await ProjectService.unarchive(
        req.user!.userId,
        req.user!.role,
        id
      )

      res.json(successResponse(project))

    } catch (error: any) {

      res.status(400).json(
        errorResponse({
          code: 'PROJECT_UNARCHIVE_FAILED',
          message: error.message
        })
      )

    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {

      const { id } = projectParamsSchema.parse(req.params)

      await ProjectService.delete(
        req.user!.userId,
        req.user!.role,
        id
      )

      res.status(204).json(successResponse({}, {}))

    } catch (error: any) {

      res.status(400).json(
        errorResponse({
          code: 'PROJECT_DELETE_FAILED',
          message: error.message
        })
      )

    }
  }

}