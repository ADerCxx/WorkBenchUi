import { delay, getRegexStore, setRegexStore, today } from '../store';
import type { RegexRule, RegexToggleParams } from '../types';

/** 启停；真实接口：POST /regex/toggle */
export async function RegexToggleApi(
  params: RegexToggleParams,
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
      enabled: params.enabled,
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
