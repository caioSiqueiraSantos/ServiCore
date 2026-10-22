import type { ApiResponse } from '@/types'

const API_BASE = '/api/v1'

const TOKEN_KEY = 'servicore_jwt_token'
const WORKSPACE_KEY = 'servicore_active_workspace_id'

export const authStorage = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  removeToken: (): void => localStorage.removeItem(TOKEN_KEY),

  getWorkspaceId: (): string | null => localStorage.getItem(WORKSPACE_KEY),
  setWorkspaceId: (id: string): void => localStorage.setItem(WORKSPACE_KEY, id),
  removeWorkspaceId: (): void => localStorage.removeItem(WORKSPACE_KEY),

  clear: (): void => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(WORKSPACE_KEY)
  },
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: string[]
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  const headers = new Headers(options?.headers)
  if (!headers.has('Content-Type') && !(options?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  // Injeta automaticamente o token JWT
  const token = authStorage.getToken()
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  // Injeta o WorkspaceId ativo caso configurado
  const workspaceId = authStorage.getWorkspaceId()
  if (workspaceId && !headers.has('X-Workspace-Id')) {
    headers.set('X-Workspace-Id', workspaceId)
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // Se sessão expirou ou não autenticado
  if (response.status === 401) {
    // Se havia token, limpa para evitar loops
    if (token) {
      authStorage.clear()
      window.dispatchEvent(new CustomEvent('servicore:auth:unauthorized'))
    }
  }

  let json: ApiResponse<T>
  try {
    json = await response.json()
  } catch {
    throw new ApiError('Falha ao processar resposta do servidor.', response.status)
  }

  if (!response.ok || !json.success) {
    throw new ApiError(
      json.message || 'Erro inesperado na comunicação com a API.',
      response.status,
      json.errors
    )
  }

  return json.data as T
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
}
