import { HttpStatus, type ResponseStructure } from '@/apis/types'
import request from '@/utils/request'

export const ReportEventCategoryStatus = {
  Enable: 1,
  Disable: 0,
} as const

export type ReportEventCategoryStatusCode =
  (typeof ReportEventCategoryStatus)[keyof typeof ReportEventCategoryStatus]

export interface ReportEventCategory {
  id: number
  parentId: number
  categoryName: string
  createdBy: string
  updatedBy: string
  createTime: number
  updateTime: number
  remark: string
  layer: number
  isEnable: ReportEventCategoryStatusCode
}

export interface ReportEventCategoryParams {
  /** 分类名称 */
  categoryName?: string
  /** 是否启用 */
  isEnable?: ReportEventCategoryStatusCode
}

/**
 * 获取事件分类列表
 */
export async function ReportEventCategoryApi(params: ReportEventCategoryParams = {}) {
  try {
    const res = await request<ResponseStructure<ReportEventCategory[]>>({
      url: '/report/eventCategory/list',
      method: 'POST',
      params,
    })

    if (res.data.code === HttpStatus.Success) {
      return res.data.data
    }

    return Promise.reject(new Error(res.data.msg))
  }
  catch {
    return Promise.reject(new Error('网络异常'))
  }
}
