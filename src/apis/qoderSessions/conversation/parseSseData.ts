import type { SseResponse } from './types';

/** 将 SSE data 字段解析为 SseResponse；空串或非法 JSON 返回 null */
export function parseSseData(data: string): SseResponse | null {
  const trimmed = data.trim();
  if (!trimmed) {
    return null;
  }
  try {
    return JSON.parse(trimmed) as SseResponse;
  } catch {
    return null;
  }
}
