const API_BASE = '';

function getToken(): string | null {
  return localStorage.getItem('token');
}

function csrfSafeMethod(method: string): boolean {
  return /^(GET|HEAD|OPTIONS|TRACE)$/i.test(method);
}

export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const method = (options.method || 'GET').toUpperCase();
  if (!csrfSafeMethod(method)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  return fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
    credentials: 'include',
  });
}

export async function apiPost(url: string, data: unknown): Promise<Response> {
  return apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiGet(url: string): Promise<Response> {
  return apiRequest(url, { method: 'GET' });
}

export async function apiDelete(url: string): Promise<Response> {
  return apiRequest(url, { method: 'DELETE' });
}

export async function apiPut(url: string, data: unknown): Promise<Response> {
  return apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}