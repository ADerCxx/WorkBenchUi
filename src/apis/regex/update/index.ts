import { delay, getRegexStore, setRegexStore, today } from '../store';
import type { RegexRule, RegexUpdateParams } from '../types';

/** 更新；真实接口：POST /regex/update */
export async function RegexUpdateApi(
  params: RegexUpdateParams,
): Promise<RegexRule> {
  try {
    await delay();
    const rows = getRegexStore();
    const idx = rows.findIndex((r) => r.id === params.id);
    if (idx < 0) {
      return Promise.reject(new Error('记录不存在'));
    }
    const prev = rows[idx]!;
    const next: RegexRule = {
      ...prev,
      name: params.name,
      pattern: params.pattern,
      description: params.description ?? '',
      enabled: params.enabled ?? prev.enabled,
      updatedAt: today(),
    };
    const copy = rows.slice();
    copy[idx] = next;
    setRegexStore(copy);
    return next;
  } catch (e) {
    if (e instanceof Error && e.message === '记录不存在') {
      return Promise.reject(e);
    }
    return Promise.reject(new Error('网络异常'));
  }
}
