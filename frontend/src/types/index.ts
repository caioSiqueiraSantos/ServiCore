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

// ----------------------------------------------------
// ETAPA 3 — TIPOS DE CONTRATOS, SERVIÇOS, TAREFAS E AGENDA
// ----------------------------------------------------

export type ContractBillingType = 'FixedPrice' | 'Hourly' | 'Recurring'
export type ContractStatus = 'Draft' | 'Active' | 'Completed' | 'Suspended' | 'Cancelled'

export interface ContractItem {
  id: string
  contractId: string
  serviceItemId?: string
  serviceItemName?: string
  description: string
  quantity: number
  unitPriceCents: number
  totalPriceCents: number
}

export interface Contract {
  id: string
  workspaceId: string
  customerId: string
  customerName: string
  title: string
  description?: string
  type: ContractBillingType
  status: ContractStatus
  amountCents: number
  amountDecimal: number
  estimatedHours?: number
  startDate: string
  endDate?: string
  terms?: string
  tasksCount: number
  completedTasksCount: number
  attachmentsCount: number
  items: ContractItem[]
  createdAtUtc: string
  updatedAtUtc?: string
}

export interface CreateContractPayload {
  customerId: string
  title: string
  description?: string
  type: ContractBillingType
  amountCents: number
  estimatedHours?: number
  startDate: string
  endDate?: string
  terms?: string
  items?: Array<{
    serviceItemId?: string
    description: string
    quantity: number
    unitPriceCents: number
  }>
}

export interface UpdateContractPayload {
  customerId: string
  title: string
  description?: string
  type: ContractBillingType
  amountCents: number
  estimatedHours?: number
  startDate: string
  endDate?: string
  terms?: string
}

export interface ContractFilterParams {
  search?: string
  customerId?: string
  type?: ContractBillingType
  status?: ContractStatus
  page?: number
  pageSize?: number
  sortBy?: string
  sortDescending?: boolean
}

export interface ContractMetrics {
  totalContracts: number
  activeContracts: number
  draftContracts: number
  completedContracts: number
  totalActiveValueCents: number
  monthlyRecurringRevenueCents: number
}

export interface ContractAttachment {
  id: string
  contractId: string
  fileName: string
  contentType: string
  fileSizeBytes: number
  storageKeyOrUrl?: string
  description?: string
  uploadedAtUtc: string
}

export type ServiceBillingUnit = 'Hour' | 'Project' | 'Month' | 'Deliverable' | 'Unit'
export type ServiceStatus = 'Active' | 'Inactive'

export interface ServiceItem {
  id: string
  workspaceId: string
  name: string
  description?: string
  defaultPriceCents: number
  defaultPriceDecimal: number
  billingUnit: ServiceBillingUnit
  estimatedHours?: number
  status: ServiceStatus
  createdAtUtc: string
  updatedAtUtc?: string
}

export interface CreateServicePayload {
  name: string
  description?: string
  defaultPriceCents: number
  billingUnit: ServiceBillingUnit
  estimatedHours?: number
}

export interface UpdateServicePayload {
  name: string
  description?: string
  defaultPriceCents: number
  billingUnit: ServiceBillingUnit
  estimatedHours?: number
  status: ServiceStatus
}

export interface ServiceFilterParams {
  search?: string
  status?: ServiceStatus
  billingUnit?: ServiceBillingUnit
  page?: number
  pageSize?: number
  sortBy?: string
  sortDescending?: boolean
}

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent'
export type TaskItemStatus = 'Pending' | 'InProgress' | 'Completed' | 'Cancelled'

export interface TaskItem {
  id: string
  workspaceId: string
  title: string
  description?: string
  customerId?: string
  customerName?: string
  contractId?: string
  contractTitle?: string
  serviceItemId?: string
  serviceItemName?: string
  priority: TaskPriority
  status: TaskItemStatus
  dueDate?: string
  estimatedMinutes?: number
  spentMinutes?: number
  completedAtUtc?: string
  createdAtUtc: string
  updatedAtUtc?: string
}

export interface CreateTaskPayload {
  title: string
  description?: string
  customerId?: string
  contractId?: string
  serviceItemId?: string
  priority: TaskPriority
  dueDate?: string
  estimatedMinutes?: number
}

export interface UpdateTaskPayload {
  title: string
  description?: string
  customerId?: string
  contractId?: string
  serviceItemId?: string
  priority: TaskPriority
  dueDate?: string
  estimatedMinutes?: number
  spentMinutes?: number
}

export interface TaskFilterParams {
  search?: string
  status?: TaskItemStatus
  priority?: TaskPriority
  customerId?: string
  contractId?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDescending?: boolean
}

export type CalendarEventType = 'Meeting' | 'Delivery' | 'FollowUp' | 'TaskDeadline' | 'Internal'
export type CalendarEventStatus = 'Scheduled' | 'Completed' | 'Cancelled'

export interface CalendarEvent {
  id: string
  workspaceId: string
  title: string
  description?: string
  locationOrLink?: string
  startTimeUtc: string
  endTimeUtc: string
  type: CalendarEventType
  status: CalendarEventStatus
  customerId?: string
  customerName?: string
  contractId?: string
  contractTitle?: string
  taskItemId?: string
  taskItemTitle?: string
  createdAtUtc: string
}

export interface CreateCalendarEventPayload {
  title: string
  description?: string
  locationOrLink?: string
  startTimeUtc: string
  endTimeUtc: string
  type: CalendarEventType
  customerId?: string
  contractId?: string
  taskItemId?: string
}

export interface UpdateCalendarEventPayload {
  title: string
  description?: string
  locationOrLink?: string
  startTimeUtc: string
  endTimeUtc: string
  type: CalendarEventType
  customerId?: string
  contractId?: string
  taskItemId?: string
}

export interface CalendarFilterParams {
  startDate?: string
  endDate?: string
  type?: CalendarEventType
  customerId?: string
  includeTaskDeadlines?: boolean
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
