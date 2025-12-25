export type ApiError = {
  status: number;
  message: string;
  error?: string;
  details?: unknown;
  path?: string;
  timestamp?: string;
  raw?: unknown;
};

export type DebugRequest = {
  url: string;
  method: string;
  headers: Record<string, string>;
};

export type DebugResponse = {
  status: number;
  bodySnippet: string;
};

export type DebugState = {
  request?: DebugRequest;
  response?: DebugResponse;
};
