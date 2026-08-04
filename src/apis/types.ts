/** 统一业务响应结构 */
export interface ResponseStructure<T> {
  /** 部分后端用 msg */
  msg?: string;
  /** ly-innovation-challenge-svc 等用 message */
  message?: string;
  code: HttpStatusCode;
  data: T;
  total?: number;
}

/** 取业务错误文案（兼容 message / msg） */
export function getBizMessage(
  res: ResponseStructure<unknown>,
  fallback = '操作失败',
) {
  return res.message ?? res.msg ?? fallback;
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
} as const;

export type HttpStatusCode = (typeof HttpStatus)[keyof typeof HttpStatus];

/** 分页查询公共入参（对齐 ahooks usePagination / useAntdTable） */
export interface PageParams {
  current: number;
  pageSize: number;
}

/** 分页列表公共出参（API 返回给页面的形状） */
export interface PageResult<T> {
  list: T[];
  total: number;
}
