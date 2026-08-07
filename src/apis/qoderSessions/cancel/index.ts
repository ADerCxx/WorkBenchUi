import {
  HttpStatus,
  getBizMessage,
  type ResponseStructure,
} from '@/apis/types';
import request from '@/utils/request';

/**
 * 取消当前 Turn
 * POST /qoderSessions/{id}/cancel
 */
export async function QoderSessionsCancelApi(id: string): Promise<boolean> {
  try {
    const res = await request<ResponseStructure<boolean>>({
      url: `/qoderSessions/${id}/cancel`,
      method: 'POST',
      params: {},
    });

    if (res.data.code === HttpStatus.Success) {
      return res.data.data;
    }

    return Promise.reject(new Error(getBizMessage(res.data)));
  } catch {
    return Promise.reject(new Error('网络异常'));
  }
}
