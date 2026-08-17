import { describe, expect, it } from 'vitest';
import {
  compileWhitelistRules,
  matchesFileName,
  rulesForRootDir,
  type CompiledWhitelistRule,
} from '../whitelistMatch';

describe('compileWhitelistRules', () => {
  it('空目录名应进入 skipped', () => {
    const { rules, skipped } = compileWhitelistRules([
      { folderName: '  ', filePattern: '\\.md$' },
    ]);
    expect(rules).toHaveLength(0);
    expect(skipped).toHaveLength(1);
  });

  it('非法文件正则应进入 skipped', () => {
    const { rules, skipped } = compileWhitelistRules([
      { folderName: 'docs', filePattern: '[invalid' },
    ]);
    expect(rules).toHaveLength(0);
    expect(skipped).toHaveLength(1);
  });

  it('合法规则应编译为 RegExp 并 trim 目录名', () => {
    const { rules, skipped } = compileWhitelistRules([
      {
        folderName: '  docs  ',
        filePattern: '\\.mdc?$',
        ruleName: 'md-in-docs',
      },
    ]);
    expect(skipped).toHaveLength(0);
    expect(rules).toHaveLength(1);
    expect(rules[0].folderName).toBe('docs');
    expect(rules[0].folderNameLower).toBe('docs');
    expect(rules[0].ruleName).toBe('md-in-docs');
    expect(rules[0].file.test('readme.md')).toBe(true);
    expect(rules[0].file.test('readme.mdc')).toBe(true);
    expect(rules[0].file.test('readme.txt')).toBe(false);
  });

  it('应区分合法与非法规则', () => {
    const { rules, skipped } = compileWhitelistRules([
      { folderName: 'docs', filePattern: '\\.md$' },
      { folderName: '', filePattern: '\\.md$' },
      { folderName: '.cursor', filePattern: '(?' },
    ]);
    expect(rules).toHaveLength(1);
    expect(skipped).toHaveLength(2);
  });
});

describe('rulesForRootDir', () => {
  const rules: CompiledWhitelistRule[] = [
    {
      folderName: 'docs',
      folderNameLower: 'docs',
      file: /\.md$/,
      ruleName: 'docs-md',
    },
    {
      folderName: '.cursor',
      folderNameLower: '.cursor',
      file: /\.mdc?$/,
      ruleName: 'cursor-mdc',
    },
  ];

  it('应忽略大小写匹配第一层目录', () => {
    expect(rulesForRootDir('Docs', rules)).toHaveLength(1);
    expect(rulesForRootDir('Docs', rules)[0].ruleName).toBe('docs-md');
  });

  it('无匹配目录时返回空数组', () => {
    expect(rulesForRootDir('src', rules)).toHaveLength(0);
  });
});

describe('matchesFileName', () => {
  const rules: CompiledWhitelistRule[] = [
    {
      folderName: 'docs',
      folderNameLower: 'docs',
      file: /\.md$/,
    },
    {
      folderName: 'docs',
      folderNameLower: 'docs',
      file: /\.mdc$/,
    },
  ];

  it('文件名命中任一规则时返回 true', () => {
    expect(matchesFileName('guide.md', rules)).toBe(true);
    expect(matchesFileName('rule.mdc', rules)).toBe(true);
  });

  it('文件名未命中任何规则时返回 false', () => {
    expect(matchesFileName('readme.txt', rules)).toBe(false);
  });

  it('规则列表为空时返回 false', () => {
    expect(matchesFileName('readme.md', [])).toBe(false);
  });
});
