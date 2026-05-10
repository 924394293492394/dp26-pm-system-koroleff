import { prisma } from '../../lib/prisma.js'
import LogService from '../../log/log.service.js'
import {
    CreateCommentInput,
    UpdateCommentInput,
    CommentQuery
} from './comment.schema.js'
import { AppError } from '../../middleware/error.middleware.js'

class CommentService {

    private static isAdmin(role: string) {
        return role === 'ADMIN' || role === 'SUPER_ADMIN'
    }

    private static async getProjectRole(
        projectId: string,
        userId: string,
        role: string
    ) {

        if (this.isAdmin(role)) {
            return { role: 'ADMIN' }
        }

        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                isDeleted: false
            },
            include: {
                members: {
                    where: { userId }
                }
            }
        })

        if (!project) {
            throw new AppError('PROJECT_NOT_FOUND', 'Project not found', 404)
        }

        if (project.createdBy === userId) {
            return { role: 'OWNER' }
        }

        const member = project.members[0]

        if (!member) {
            throw new AppError('FORBIDDEN', 'Access denied', 403)
        }

        return { role: member.role }
    }

    private static async getTaskOrFail(projectId: string, taskId: string) {

        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                projectId,
                isDeleted: false
            }
        })

        if (!task) {
            throw new AppError('TASK_NOT_FOUND', 'Task not found', 404)
        }

        return task
    }

    static async create(
        projectId: string,
        taskId: string,
        userId: string,
        role: string,
        data: CreateCommentInput
    ) {

        const access = await this.getProjectRole(projectId, userId, role)

        const task = await this.getTaskOrFail(projectId, taskId)

        if (access.role === 'VIEWER') {
            throw new AppError('FORBIDDEN', 'Viewer cannot comment', 403)
        }

        const comment = await prisma.comment.create({
            data: {
                taskId: task.id,
                userId,
                text: data.text
            }
        })

        await LogService.logAction(userId, 'CREATE_COMMENT', 'Comment', comment.id)

        return comment
    }

    static async getAll(
        projectId: string,
        taskId: string,
        userId: string,
        role: string,
        query: CommentQuery
    ) {

        await this.getProjectRole(projectId, userId, role)
        await this.getTaskOrFail(projectId, taskId)

        const { page, limit, search, userId: filterUser } = query

        const where: any = {
            taskId,
            isDeleted: false
        }

        if (search) {
            where.text = {
                contains: search,
                mode: 'insensitive'
            }
        }

        if (filterUser) {
            where.userId = filterUser
        }

        const [comments, total] = await Promise.all([
            prisma.comment.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            login: true,
                            email: true,
                            profile: { select: { avatarUrl: true } }
                        }
                    }
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'asc' }
            }),
            prisma.comment.count({ where })
        ])

        return {
            data: comments,
            meta: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page,
                perPage: limit
            }
        }
    }

    static async getOne(
        projectId: string,
        taskId: string,
        commentId: string,
        userId: string,
        role: string
    ) {

        await this.getProjectRole(projectId, userId, role)
        await this.getTaskOrFail(projectId, taskId)

        const comment = await prisma.comment.findFirst({
            where: {
                id: commentId,
                taskId,
                isDeleted: false
            },
            include: {
                user: {
                    select: {
                        id: true,
                        login: true,
                        email: true,
                        profile: { select: { avatarUrl: true } }
                    }
                }
            }
        })

        if (!comment) {
            throw new AppError('COMMENT_NOT_FOUND', 'Comment not found', 404)
        }

        return comment
    }

    static async update(
        projectId: string,
        taskId: string,
        commentId: string,
        userId: string,
        role: string,
        data: UpdateCommentInput
    ) {

        const access = await this.getProjectRole(projectId, userId, role)

        const comment = await prisma.comment.findFirst({
            where: {
                id: commentId,
                taskId,
                isDeleted: false
            }
        })

        if (!comment) {
            throw new AppError('COMMENT_NOT_FOUND', 'Comment not found', 404)
        }

        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                projectId,
                isDeleted: false
            }
        })

        if (!task) {
            throw new AppError('TASK_NOT_FOUND', 'Task not found', 404)
        }

        if (['ADMIN', 'OWNER', 'MANAGER'].includes(access.role)) {

        } else if (access.role === 'MEMBER') {

            const canManage =
                comment.userId === userId ||
                task.createdBy === userId ||
                task.assignedTo === userId

            if (!canManage) {
                throw new AppError('FORBIDDEN', 'You cannot update this comment', 403)
            }

        } else {

            throw new AppError('FORBIDDEN', 'Viewer cannot update comments', 403)
        }

        const updated = await prisma.comment.update({
            where: { id: commentId },
            data: {
                text: data.text
            }
        })

        await LogService.logAction(userId, 'UPDATE_COMMENT', 'Comment', commentId)

        return updated
    }

    static async delete(
        projectId: string,
        taskId: string,
        commentId: string,
        userId: string,
        role: string
    ) {

        const access = await this.getProjectRole(projectId, userId, role)

        const comment = await prisma.comment.findFirst({
            where: {
                id: commentId,
                taskId,
                isDeleted: false
            }
        })

        if (!comment) {
            throw new AppError('COMMENT_NOT_FOUND', 'Comment not found', 404)
        }

        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                projectId,
                isDeleted: false
            }
        })

        if (!task) {
            throw new AppError('TASK_NOT_FOUND', 'Task not found', 404)
        }

        if (['ADMIN', 'OWNER', 'MANAGER'].includes(access.role)) {

        } else if (access.role === 'MEMBER') {

            const canManage =
                comment.userId === userId ||
                task.createdBy === userId ||
                task.assignedTo === userId

            if (!canManage) {
                throw new AppError('FORBIDDEN', 'You cannot delete this comment', 403)
            }

        } else {

            throw new AppError('FORBIDDEN', 'Viewer cannot delete comments', 403)
        }

        await prisma.comment.update({
            where: { id: commentId },
            data: { isDeleted: true }
        })

        await LogService.logAction(userId, 'DELETE_COMMENT', 'Comment', commentId)
    }
}

export default CommentService