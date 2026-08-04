import {
  HttpStatus,
  getBizMessage,
  type ResponseStructure,
} from '@/apis/types';
import request from '@/utils/request';

import type { RegexRulesInsertParams } from '../types';

/**
 * 新增正则规则
 * POST /regexRules/insert
 * @returns 新建规则 id
 */
export async function RegexRulesInsertApi(params: RegexRulesInsertParams) {
  try {
    const res = await request<ResponseStructure<string>>({
      url: '/regexRules/insert',
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
