// @ts-nocheck
import { useSessionStore } from '../session-store';

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

import { env } from '../env';

const API_BASE_URL = env.VITE_API_URL;

export interface RequestConfig<TData = unknown> extends Omit<RequestInit, 'body'> {
  url?: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
  params?: Record<string, unknown>;
  data?: TData;
  headers?: Record<string, string>;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
}

export type ResponseErrorConfig<TError = unknown> = TError;

export type Client = <TData = unknown, TError = unknown, TVariables = unknown>(
  config: RequestConfig<TVariables>
) => Promise<{ data: TData }>;

export async function client<TData = any, TError = any, TVariables = any>(
  config: RequestConfig<TVariables>
): Promise<{ data: TData }> {
  let url = `${API_BASE_URL}${config.url || ''}`;

  if (config.params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(config.params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const headers = new Headers(config.headers);
  if (!(config.data instanceof FormData) && !headers.has('Content-Type') && config.data) {
    headers.set('Content-Type', 'application/json');
  }

  const options: RequestInit = {
    method: config.method,
    headers,
    credentials: 'include',
    body: config.data
      ? config.data instanceof FormData
        ? config.data
        : JSON.stringify(config.data)
      : undefined,
  };

  try {
    const response = await fetch(url, options);

    if (response.status === 401 && !config.url?.startsWith('/cofre')) {
      useSessionStore.getState().logout();
    }

    if (!response.ok) {
      let errorData: HttpErrorResponse = {};
      try {
        errorData = await response.json();
      } catch {
        // ignore
      }
      throw new HttpError(response.status, errorData);
    }

    if (response.status === 204) {
      return { data: undefined as unknown as TData };
    }

    const contentType = response.headers.get('content-type');
    let responseBody: any;
    if (contentType && contentType.includes('application/json')) {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }

    return { data: responseBody as TData };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(500, { message: error instanceof Error ? error.message : 'Erro na requisição' });
  }
}

export default client;
