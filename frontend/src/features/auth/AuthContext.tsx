import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, authStorage } from '@/lib/api'
import type { UserSummary, WorkspaceSummary, AuthResponse, UserProfile, WorkspaceType } from '@/types'

interface AuthContextType {
  user: UserSummary | null
  activeWorkspace: WorkspaceSummary | null
  availableWorkspaces: WorkspaceSummary[]
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: {
    fullName: string
    email: string
    password: string
    workspaceName: string
    workspaceType: WorkspaceType
    document?: string
  }) => Promise<void>
  logout: () => void
  switchWorkspace: (workspaceId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummary | null>(null)
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceSummary | null>(null)
  const [availableWorkspaces, setAvailableWorkspaces] = useState<WorkspaceSummary[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const logout = useCallback(() => {
    authStorage.clear()
    setUser(null)
    setActiveWorkspace(null)
    setAvailableWorkspaces([])
  }, [])

  // Carrega o perfil inicial caso haja token salvo no localStorage
  const loadProfile = useCallback(async () => {
    const token = authStorage.getToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      const profile = await api.get<UserProfile>('/auth/me')
      setUser({
        id: profile.id,
        fullName: profile.fullName,
        email: profile.email,
      })
      setAvailableWorkspaces(profile.workspaces)

      // Determina o workspace ativo
      const savedWsId = authStorage.getWorkspaceId()
      const matchingWs = profile.workspaces.find((w) => w.id === savedWsId)
      const currentWs = matchingWs || profile.workspaces[0] || null

      setActiveWorkspace(currentWs)
      if (currentWs) {
        authStorage.setWorkspaceId(currentWs.id)
      }
    } catch {
      logout()
    } finally {
      setIsLoading(false)
    }
  }, [logout])

  useEffect(() => {
    loadProfile()

    // Ouve evento global de não autorizado
    const handleUnauthorized = () => logout()
    window.addEventListener('servicore:auth:unauthorized', handleUnauthorized)

    return () => {
      window.removeEventListener('servicore:auth:unauthorized', handleUnauthorized)
    }
  }, [loadProfile, logout])

  const handleAuthSuccess = (data: AuthResponse) => {
    authStorage.setToken(data.token)
    authStorage.setWorkspaceId(data.activeWorkspace.id)
    setUser(data.user)
    setActiveWorkspace(data.activeWorkspace)
    setAvailableWorkspaces(data.availableWorkspaces)
  }

  const login = async (email: string, password: string) => {
    const data = await api.post<AuthResponse>('/auth/login', { email, password })
    handleAuthSuccess(data)
  }

  const register = async (payload: {
    fullName: string
    email: string
    password: string
    workspaceName: string
    workspaceType: WorkspaceType
    document?: string
  }) => {
    const data = await api.post<AuthResponse>('/auth/register', payload)
    handleAuthSuccess(data)
  }

  const switchWorkspace = async (workspaceId: string) => {
    const data = await api.post<AuthResponse>('/auth/switch-workspace', { workspaceId })
    handleAuthSuccess(data)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        activeWorkspace,
        availableWorkspaces,
        isAuthenticated: Boolean(user && activeWorkspace),
        isLoading,
        login,
        register,
        logout,
        switchWorkspace,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider')
  }
  return context
}
