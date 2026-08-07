export type QoderSessionsConversationParams = {
  fileName?: string;
  fileContent: string;
};

export type SseResponse = {
  sessionId?: string;
  content?: string;
  renderCode?: string | null;
  eventId?: string;
  /** 后端常见：RUNNING / STOP */
  status?: string;
};

export type ConversationStreamHandlers = {
  onSession?: (sessionId: string) => void;
  onDelta?: (content: string) => void;
  onRenderCode?: (renderCode: string) => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
};
