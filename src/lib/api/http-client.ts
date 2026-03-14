import axios, { type AxiosRequestConfig } from 'axios';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type HttpRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
};

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
  };

  try {
    const response = await axios.request<TResponse>(config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage =
        typeof error.response?.data === 'string'
          ? error.response.data
          : error.response?.data?.message ?? error.message;

      throw new Error(errorMessage || `HTTP ${error.response?.status ?? 'request_failed'}`);
    }

    throw error;
  }
}
