import { prisma } from "../../lib/prisma.js"

class DashboardService {

  static async getSummary(userId: string, role: string) {
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'

    const now      = new Date()
    const in7Days  = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const month30  = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      myActiveTasks, // Мои активные задачи
      upcomingDeadlines, // задачи с дедлайном в ближайшие 7 дней
      overdueTasks,  // Просроченные задачи
      myActiveGoals, // Мои активные цели (ответственный или создатель)
      myProjects, // Мои проекты
      completedLast30, // Статистика за 30 дней
      systemStats, // Общая статистика (только для admin)
    ] = await Promise.all([

      // Активные задачи (TODO + IN_PROGRESS + REVIEW)
      prisma.task.findMany({
        where: {
          isDeleted: false,
          assignedTo: userId,
          status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] },
        },
        include: {
          project: { select: { id: true, name: true } },
          goal:    { select: { id: true, title: true } },
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate:  'asc'  },
        ],
        take: 8,
      }),

      // Дедлайны в ближайшие 7 дней
      prisma.task.findMany({
        where: {
          isDeleted:  false,
          assignedTo: userId,
          status:     { not: 'DONE' },
          dueDate:    { gte: now, lte: in7Days },
        },
        include: {
          project: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),

      // Просроченные задачи
      prisma.task.count({
        where: {
          isDeleted:  false,
          assignedTo: userId,
          status:     { not: 'DONE' },
          dueDate:    { lt: now },
        },
      }),

      // Мои активные цели
      prisma.goal.findMany({
        where: {
          isDeleted: false,
          status:    { in: ['PLANNED', 'IN_PROGRESS'] },
          OR: [
            { responsibleUserId: userId },
            { createdBy:         userId },
          ],
        },
        include: {
          project: { select: { id: true, name: true } },
          tasks: {
            where:  { isDeleted: false },
            select: { id: true, status: true },
          },
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),

      // Мои проекты — последние активные
      prisma.project.findMany({
        where: {
          isDeleted:  false,
          isArchived: false,
          members: { some: { userId } },
        },
        include: {
          _count: {
            select: {
              tasks: { where: { isDeleted: false } },
              goals: { where: { isDeleted: false } },
            },
          },
          members: {
            where: { userId },
            select: { role: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),

      // Задач выполнено за 30 дней
      prisma.task.count({
        where: {
          isDeleted:  false,
          assignedTo: userId,
          status:     'DONE',
          updatedAt:  { gte: month30 },
        },
      }),

      // Системная статистика — только для Admin
      isAdmin ? Promise.all([
        prisma.userAuth.count(),
        prisma.project.count({ where: { isDeleted: false } }),
        prisma.task.count({ where: { isDeleted: false } }),
        prisma.goal.count({ where: { isDeleted: false } }),
      ]) : Promise.resolve(null),
    ])

    // Счётчики по статусам задач
    const tasksByStatus = {
      TODO:        myActiveTasks.filter(t => t.status === 'TODO').length,
      IN_PROGRESS: myActiveTasks.filter(t => t.status === 'IN_PROGRESS').length,
      REVIEW:      myActiveTasks.filter(t => t.status === 'REVIEW').length,
    }

    // Прогресс по целям
    const goalsWithProgress = myActiveGoals.map(goal => {
      const totalTasks = goal.tasks.length
      const doneTasks  = goal.tasks.filter(t => t.status === 'DONE').length
      const progress   = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0
      return {
        id:          goal.id,
        title:       goal.title,
        status:      goal.status,
        dueDate:     goal.dueDate,
        progress,
        totalTasks,
        doneTasks,
        project:     goal.project,
      }
    })

    return {
      // Задачи
      myActiveTasks,
      tasksByStatus,
      upcomingDeadlines,
      overdueCount: overdueTasks,
      completedLast30,
      totalActive: myActiveTasks.length,

      // Цели
      myActiveGoals: goalsWithProgress,

      // Проекты
      myProjects: myProjects.map(p => ({
        id:         p.id,
        name:       p.name,
        role:       p.members[0]?.role || 'MEMBER',
        tasksCount: p._count.tasks,
        goalsCount: p._count.goals,
        updatedAt:  p.updatedAt,
      })),

      // Системная статистика (только Admin)
      ...(isAdmin && systemStats ? {
        systemStats: {
          usersCount:    systemStats[0],
          projectsCount: systemStats[1],
          tasksCount:    systemStats[2],
          goalsCount:    systemStats[3],
        }
      } : {}),
    }
  }
}

export default DashboardService