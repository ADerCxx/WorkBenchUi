import { QoderSessionsCancelApi } from '@/apis/qoderSessions/cancel';
import { QoderSessionsConversationApi } from '@/apis/qoderSessions/conversation';
import { useCallback, useEffect, useRef, useState } from 'react';

export type AnalysisStreamStatus = 'idle' | 'running' | 'error';

export type UseAnalysisStreamResult = {
  status: AnalysisStreamStatus;
  markdown: string;
  sessionId: string | null;
  errorMessage: string | null;
  start: (input: { fileName: string; fileContent: string }) => Promise<void>;
  abortAndCancel: () => Promise<void>;
};

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === 'AbortError') ||
    (err instanceof Error && err.name === 'AbortError')
  );
}

export function useAnalysisStream(): UseAnalysisStreamResult {
  const [status, setStatus] = useState<AnalysisStreamStatus>('idle');
  const [markdown, setMarkdown] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const runIdRef = useRef(0);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const abortAndCancel = useCallback(async () => {
    runIdRef.current++;
    const controller = abortRef.current;
    abortRef.current = null;
    controller?.abort();

    const id = sessionIdRef.current;
    sessionIdRef.current = null;
    setSessionId(null);
    setStatus('idle');

    if (id) {
      void QoderSessionsCancelApi(id).catch(() => undefined);
    }
  }, []);

  const start = useCallback(
    async (input: { fileName: string; fileContent: string }) => {
      await abortAndCancel();

      const runId = ++runIdRef.current;
      const controller = new AbortController();
      abortRef.current = controller;

      setMarkdown('');
      setErrorMessage(null);
      setSessionId(null);
      sessionIdRef.current = null;
      setStatus('running');

      try {
        await QoderSessionsConversationApi(
          {
            fileName: input.fileName,
            fileContent: input.fileContent,
          },
          {
            signal: controller.signal,
            onSession: (id) => {
              if (runId !== runIdRef.current) return;
              sessionIdRef.current = id;
              setSessionId(id);
            },
            onDelta: (chunk) => {
              if (runId !== runIdRef.current) return;
              setMarkdown((prev) => prev + chunk);
            },
            onDone: () => {
              if (runId !== runIdRef.current) return;
              setStatus('idle');
            },
            onError: (err) => {
              if (runId !== runIdRef.current) return;
              if (isAbortError(err) || controller.signal.aborted) return;
              setErrorMessage(err.message || '分析失败');
              setStatus('error');
            },
          },
        );

        if (runId === runIdRef.current && !controller.signal.aborted) {
          setStatus((prev) => (prev === 'error' ? prev : 'idle'));
        }
      } catch (err) {
        if (runId !== runIdRef.current) return;
        if (isAbortError(err) || controller.signal.aborted) {
          setStatus('idle');
          return;
        }
        const msg = err instanceof Error ? err.message : '分析失败';
        setErrorMessage(msg);
        setStatus('error');
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    },
    [abortAndCancel],
  );

  useEffect(() => {
    return () => {
      runIdRef.current++;
      const controller = abortRef.current;
      abortRef.current = null;
      controller?.abort();
      const id = sessionIdRef.current;
      sessionIdRef.current = null;
      if (id) {
        void QoderSessionsCancelApi(id).catch(() => undefined);
      }
    };
  }, []);

  return {
    status,
    markdown,
    sessionId,
    errorMessage,
    start,
    abortAndCancel,
  };
}
