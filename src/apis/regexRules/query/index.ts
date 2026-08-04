import {
  HttpStatus,
  getBizMessage,
  type PageParams,
  type PageResult,
  type ResponseStructure,
} from '@/apis/types';
import request from '@/utils/request';

import type { RegexRule, RegexRuleIPage, RegexRulesQueryForm } from '../types';

/**
 * 分页查询正则规则列表
 * GET /regexRules/query
 */
export async function RegexRulesQueryApi(
  page: PageParams,
  formData: RegexRulesQueryForm = {},
): Promise<PageResult<RegexRule>> {
  try {
    const res = await request<ResponseStructure<RegexRuleIPage>>({
      url: '/regexRules/query',
      method: 'GET',
      params: {
        ruleNameSearchParam: formData.ruleNameSearchParam,
        enableStatus: formData.enableStatus,
        page: page.current,
        pageSize: page.pageSize,
      },
    });

    if (res.data.code === HttpStatus.Success) {
      const data = res.data.data;
      return {
        list: data?.records ?? [],
        total: data?.total ?? 0,
      };
    }

    return Promise.reject(new Error(getBizMessage(res.data)));
  } catch {
    return Promise.reject(new Error('网络异常'));
  }
}
