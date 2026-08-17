import { describe, expect, it } from 'vitest';
import { parseFrontmatter } from '../parseFrontmatter';

describe('parseFrontmatter', () => {
  it('无 frontmatter 时 matter 为 null 且 body 保持原文', () => {
    const source = '# Hello\n\nworld';
    expect(parseFrontmatter(source)).toEqual({
      matter: null,
      body: source,
    });
  });

  it('应解析合法的 skill 风格 frontmatter', () => {
    const source = `---
name: demo-skill
description: >-
  Use when testing.
globs:
  - "src/**/*.ts"
alwaysApply: false
disable-model-invocation: true
extra: keep-me
---

# Body

text
`;
    const result = parseFrontmatter(source);
    expect(result.matter).toEqual({
      name: 'demo-skill',
      description: 'Use when testing.',
      globs: ['src/**/*.ts'],
      alwaysApply: false,
      'disable-model-invocation': true,
      extra: 'keep-me',
    });
    expect(result.body).toBe('\n# Body\n\ntext\n');
  });

  it('应允许 opening fence 前有 BOM 与空白', () => {
    const source = `\uFEFF  \n---\nname: x\n---\n\n# Hi\n`;
    const result = parseFrontmatter(source);
    expect(result.matter).toEqual({ name: 'x' });
    expect(result.body).toBe('\n# Hi\n');
  });

  it('仅有 opening fence 时不应剥离', () => {
    const source = '---\nname: x\n# Body\n';
    expect(parseFrontmatter(source)).toEqual({
      matter: null,
      body: source,
    });
  });

  it('不应把正文中的 hr 当作 frontmatter 结束符', () => {
    const source = '# Title\n\n---\n\nmore\n';
    expect(parseFrontmatter(source)).toEqual({
      matter: null,
      body: source,
    });
  });

  it('无效 YAML 时应回退为整份原文', () => {
    const source = '---\nname: [unclosed\n---\n\n# Body\n';
    expect(parseFrontmatter(source)).toEqual({
      matter: null,
      body: source,
    });
  });

  it('YAML 根节点非 plain object 时应回退', () => {
    const source = '---\n- just\n- a\n- list\n---\n\n# Body\n';
    expect(parseFrontmatter(source)).toEqual({
      matter: null,
      body: source,
    });
  });
});
