import axios, { type AxiosRequestConfig } from 'axios';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type HttpRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
};

let authToken: string | null = null;
const axiosClient = axios.create();

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
  };

  try {
    const response = await axiosClient.request<TResponse>(config);
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
