import { delay, getRegexStore, setRegexStore } from '../store';
import type { RegexDeleteParams } from '../types';

/** 删除；真实接口：POST /regex/delete */
export async function RegexDeleteApi(params: RegexDeleteParams): Promise<void> {
  try {
    await delay();
    setRegexStore(getRegexStore().filter((r) => r.id !== params.id));
  } catch {
    return Promise.reject(new Error('网络异常'));
  }
}
