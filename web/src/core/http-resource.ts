import { useSessionStore } from './session-store';

export interface HttpErrorResponse {
  message?: string;
}

export class HttpError extends Error {
  status: number;
  data: HttpErrorResponse;

  constructor(status: number, data: HttpErrorResponse) {
    super(data.message || `HTTP error ${status}`);
    this.status = status;
    this.data = data;
    this.name = 'HttpError';
  }
}

const API_BASE_URL = '/api';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Necessário para enviar e receber cookies HttpOnly
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      // Se receber 401 Unauthorized, limpa a sessão local
      useSessionStore.getState().logout();
    }

    if (!response.ok) {
      let errorData: HttpErrorResponse = {};
      try {
        errorData = await response.json();
      } catch {
        // Response body não é JSON ou está vazio
      }
      throw new HttpError(response.status, errorData);
    }

    // Se for 204 ou resposta vazia, retorna undefined como T
    if (response.status === 204) {
      return undefined as unknown as T;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return (await response.text()) as unknown as T;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(500, { message: error instanceof Error ? error.message : 'Erro na requisição' });
  }
}

export const http = {
  get: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
