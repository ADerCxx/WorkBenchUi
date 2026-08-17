import { describe, expect, it } from 'vitest';
import { readDroppedTextFile } from '../readDroppedTextFile';

type FakeFile = { name: string; text: () => Promise<string> };

function file(name: string, content = 'hello'): FakeFile {
  return { name, text: async () => content };
}

describe('readDroppedTextFile', () => {
  it('空列表 → empty', async () => {
    await expect(readDroppedTextFile([])).resolves.toEqual({
      ok: false,
      code: 'empty',
    });
  });

  it('多个文件 → multiple', async () => {
    await expect(
      readDroppedTextFile([file('a.md'), file('b.md')]),
    ).resolves.toEqual({ ok: false, code: 'multiple' });
  });

  it('目录标记 → directory', async () => {
    await expect(
      readDroppedTextFile([file('folder')], { isDirectory: true }),
    ).resolves.toEqual({ ok: false, code: 'directory' });
  });

  it('空列表 + isDirectory → directory', async () => {
    await expect(
      readDroppedTextFile([], { isDirectory: true }),
    ).resolves.toEqual({
      ok: false,
      code: 'directory',
    });
  });

  it('多文件 + isDirectory → directory', async () => {
    await expect(
      readDroppedTextFile([file('a.md'), file('b.md')], { isDirectory: true }),
    ).resolves.toEqual({ ok: false, code: 'directory' });
  });

  it('非白名单 → unsupported', async () => {
    await expect(readDroppedTextFile([file('a.png')])).resolves.toEqual({
      ok: false,
      code: 'unsupported',
    });
  });

  it('读失败 → read_failed', async () => {
    const bad: FakeFile = {
      name: 'a.md',
      text: async () => {
        throw new Error('boom');
      },
    };
    await expect(readDroppedTextFile([bad])).resolves.toEqual({
      ok: false,
      code: 'read_failed',
    });
  });

  it('成功返回 path+content', async () => {
    await expect(
      readDroppedTextFile([file('Skill.md', '# hi')]),
    ).resolves.toEqual({
      ok: true,
      file: { path: 'Skill.md', content: '# hi' },
    });
  });
});
