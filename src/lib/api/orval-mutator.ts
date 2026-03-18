import type { AxiosRequestConfig, GenericAbortSignal } from 'axios';
import { apiConfig } from '@/lib/api/config';
import { httpRequest } from '@/lib/api/http-client';

type RequestConfig = AxiosRequestConfig;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

function resolveUrl(url: string) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (!apiConfig.apiBaseUrl) {
    return url;
  }

  return `${apiConfig.apiBaseUrl}${url}`;
}

function appendSearchParams(url: string, params?: Record<string, unknown>) {
  if (!params || Object.keys(params).length === 0) {
    return url;
  }

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    searchParams.append(key, String(value));
  });

  const serialized = searchParams.toString();

  if (!serialized) {
    return url;
  }

  return url.includes('?') ? `${url}&${serialized}` : `${url}?${serialized}`;
}

export async function orvalHttpClient<TData>(
  config: RequestConfig,
  options?: AxiosRequestConfig
): Promise<TData> {
  const mergedConfig: AxiosRequestConfig = {
    ...config,
    ...options,
    headers: {
      ...(config.headers ?? {}),
      ...(options?.headers ?? {}),
    },
  };

  const resolvedUrl = appendSearchParams(
    resolveUrl(mergedConfig.url ?? ''),
    mergedConfig.params as Record<string, unknown> | undefined
  );

  const method = (mergedConfig.method?.toUpperCase() ?? 'GET') as HttpMethod;

  return httpRequest<TData>(resolvedUrl, {
    method,
    body: mergedConfig.data,
    headers: (mergedConfig.headers as Record<string, string>) ?? undefined,
    timeout: mergedConfig.timeout,
    signal: mergedConfig.signal as GenericAbortSignal | undefined,
  });
}

export type ErrorType<Error> = Error;
export type BodyType<BodyData> = BodyData;
export type QueryParamsType = Record<string, unknown>;
