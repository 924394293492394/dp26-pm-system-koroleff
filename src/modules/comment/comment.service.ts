import { prisma } from '../../lib/prisma.js'
import { CreateCommentInput, UpdateCommentInput } from './comment.schema.js'

class CommentService {

    // --- ACCESS CHECKS ---

    private static async assertProjectAccess(projectId: string, userId: string) {
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
        })

        if (!project) {
            throw new Error('Access denied or project not found')
        }
    }

    private static async assertTaskAccess(taskId: string, projectId: string) {
        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                projectId,
                isDeleted: false
            }
        })

        if (!task) {
            throw new Error('Task not found or access denied')
        }
    }

    // --- CRUD ---

    static async create(
        projectId: string,
        taskId: string,
        userId: string,
        data: CreateCommentInput
    ) {
        await this.assertProjectAccess(projectId, userId)
        await this.assertTaskAccess(taskId, projectId)

        return prisma.comment.create({
            data: {
                issueId: taskId,
                userId,
                text: data.text
            }
        })
    }

    static async getAll(projectId: string, taskId: string, userId: string) {
        await this.assertProjectAccess(projectId, userId)
        await this.assertTaskAccess(taskId, projectId)

        return prisma.comment.findMany({
            where: {
                issueId: taskId,
                isDeleted: false
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        })
    }

    static async update(
        projectId: string,
        taskId: string,
        commentId: string,
        userId: string,
        data: UpdateCommentInput
    ) {
        await this.assertProjectAccess(projectId, userId)
        await this.assertTaskAccess(taskId, projectId)

        const existing = await prisma.comment.findFirst({
            where: {
                id: commentId,
                issueId: taskId,
                isDeleted: false
            }
        })

        if (!existing) {
            throw new Error('Comment not found')
        }

        if (existing.userId !== userId) {
            throw new Error('You can update only your own comment')
        }

        return prisma.comment.update({
            where: { id: commentId },
            data
        })
    }

    static async delete(
        projectId: string,
        taskId: string,
        commentId: string,
        userId: string
    ) {
        await this.assertProjectAccess(projectId, userId)
        await this.assertTaskAccess(taskId, projectId)

        const comment = await prisma.comment.findFirst({
            where: {
                id: commentId,
                issueId: taskId,
                isDeleted: false
            }
        })

        if (!comment) {
            throw new Error('Comment not found')
        }

        if (comment.userId !== userId) {
            throw new Error('You can delete only your own comment')
        }

        return prisma.comment.update({
            where: { id: commentId },
            data: { isDeleted: true }
        })
    }
}

export default CommentService