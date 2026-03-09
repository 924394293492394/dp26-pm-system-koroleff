import { prisma } from '../../lib/prisma.js';
import LogService from '../../log/log.service.js';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectFilterInput
} from './project.schema.js';
import { AppError } from '../../middleware/error.middleware.js';

class ProjectService {

  private static isAdmin(role: string) {
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  }

  private static async assertProjectAccess(
    projectId: string,
    userId: string,
    role: string
  ) {
    if (this.isAdmin(role)) return;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        isDeleted: false,
        OR: [
          { createdBy: userId },
          {
            members: {
              some: { userId }
            }
          }
        ]
      }
    });

    if (!project) {
      throw new AppError('FORBIDDEN', 'Access denied or project not found', 403);
    }
  }

  private static async assertOwner(
    projectId: string,
    userId: string,
    role: string
  ) {
    if (this.isAdmin(role)) return;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        createdBy: userId,
        isDeleted: false
      }
    });

    if (!project) {
      throw new AppError('FORBIDDEN', 'Only project owner can modify project', 403);
    }
  }

  static async create(
    userId: string,
    data: CreateProjectInput
  ) {
    const project = await prisma.project.create({
      data: {
        ...data,
        createdBy: userId,
        members: {
          create: {
            userId,
            role: 'OWNER'
          }
        }
      }
    })

    await LogService.logAction(userId, 'CREATE_PROJECT', 'Project', project.id);
    return project;
  }

  static async getMyProjects(
    userId: string,
    filters: ProjectFilterInput
  ) {
    const { page, limit, search } = filters;

    const where: any = {
      isDeleted: false,
      createdBy: userId
    };

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        }
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    const total = await prisma.project.count({ where });

    return {
      projects,
      meta: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    };
  }

  static async getAll(
    userId: string,
    role: string,
    filters: ProjectFilterInput
  ) {
    const { page, limit, search } = filters;

    const where: any = {
      isDeleted: false
    };

    if (!this.isAdmin(role)) {
      where.OR = [
        { createdBy: userId },
        {
          members: {
            some: { userId }
          }
        }
      ];
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        }
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    const total = await prisma.project.count({ where });

    return {
      projects,
      meta: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    };
  }

  static async getById(
    userId: string,
    role: string,
    projectId: string
  ) {
    await this.assertProjectAccess(projectId, userId, role);

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        isDeleted: false
      }
    });

    if (!project) {
      throw new AppError('NOT_FOUND', 'Project not found', 404);
    }

    return project;
  }

  static async update(
    userId: string,
    role: string,
    projectId: string,
    data: UpdateProjectInput
  ) {
    await this.assertOwner(projectId, userId, role);

    const project = await prisma.project.update({
      where: { id: projectId },
      data
    });

    await LogService.logAction(userId, 'UPDATE_PROJECT', 'Project', projectId);
    return project;
  }

  static async archive(
    userId: string,
    role: string,
    projectId: string
  ) {
    await this.assertOwner(projectId, userId, role);

    const project = await prisma.project.update({
      where: { id: projectId },
      data: { isArchived: true }
    });

    await LogService.logAction(userId, 'ARCHIVE_PROJECT', 'Project', projectId);
    return project;
  }

  static async unarchive(
    userId: string,
    role: string,
    projectId: string
  ) {
    await this.assertOwner(projectId, userId, role);

    const project = await prisma.project.update({
      where: { id: projectId },
      data: { isArchived: false }
    });

    await LogService.logAction(userId, 'UNARCHIVE_PROJECT', 'Project', projectId);
    return project;
  }

  static async delete(
    userId: string,
    role: string,
    projectId: string
  ) {
    await this.assertOwner(projectId, userId, role);

    await prisma.project.update({
      where: { id: projectId },
      data: {
        isDeleted: true
      }
    });

    await LogService.logAction(userId, 'DELETE_PROJECT', 'Project', projectId);
  }
}

export default ProjectService;