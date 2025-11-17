const API_BASE_URL = (import.meta.env?.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

export interface ApiErrorPayload {
  error?: string;
  details?: unknown;
  traceId?: string;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  traceId?: string;

  constructor(message: string, status: number, payload?: ApiErrorPayload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = payload?.details;
    this.traceId = payload?.traceId;
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const normalizePath = (path: string) => (path.startsWith('/') ? path : `/${path}`);

const parseJSON = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

export const buildQueryString = (params: Record<string, string | number | undefined | null>) => {
const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    query.append(key, String(value));
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};

export class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async request<T>(method: HttpMethod, path: string, body?: unknown, init?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${normalizePath(path)}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    };

    try {
      const response = await fetch(url, {
        method,
        body: body ? JSON.stringify(body) : undefined,
        ...init,
        headers
      });

      const data = await parseJSON(response);

      if (!response.ok) {
        const payload = (typeof data === 'object' && data !== null ? data : undefined) as ApiErrorPayload | undefined;
        throw new ApiError(payload?.error ?? 'Request failed', response.status, payload);
      }

      return data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network request failed', 0, { details: error });
    }
  }

  get<T>(path: string, init?: RequestInit) {
    return this.request<T>('GET', path, undefined, init);
  }

  post<T>(path: string, body?: unknown, init?: RequestInit) {
    return this.request<T>('POST', path, body, init);
  }

  patch<T>(path: string, body?: unknown, init?: RequestInit) {
    return this.request<T>('PATCH', path, body, init);
  }

  delete<T>(path: string, init?: RequestInit) {
    return this.request<T>('DELETE', path, undefined, init);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
