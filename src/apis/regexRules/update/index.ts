import {
  HttpStatus,
  getBizMessage,
  type ResponseStructure,
} from '@/apis/types';
import request from '@/utils/request';

import type { RegexRulesUpdateParams } from '../types';

/**
 * 修改正则规则（含仅传 id + enableStatus 的启停）
 * POST /regexRules/update
 */
export async function RegexRulesUpdateApi(params: RegexRulesUpdateParams) {
  try {
    const res = await request<ResponseStructure<boolean>>({
      url: '/regexRules/update',
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
