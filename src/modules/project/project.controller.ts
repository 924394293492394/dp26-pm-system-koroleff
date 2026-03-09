import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware.js';
import ProjectService from './project.service.js';
import {
  createProjectSchema,
  updateProjectSchema,
  projectParamsSchema,
  projectFilterSchema
} from './project.schema.js';
import { successResponse, errorResponse } from '../../common/utils/response.js';
import { AppError } from '../../middleware/error.middleware.js';

export class ProjectController {

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = createProjectSchema.parse(req.body);
      const project = await ProjectService.create(req.user!.userId, data);
      res.status(201).json(successResponse(project));
    } catch (error: any) {
      next(error);
    }
  }

  static async getMyProjects(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = projectFilterSchema.parse(req.query);
      const projects = await ProjectService.getMyProjects(req.user!.userId, filters);
      res.json(successResponse(projects));
    } catch (error: any) {
      next(error);
    }
  }

  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = projectFilterSchema.parse(req.query);
      const projects = await ProjectService.getAll(req.user!.userId, req.user!.role, filters);
      res.json(successResponse(projects));
    } catch (error: any) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = projectParamsSchema.parse(req.params);
      const project = await ProjectService.getById(req.user!.userId, req.user!.role, id);
      res.json(successResponse(project));
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json(errorResponse({ code: error.code, message: error.message }));
      }
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = projectParamsSchema.parse(req.params);
      const data = updateProjectSchema.parse(req.body);
      const project = await ProjectService.update(req.user!.userId, req.user!.role, id, data);
      res.json(successResponse(project));
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json(errorResponse({ code: error.code, message: error.message }));
      }
      next(error);
    }
  }

  static async archive(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = projectParamsSchema.parse(req.params);
      const project = await ProjectService.archive(req.user!.userId, req.user!.role, id);
      res.json(successResponse(project));
    } catch (error: any) {
      next(error);
    }
  }

  static async unarchive(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = projectParamsSchema.parse(req.params);
      const project = await ProjectService.unarchive(req.user!.userId, req.user!.role, id);
      res.json(successResponse(project));
    } catch (error: any) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = projectParamsSchema.parse(req.params);
      await ProjectService.delete(req.user!.userId, req.user!.role, id);
      res.status(204).json(successResponse({}, {}));
    } catch (error: any) {
      next(error);
    }
  }
}