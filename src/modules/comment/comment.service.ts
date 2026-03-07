import { prisma } from '../../lib/prisma.js'
import { ProjectRole } from '@prisma/client'
import {
    CreateCommentInput,
    UpdateCommentInput,
    CommentQuery
} from './comment.schema.js'
import { AppError } from '../../middleware/error.middleware.js'

class CommentService {

    private static isSystem(role: string) {
        return role === 'ADMIN' || role === 'SUPER_ADMIN'
    }

    private static async getProject(projectId: string) {
        const project = await prisma.project.findFirst({
            where: { id: projectId, isDeleted: false }
        })
        if (!project)
            throw new AppError('PROJECT_NOT_FOUND', 'Project not found', 404)
        return project
    }

    private static async getTask(projectId: string, taskId: string) {
        const task = await prisma.task.findFirst({
            where: { id: taskId, projectId, isDeleted: false }
        })
        if (!task)
            throw new AppError('TASK_NOT_FOUND', 'Task not found', 404)
        return task
    }

    private static async getMembership(projectId: string, userId: string) {
        return prisma.projectMember.findUnique({
            where: {
                projectId_userId: { projectId, userId }
            }
        })
    }

    static async create(projectId: string, taskId: string, userId: string, role: string, data: CreateCommentInput
    ) {
        await this.getProject(projectId)
        await this.getTask(projectId, taskId)
        if (!this.isSystem(role)) {
            const member = await this.getMembership(projectId, userId)
            if (!member || member.role === ProjectRole.VIEWER)
                throw new AppError('FORBIDDEN', 'Not allowed to comment', 403)

        }
        return prisma.comment.create({
            data: {
                taskId: taskId,
                userId,
                text: data.text
            }
        })
    }

    static async getAll(projectId: string, taskId: string, userId: string, role: string, query: CommentQuery
    ) {
        await this.getProject(projectId)
        await this.getTask(projectId, taskId)
        if (!this.isSystem(role)) {
            const member = await this.getMembership(projectId, userId)
            if (!member)
                throw new AppError('FORBIDDEN', 'Access denied', 403)
        }
        const { page, limit, search, userId: filterUser } = query
        const where: any = {
            issueId: taskId,
            isDeleted: false
        }
        if (search)
            where.text = { contains: search, mode: 'insensitive' }
        if (filterUser)
            where.userId = filterUser
        const total = await prisma.comment.count({ where })
        const comments = await prisma.comment.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'asc' },
            include: {
                user: {
                    select: { id: true, email: true }
                }
            }
        })
        return {
            data: comments,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        }
    }

    static async getOne(projectId: string, taskId: string, commentId: string, userId: string, role: string
    ) {
        await this.getProject(projectId)
        await this.getTask(projectId, taskId)
        if (!this.isSystem(role)) {
            const member = await this.getMembership(projectId, userId)
            if (!member)
                throw new AppError('FORBIDDEN', 'Access denied', 403)
        }
        const comment = await prisma.comment.findFirst({
            where: {
                id: commentId,
                taskId: taskId,
                isDeleted: false
            },
            include: {
                user: {
                    select: { id: true, email: true }
                }
            }
        })
        if (!comment)
            throw new AppError('COMMENT_NOT_FOUND', 'Comment not found', 404)
        return comment
    }

    static async update( projectId: string, taskId: string, commentId: string, userId: string, role: string, data: UpdateCommentInput
    ) {
        await this.getProject(projectId)
        await this.getTask(projectId, taskId)
        const comment = await prisma.comment.findFirst({
            where: {
                id: commentId,
                taskId: taskId,
                isDeleted: false
            }
        })
        if (!comment)
            throw new AppError('COMMENT_NOT_FOUND', 'Comment not found', 404)
        if (!this.isSystem(role)) {
            const member = await this.getMembership(projectId, userId)
            if (!member)
                throw new AppError('FORBIDDEN', 'Access denied', 403)
            if (member.role === ProjectRole.VIEWER)
                throw new AppError('FORBIDDEN', 'Viewer cannot update comments', 403)
            if (member.role === ProjectRole.MEMBER && comment.userId !== userId)
                throw new AppError('FORBIDDEN', 'Members can update only their comments', 403)
        }
        return prisma.comment.update({
            where: { id: commentId },
            data
        })
    }

    static async delete( projectId: string, taskId: string, commentId: string, userId: string, role: string
    ) {
        await this.getProject(projectId)
        await this.getTask(projectId, taskId)
        const comment = await prisma.comment.findFirst({
            where: {
                id: commentId,
                taskId: taskId,
                isDeleted: false
            }
        })
        if (!comment)
            throw new AppError('COMMENT_NOT_FOUND', 'Comment not found', 404)
        if (!this.isSystem(role)) {
            const member = await this.getMembership(projectId, userId)
            if (!member)
                throw new AppError('FORBIDDEN', 'Access denied', 403)
            if (member.role === ProjectRole.VIEWER)
                throw new AppError('FORBIDDEN', 'Viewer cannot delete comments', 403)
            if (member.role === ProjectRole.MEMBER && comment.userId !== userId)
                throw new AppError('FORBIDDEN', 'Members can delete only their comments', 403)
        }
        return prisma.comment.update({
            where: { id: commentId },
            data: { isDeleted: true }
        })
    }

    static async systemComments(query: CommentQuery) {
        const { page, limit, search, userId } = query
        const where: any = { isDeleted: false }
        if (search)
            where.text = { contains: search, mode: 'insensitive' }
        if (userId)
            where.userId = userId
        const total = await prisma.comment.count({ where })
        const comments = await prisma.comment.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: true,
                task: true
            }
        })
        return {
            data: comments,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        }
    }
}

export default CommentService