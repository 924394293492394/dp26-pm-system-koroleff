import express from 'express'
import cors from 'cors'
import path from 'path'
import { authRouter } from './modules/auth/auth.routes.js'
import { projectRouter } from './modules/project/project.routes.js'
import { profileRouter } from './modules/profile/profile.routes.js'
import { projectMemberRouter } from './modules/project-member/project-member.routes.js'
import { goalRouter, globalGoalRouter } from './modules/goal/goal.routes.js'
import { taskRouter, globalTaskRouter } from './modules/task/task.routes.js'
import { commentRouter } from './modules/comment/comment.routes.js'
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js'
import { attachmentRouter } from './modules/attachment/attachment.routes.js'
import { checklistRouter } from './modules/checklist/checklist.routes.js'
import { linkRouter } from './modules/link/link.routes.js'
import { activityRouter } from './modules/activity/activity.routes.js'
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js'

export const app = express()

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}))
app.use(express.json())

app.get('/health', (_, res) => {
  res.json({ status: 'ok' })
})

app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000')
  res.header('Cross-Origin-Resource-Policy', 'cross-origin')
  next()
}, express.static(path.resolve('uploads')))

app.use('/auth', authRouter)
app.use('/profile', profileRouter)
app.use('/projects', projectRouter)
app.use('/projects', projectMemberRouter)

app.use('/projects', goalRouter)
app.use('/goals', globalGoalRouter)

app.use('/projects', taskRouter)
app.use('/tasks', globalTaskRouter)
app.use('/projects', commentRouter)

app.use('/projects', attachmentRouter)
app.use('/projects', checklistRouter)
app.use('/projects', linkRouter)
app.use('/projects', activityRouter)

app.use('/dashboard', dashboardRouter)

// error handlers
app.use(notFoundHandler)
app.use(errorHandler)