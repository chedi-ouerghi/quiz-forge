import { Platform } from 'react-native';
import { clearSession, getAccessToken, getRefreshToken, setSessionTokens } from './sessionStorage';

/**
 * Configure dynamic API URL based on platform and environment
 * In production, this should be replaced by your real server URL.
 */
const getBaseUrl = () => {
  if (__DEV__) {
    // For local development
    return Platform.OS === 'android' ? 'http://10.0.2.2:3001/api' : 'http://localhost:3001/api';
  }
  // REPLACE THIS with your production URL for deployment
  return 'https://quizforge-api.yourdomain.com/api';
};

export const API_URL = getBaseUrl();

interface RequestOptions extends RequestInit {
  data?: any;
}

let refreshPromise: Promise<string | null> | null = null;

const parseResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type');

  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return { message: await response.text() };
};

const shouldRetryWithRefresh = (endpoint: string, options: RequestOptions, hasRetried: boolean) => {
  if (hasRetried) return false;
  if ((options.method || 'GET').toUpperCase() === 'OPTIONS') return false;

  return !endpoint.includes('/auth/login')
    && !endpoint.includes('/auth/register')
    && !endpoint.includes('/auth/refresh')
    && !endpoint.includes('/auth/logout');
};

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await getRefreshToken();

      if (!refreshToken) {
        await clearSession();
        return null;
      }

      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data: any = await parseResponse(response);

      if (!response.ok || !data?.accessToken) {
        await clearSession();
        return null;
      }

      await setSessionTokens(data.accessToken, data.refreshToken || refreshToken);
      return data.accessToken as string;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

/**
 * Robust API Client Wrapper
 */
export const api = {
  async request<T>(endpoint: string, options: RequestOptions = {}, hasRetried = false): Promise<T> {
    const token = await getAccessToken();
    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    } as HeadersInit;

    const config: RequestInit = {
      ...options,
      headers,
    };

    if (options.data) {
      config.body = JSON.stringify(options.data);
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 401 && shouldRetryWithRefresh(endpoint, options, hasRetried)) {
        const nextAccessToken = await refreshAccessToken();

        if (nextAccessToken) {
          return this.request<T>(
            endpoint,
            {
              ...options,
              headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${nextAccessToken}`,
              },
            },
            true,
          );
        }
      }

      const data = await parseResponse(response);

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('API Unauthorized! Session is no longer valid.');
        }
        
        const error = new Error(data.message || `API Error ${response.status}`);
        (error as any).status = response.status;
        (error as any).data = data;
        throw error;
      }

      return data as T;
    } catch (error: any) {
      console.error(`[API ERROR] ${options.method || 'GET'} ${endpoint}:`, error);
      throw error;
    }
  },

  get<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, data?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'POST', data });
  },

  put<T>(endpoint: string, data?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', data });
  },

  delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};
