import {
  HttpStatus,
  getBizMessage,
  type ResponseStructure,
} from '@/apis/types';
import request from '@/utils/request';

import type { RegexRulesDeleteParams } from '../types';

/**
 * 批量删除正则规则
 * POST /regexRules/delete
 */
export async function RegexRulesDeleteApi(params: RegexRulesDeleteParams) {
  try {
    const res = await request<ResponseStructure<boolean>>({
      url: '/regexRules/delete',
      method: 'POST',
      params,
    });

    if (res.data.code === HttpStatus.Success) {
      return res.data.data;
    }

    return Promise.reject(new Error(getBizMessage(res.data)));
  } catch {
    return Promise.reject(new Error('网络异常'));
  }
}
