import { RegexRulesQueryApi } from '../query';
import { RegexRuleEnableStatus, type RegexRule } from '../types';

const PAGE_SIZE = 100;

/**
 * 拉取全部启用中的白名单规则（翻页直至取完）
 */
export async function RegexRulesQueryEnabledApi(): Promise<RegexRule[]> {
  const all: RegexRule[] = [];
  let current = 1;

  for (;;) {
    const { list, total } = await RegexRulesQueryApi(
      { current, pageSize: PAGE_SIZE },
      { enableStatus: RegexRuleEnableStatus.Enable },
    );
    all.push(...list);
    if (all.length >= total || list.length === 0) break;
    current += 1;
  }

  return all;
}
