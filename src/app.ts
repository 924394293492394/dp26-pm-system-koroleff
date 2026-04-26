import express from 'express'
import cors from 'cors'
import { authRouter } from './modules/auth/auth.routes.js'
import { projectRouter } from './modules/project/project.routes.js'
import { profileRouter } from './modules/profile/profile.routes.js'
import { projectMemberRouter } from './modules/project-member/project-member.routes.js'
import { goalRouter, globalGoalRouter } from './modules/goal/goal.routes.js'
import { taskRouter, globalTaskRouter } from './modules/task/task.routes.js'
import { commentRouter } from './modules/comment/comment.routes.js'
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js'

export const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (_, res) => {
  res.json({ status: 'ok' })
})

app.use('/auth', authRouter)
app.use('/profile', profileRouter)
app.use('/projects', projectRouter)
app.use('/projects', projectMemberRouter)

app.use('/projects', goalRouter)
app.use('/goals', globalGoalRouter)

app.use('/projects', taskRouter)
app.use('/tasks', globalTaskRouter)
app.use('/projects', commentRouter)

// error handler v1
app.use(notFoundHandler) //404
app.use(errorHandler) //глобал