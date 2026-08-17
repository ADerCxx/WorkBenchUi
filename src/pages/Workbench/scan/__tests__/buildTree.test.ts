import { describe, expect, it } from 'vitest';
import { buildTree } from '../buildTree';
import type { RawFile } from '../types';

describe('buildTree', () => {
  it('应根据相对路径构建嵌套树与 content 映射', () => {
    const files: RawFile[] = [
      { relativePath: '.cursor/skills/foo/SKILL.md', content: 'a' },
      { relativePath: '.cursor/rules/bar.mdc', content: 'b' },
      { relativePath: 'docs/readme.md', content: 'c' },
    ];

    const { treeData, contentByPath } = buildTree(files);

    expect(contentByPath.get('.cursor/skills/foo/SKILL.md')).toBe('a');
    expect(contentByPath.get('.cursor/rules/bar.mdc')).toBe('b');
    expect(contentByPath.get('docs/readme.md')).toBe('c');
    expect(treeData.map((n) => n.key).sort()).toEqual(['.cursor', 'docs']);

    const cursor = treeData.find((n) => n.key === '.cursor')!;
    expect(cursor.isLeaf).toBeFalsy();
    const skills = cursor.children!.find((n) => n.key === '.cursor/skills')!;
    const foo = skills.children!.find((n) => n.key === '.cursor/skills/foo')!;
    const skillFile = foo.children!.find(
      (n) => n.key === '.cursor/skills/foo/SKILL.md',
    )!;
    expect(skillFile.isLeaf).toBe(true);
    expect(skillFile.title).toBe('SKILL.md');
  });

  it('空输入应返回空树与空映射', () => {
    const { treeData, contentByPath } = buildTree([]);
    expect(treeData).toEqual([]);
    expect(contentByPath.size).toBe(0);
  });

  it('应将反斜杠规范化为正斜杠', () => {
    const files: RawFile[] = [
      { relativePath: 'docs\\nested\\note.md', content: 'body' },
    ];
    const { treeData, contentByPath } = buildTree(files);

    expect(contentByPath.get('docs/nested/note.md')).toBe('body');
    const docs = treeData.find((n) => n.key === 'docs')!;
    const nested = docs.children!.find((n) => n.key === 'docs/nested')!;
    const leaf = nested.children!.find((n) => n.key === 'docs/nested/note.md')!;
    expect(leaf.isLeaf).toBe(true);
    expect(leaf.title).toBe('note.md');
  });

  it('根目录单层文件应直接作为叶子节点', () => {
    const { treeData, contentByPath } = buildTree([
      { relativePath: 'README.md', content: 'root' },
    ]);
    expect(treeData).toEqual([
      { key: 'README.md', title: 'README.md', isLeaf: true },
    ]);
    expect(contentByPath.get('README.md')).toBe('root');
  });
});
