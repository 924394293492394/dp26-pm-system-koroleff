import express from 'express'
import cors from 'cors'
import { authRouter } from './modules/auth/auth.routes.js'
import { projectRouter } from './modules/project/project.routes.js'
import { profileRouter } from './modules/profile/profile.routes.js'

export const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (_, res) => {
  res.json({ status: 'ok' })
})

app.use('/auth', authRouter)
app.use('/projects', projectRouter)
app.use('/profile', profileRouter)