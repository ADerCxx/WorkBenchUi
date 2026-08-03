import type { PageParams, PageResult } from '@/apis/types';
import { delay, getRegexStore } from '../store';
import type { RegexListForm, RegexRule } from '../types';

/**
 * 正则白名单分页列表
 * 真实接口：POST /regex/list
 */
export async function RegexListApi(
  page: PageParams,
  formData: RegexListForm = {},
): Promise<PageResult<RegexRule>> {
  try {
    await delay();
    const nameKeyword = formData.name?.trim().toLowerCase();
    let filtered = getRegexStore();
    if (nameKeyword) {
      filtered = filtered.filter((r) =>
        r.name.toLowerCase().includes(nameKeyword),
      );
    }
    if (typeof formData.enabled === 'boolean') {
      filtered = filtered.filter((r) => r.enabled === formData.enabled);
    }
    const { current, pageSize } = page;
    const start = (current - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize);
    return { list, total: filtered.length };
  } catch {
    return Promise.reject(new Error('网络异常'));
  }
}
