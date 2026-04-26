import { prisma } from '../../lib/prisma.js';
import LogService from '../../log/log.service.js';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectFilterInput
} from './project.schema.js';
import { AppError } from '../../middleware/error.middleware.js';

const MAX_MEMBERS = 50;

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
    const { page, limit, search, isArchived, sort } = filters;

    const where: any = {
      isDeleted: false,
      createdBy: userId
    };

    if (typeof isArchived === 'boolean') {
      where.isArchived = isArchived;
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

    const orderBy = sort === "activity_desc"
      ? ({ updatedAt: "desc" } as const)
      : sort === "activity_asc"
        ? ({ updatedAt: "asc" } as const)
        : sort === "createdAt_asc"
          ? ({ createdAt: "asc" } as const)
          : ({ createdAt: "desc" } as const);

    const projects = await prisma.project.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      include: {
        members: {
          where: { userId },
          select: { role: true }
        },
        _count: {
          select: {
            members: true,
            tasks: { where: { isDeleted: false } },
            goals: { where: { isDeleted: false } },
          }
        }
      }
    });

    const total = await prisma.project.count({ where });

    return {
      projects: projects.map(p => ({
        ...p,
        role: p.members[0]?.role || 'VIEWER',
        membersCount: p._count.members,
        tasksCount: p._count.tasks,
        goalsCount: p._count.goals
      })),
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
    const { page, limit, search, isArchived, sort } = filters;

    const where: any = {
      isDeleted: false
    };

    if (typeof isArchived === 'boolean') {
      where.isArchived = isArchived;
    }

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

    const orderBy =
      sort === "activity_desc" ? ({ updatedAt: "desc" } as const) :
        sort === "activity_asc" ? ({ updatedAt: "asc" } as const) :
          sort === "createdAt_asc" ? ({ createdAt: "asc" } as const) :
            ({ createdAt: "desc" } as const);

    const projects = await prisma.project.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      include: {
        members: {
          where: { userId },
          select: { role: true }
        },
        _count: {
          select: {
            members: true,
            tasks: { where: { isDeleted: false } },
            goals: { where: { isDeleted: false } },
          }
        }
      }
    });

    const total = await prisma.project.count({ where });

    return {
      projects: projects.map(p => ({
        ...p,
        role: p.members[0]?.role || 'VIEWER',
        membersCount: p._count.members,
        tasksCount: p._count.tasks,
        goalsCount: p._count.goals
      })),
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
      where: { id: projectId, isDeleted: false },
      include: {
        members: {
          where: { userId },
          select: { role: true }
        },
        _count: {
          select: {
            members: true,
            tasks: { where: { isDeleted: false } },
            goals: { where: { isDeleted: false } },
          }
        }
      }
    });

    if (!project) {
      throw new AppError('NOT_FOUND', 'Project not found', 404);
    }

    return {
      ...project,
      role: project.members[0]?.role || 'VIEWER',
      membersCount: project._count.members,
      tasksCount: project._count.tasks,
      goalsCount: project._count.goals,
    };
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