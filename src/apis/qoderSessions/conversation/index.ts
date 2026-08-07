import { ApiUrl } from '@/config';
import { fetchEventSource } from '@microsoft/fetch-event-source';

import { parseSseData } from './parseSseData';
import type {
  ConversationStreamHandlers,
  QoderSessionsConversationParams,
} from './types';

/**
 * 文件分析对话（SSE）
 * POST /qoderSessions/conversation
 * 流式例外：不用 @/utils/request；不包 ResponseStructure
 */
export async function QoderSessionsConversationApi(
  params: QoderSessionsConversationParams,
  handlers: ConversationStreamHandlers = {},
): Promise<void> {
  const { onSession, onDelta, onRenderCode, onDone, onError, signal } =
    handlers;
  const url = `${ApiUrl}/qoderSessions/conversation`;

  try {
    await fetchEventSource(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: params.fileName,
        fileContent: params.fileContent,
      }),
      signal,
      openWhenHidden: true,
      async onopen(response) {
        if (response.ok) {
          return;
        }
        const text = await response.text().catch(() => '');
        throw new Error(text || `分析请求失败（${response.status}）`);
      },
      onmessage(ev) {
        if (!ev.data) {
          return;
        }
        const parsed = parseSseData(ev.data);
        if (!parsed) {
          console.warn(
            '[qoderSessions/conversation] skip bad SSE frame',
            ev.data,
          );
          return;
        }
        if (parsed.sessionId) {
          onSession?.(parsed.sessionId);
        }
        if (parsed.content) {
          onDelta?.(parsed.content);
        }
        if (parsed.renderCode) {
          onRenderCode?.(parsed.renderCode);
        }
        if (parsed.status === 'STOP') {
          onDone?.();
        }
      },
      onerror(err) {
        // 抛出以停止库默认重试
        throw err;
      },
    });
  } catch (err) {
    if (signal?.aborted) {
      return;
    }
    const error = err instanceof Error ? err : new Error('分析流异常');
    onError?.(error);
    throw error;
  }
}
