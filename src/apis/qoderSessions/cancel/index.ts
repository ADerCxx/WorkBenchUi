import request from '@/utils/request';

import type { MetaResponseStructure } from './types';

/**
 * 取消当前 Turn
 * POST /qoderSessions/{id}/cancel
 * 成功判定：以后端 `meta.success` 为准
 */
export async function QoderSessionsCancelApi(id: string): Promise<boolean> {
  try {
    const res = await request<MetaResponseStructure<boolean>>({
      url: `/qoderSessions/${id}/cancel`,
      method: 'POST',
      params: {},
    });

    if (res.data.meta?.success) {
      return res.data.data;
    }

    return Promise.reject(
      new Error(res.data.meta?.message ?? '操作失败'),
    );
  } catch {
    return Promise.reject(new Error('网络异常'));
  }
}
