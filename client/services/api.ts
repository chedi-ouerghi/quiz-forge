import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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
const TOKEN_KEY = '@quiz_token';

interface RequestOptions extends RequestInit {
  data?: any;
}

/**
 * Robust API Client Wrapper
 */
export const api = {
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    
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
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 401) {
          // Optional: Handle logout on unauthorized
          console.warn('API Unauthorized! Token might be expired.');
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
