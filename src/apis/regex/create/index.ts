import { delay, getRegexStore, setRegexStore, today } from '../store';
import type { RegexCreateParams, RegexRule } from '../types';

/** 新建；真实接口：POST /regex/create */
export async function RegexCreateApi(
  params: RegexCreateParams,
): Promise<RegexRule> {
  try {
    await delay();
    const row: RegexRule = {
      id: String(Date.now()),
      name: params.name,
      pattern: params.pattern,
      description: params.description ?? '',
      enabled: params.enabled ?? true,
      updatedAt: today(),
    };
    setRegexStore([row, ...getRegexStore()]);
    return row;
  } catch {
    return Promise.reject(new Error('网络异常'));
  }
}
