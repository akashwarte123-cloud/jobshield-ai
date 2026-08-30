/**
 * JobShield AI API Client Service
 */

const BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});

  // 1. Auto-inject bearer token
  const authStr = localStorage.getItem('js_logged_in_user');
  if (authStr) {
    try {
      const parsed = JSON.parse(authStr);
      if (parsed && parsed.token) {
        headers.set('Authorization', `Bearer ${parsed.token}`);
      }
    } catch (e) {
      // ignore
    }
  }

  // 2. Set default content type if not set and body is present
  if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  // 3. Handle HTTP 401 selectively
  if (response.status === 401) {
    const isAuthPath = path.startsWith('/auth/login') || path.startsWith('/auth/register');
    if (!isAuthPath) {
      // Clear session for authenticated request failures
      localStorage.removeItem('js_logged_in_user');
      
      // Dispatch custom event to let App.tsx reset views reactively
      window.dispatchEvent(new CustomEvent('js_unauthorized'));
    }
  }

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      // Fallback on invalid JSON responses
    }
    throw new Error(errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  get: <T>(path: string, options?: RequestInit) => 
    request<ApiResponse<T>>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: any, options?: RequestInit) => 
    request<ApiResponse<T>>(path, { 
      ...options, 
      method: 'POST', 
      body: body ? JSON.stringify(body) : undefined 
    }),

  put: <T>(path: string, body?: any, options?: RequestInit) => 
    request<ApiResponse<T>>(path, { 
      ...options, 
      method: 'PUT', 
      body: body ? JSON.stringify(body) : undefined 
    }),

  upload: <T>(path: string, formData: FormData, options?: RequestInit) => 
    request<ApiResponse<T>>(path, {
      ...options,
      method: 'PUT',
      body: formData
    }),

  delete: <T>(path: string, options?: RequestInit) => 
    request<ApiResponse<T>>(path, { ...options, method: 'DELETE' }),

  download: async (path: string, fallbackFilename: string = 'download'): Promise<void> => {
    const url = `${BASE_URL}${path}`;
    const headers = new Headers();
    const authStr = localStorage.getItem('js_logged_in_user');
    if (authStr) {
      try {
        const parsed = JSON.parse(authStr);
        if (parsed && parsed.token) {
          headers.set('Authorization', `Bearer ${parsed.token}`);
        }
      } catch (e) {}
    }

    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson?.error?.message) errorMsg = errJson.error.message;
      } catch (e) {}
      throw new Error(errorMsg);
    }

    let filename = fallbackFilename;
    const disposition = response.headers.get('Content-Disposition');
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '').trim();
      }
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 200);
  }
};
