export interface RegexRule {
  id: string;
  name: string;
  pattern: string;
  description: string;
  enabled: boolean;
  updatedAt: string;
}

export interface RegexListForm {
  name?: string;
  enabled?: boolean;
}

export interface RegexCreateParams {
  name: string;
  pattern: string;
  description?: string;
  enabled?: boolean;
}

export interface RegexUpdateParams {
  id: string;
  name: string;
  pattern: string;
  description?: string;
  enabled?: boolean;
}

export interface RegexToggleParams {
  id: string;
  enabled: boolean;
}

export interface RegexDeleteParams {
  id: string;
}
