export const successResponse = (data: any, meta: any = {}) => {
  return {
    success: true,
    data,
    meta
  }
}

export const errorResponse = (error: { code: string, message: string }) => {
  return {
    success: false,
    error
  }
}