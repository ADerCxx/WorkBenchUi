/** 统一业务响应结构 */
export interface ResponseStructure<T> {
  msg: string
  code: HttpStatusCode
  data: T
  total?: number
}

/**
 * 业务状态码（用 const 代替 enum，兼容 erasableSyntaxOnly）
 */
export const HttpStatus = {
  /** 请求成功 */
  Success: 200,
  /** 资源已存在 */
  Exists: 201,
  /** 请求失败 */
  Failure: 500,
} as const

export type HttpStatusCode = (typeof HttpStatus)[keyof typeof HttpStatus]
