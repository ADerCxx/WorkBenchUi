import type { RegexRule } from './types';

const INITIAL: RegexRule[] = [
  {
    id: '1',
    name: 'Skills 目录',
    pattern: String.raw`(?:^|/)\.cursor/skills(?:/|$)`,
    description: '匹配 .cursor/skills 约定根',
    enabled: true,
    updatedAt: '2026-07-28',
  },
  {
    id: '2',
    name: 'Rules 目录',
    pattern: String.raw`(?:^|/)\.cursor/rules(?:/|$)`,
    description: '匹配 .cursor/rules 约定根',
    enabled: true,
    updatedAt: '2026-07-28',
  },
  {
    id: '3',
    name: 'Agents Skills',
    pattern: String.raw`(?:^|/)\.agents/skills(?:/|$)`,
    description: '匹配 .agents/skills 约定根',
    enabled: true,
    updatedAt: '2026-07-29',
  },
  {
    id: '4',
    name: '忽略 node_modules',
    pattern: String.raw`(?:^|/)node_modules(?:/|$)`,
    description: '排除依赖目录（示例，可作黑名单扩展）',
    enabled: false,
    updatedAt: '2026-07-30',
  },
  {
    id: '5',
    name: 'Skills 目录（副本 A）',
    pattern: String.raw`(?:^|/)\.cursor/skills(?:/|$)`,
    description: '匹配 .cursor/skills 约定根',
    enabled: true,
    updatedAt: '2026-07-28',
  },
  {
    id: '6',
    name: 'Rules 目录（副本 A）',
    pattern: String.raw`(?:^|/)\.cursor/rules(?:/|$)`,
    description: '匹配 .cursor/rules 约定根',
    enabled: true,
    updatedAt: '2026-07-28',
  },
  {
    id: '7',
    name: 'Agents Skills（副本 A）',
    pattern: String.raw`(?:^|/)\.agents/skills(?:/|$)`,
    description: '匹配 .agents/skills 约定根',
    enabled: true,
    updatedAt: '2026-07-29',
  },
  {
    id: '8',
    name: '忽略 node_modules（副本 A）',
    pattern: String.raw`(?:^|/)node_modules(?:/|$)`,
    description: '排除依赖目录（示例，可作黑名单扩展）',
    enabled: false,
    updatedAt: '2026-07-30',
  },
  {
    id: '9',
    name: 'Skills 目录（副本 B）',
    pattern: String.raw`(?:^|/)\.cursor/skills(?:/|$)`,
    description: '匹配 .cursor/skills 约定根',
    enabled: true,
    updatedAt: '2026-07-28',
  },
  {
    id: '10',
    name: 'Rules 目录（副本 B）',
    pattern: String.raw`(?:^|/)\.cursor/rules(?:/|$)`,
    description: '匹配 .cursor/rules 约定根',
    enabled: true,
    updatedAt: '2026-07-28',
  },
  {
    id: '11',
    name: 'Agents Skills（副本 B）',
    pattern: String.raw`(?:^|/)\.agents/skills(?:/|$)`,
    description: '匹配 .agents/skills 约定根',
    enabled: true,
    updatedAt: '2026-07-29',
  },
  {
    id: '12',
    name: '忽略 node_modules（副本 B）',
    pattern: String.raw`(?:^|/)node_modules(?:/|$)`,
    description: '排除依赖目录（示例，可作黑名单扩展）',
    enabled: false,
    updatedAt: '2026-07-30',
  },
];

/** @deprecated 接真实后端后移除；仅供 mock API */
let rows: RegexRule[] = INITIAL.map((r) => ({ ...r }));

export function delay(ms = 200): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function getRegexStore(): RegexRule[] {
  return rows;
}

export function setRegexStore(next: RegexRule[]): void {
  rows = next;
}

export function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
