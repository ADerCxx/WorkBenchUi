import { describe, expect, it } from 'vitest';
import { getAnalyzeButtonLabel, getResultSubtitle } from '../resultChrome';

describe('getResultSubtitle', () => {
  it('idle 且无 markdown 时提示点击分析', () => {
    expect(getResultSubtitle('idle', false)).toBe('点击一键分析，查看 AI 结果');
  });

  it('running 时显示进行中文案', () => {
    expect(getResultSubtitle('running', false)).toBe(
      '正在根据当前文件生成解读与建议…',
    );
    expect(getResultSubtitle('running', true)).toBe(
      '正在根据当前文件生成解读与建议…',
    );
  });

  it('idle 且有 markdown 时显示完成文案', () => {
    expect(getResultSubtitle('idle', true)).toBe(
      '已根据当前文件内容生成本次解读与建议。',
    );
  });

  it('error 时显示失败文案', () => {
    expect(getResultSubtitle('error', false)).toBe(
      '分析中断或失败，可修改后重新分析',
    );
    expect(getResultSubtitle('error', true)).toBe(
      '分析中断或失败，可修改后重新分析',
    );
  });
});

describe('getAnalyzeButtonLabel', () => {
  it('idle 且无 markdown 时为「一键分析」', () => {
    expect(getAnalyzeButtonLabel('idle', false)).toBe('一键分析');
  });

  it('有 markdown 或 running 时为「重新分析」', () => {
    expect(getAnalyzeButtonLabel('idle', true)).toBe('重新分析');
    expect(getAnalyzeButtonLabel('running', false)).toBe('重新分析');
    expect(getAnalyzeButtonLabel('running', true)).toBe('重新分析');
    expect(getAnalyzeButtonLabel('error', true)).toBe('重新分析');
  });

  it('error 且无 markdown 时为「一键分析」', () => {
    expect(getAnalyzeButtonLabel('error', false)).toBe('一键分析');
  });
});
