import axios, { type AxiosRequestConfig, type GenericAbortSignal } from 'axios';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type HttpRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  signal?: GenericAbortSignal;
};

export class HttpRequestError<TData = unknown> extends Error {
  readonly status?: number;
  readonly data?: TData;

  constructor(message: string, options?: { status?: number; data?: TData }) {
    super(message);
    this.name = 'HttpRequestError';
    this.status = options?.status;
    this.data = options?.data;
  }
}

let authToken: string | null = null;
export const axiosClient = axios.create();

axiosClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.set('Authorization', `Bearer ${authToken}`);
  } else {
    config.headers.delete('Authorization');
  }

  return config;
});

export function setHttpAuthToken(token: string | null) {
  authToken = token;
}

export function clearHttpAuthToken() {
  authToken = null;
}

export async function httpRequest<TResponse>(url: string, options: HttpRequestOptions = {}) {
  const config: AxiosRequestConfig = {
    url,
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    data: options.body,
    timeout: options.timeout ?? 15000,
    signal: options.signal,
  };

  try {
    const response = await axiosClient.request<TResponse>(config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data;
      const errorMessage =
        typeof responseData === 'string' ? responseData : responseData?.message ?? error.message;

      throw new HttpRequestError(errorMessage || `HTTP ${error.response?.status ?? 'request_failed'}`, {
        status: error.response?.status,
        data: responseData,
      });
    }

    throw error;
  }
}
