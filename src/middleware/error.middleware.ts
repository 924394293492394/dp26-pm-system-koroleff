import { Request, Response, NextFunction } from 'express'

//общая структура ошибки
export class AppError extends Error {
  constructor(public code: string, public message: string, public statusCode: number) {
    super(message)
    this.name = this.constructor.name
  }
}

//обработчик ошибок
export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  console.error(`Error: ${message}`, err.stack)

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'UNKNOWN_ERROR',
      message,
    }
  })
}

//перехватыем неизвестные ошибки
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found',
    }
  })
}