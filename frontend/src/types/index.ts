export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
  timestamp: string
}

export interface SystemStatusDto {
  appName: string
  version: string
  environment: string
  databaseProvider: string
  databaseCanConnect: boolean
  serverTimeUtc: string
  status: string
}

export type WorkspaceType = 'Individual' | 'Enterprise'
export type MembershipRole = 'Owner' | 'Admin' | 'Member'
export type CustomerType = 'Individual' | 'Company'
export type CustomerStatus = 'Active' | 'Inactive'

export interface UserSummary {
  id: string
  fullName: string
  email: string
}

export interface WorkspaceSummary {
  id: string
  name: string
  type: WorkspaceType
  document?: string
  role: MembershipRole
}

export interface AuthResponse {
  token: string
  expiresAtUtc: string
  user: UserSummary
  activeWorkspace: WorkspaceSummary
  availableWorkspaces: WorkspaceSummary[]
}

export interface UserProfile {
  id: string
  fullName: string
  email: string
  createdAtUtc: string
  workspaces: WorkspaceSummary[]
}

export interface Customer {
  id: string
  workspaceId: string
  type: CustomerType
  name: string
  document?: string
  email?: string
  phone?: string
  notes?: string
  status: CustomerStatus
  createdAtUtc: string
  updatedAtUtc?: string
}

export interface CreateCustomerPayload {
  name: string
  type: CustomerType
  document?: string
  email?: string
  phone?: string
  notes?: string
}

export interface UpdateCustomerPayload {
  name: string
  type: CustomerType
  document?: string
  email?: string
  phone?: string
  notes?: string
  status: CustomerStatus
}

export interface CustomerFilterParams {
  search?: string
  type?: CustomerType
  status?: CustomerStatus
  page?: number
  pageSize?: number
  sortBy?: string
  sortDescending?: boolean
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface DemoDashboardStats {
  isDemonstrative: boolean
  note: string
  period: string
  kpis: {
    totalReceivedCents: number
    pendingReceivablesCents: number
    overdueCents: number
    paidExpensesCents: number
    activeContractsCount: number
    ongoingTasksCount: number
    upcomingEventsCount: number
  }
  recentCommitments: Array<{
    title: string
    date: string
    type: string
    client: string
  }>
  cashFlowSeries: Array<{
    month: string
    received: number
    expenses: number
  }>
}
