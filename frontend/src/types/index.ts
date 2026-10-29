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

// ==========================================
// MÓDULO DASHBOARD & AUDITORIA (ETAPA 5)
// ==========================================

export interface DashboardKpis {
  totalReceivedCents: number
  totalReceivedFormatted: number
  pendingReceivablesCents: number
  pendingReceivablesFormatted: number
  overdueReceivablesCents: number
  overdueReceivablesFormatted: number
  paidExpensesCents: number
  paidExpensesFormatted: number
  realizedNetBalanceCents: number
  realizedNetBalanceFormatted: number
  activeContractsCount: number
  totalCustomersCount: number
  ongoingTasksCount: number
  upcomingEventsCount: number
}

export interface UrgentOverdueInvoice {
  receivableId: string
  invoiceTitle: string
  customerName: string
  customerPhone?: string
  customerEmail?: string
  amountCents: number
  amountFormatted: number
  remainingCents: number
  remainingFormatted: number
  dueDate: string
  daysOverdue: number
  contractTitle?: string
}

export interface UpcomingCommitment {
  id: string
  title: string
  date: string
  type: string
  typeName: string
  customerName?: string
  locationOrLink?: string
  isCompleted: boolean
}

export interface MonthlyCashFlowPoint {
  month: string
  receivedCents: number
  receivedFormatted: number
  expensesCents: number
  expensesFormatted: number
  netCents: number
  netFormatted: number
}

export interface DashboardActivityItem {
  id: string
  action: string
  entityName: string
  description: string
  timestampUtc: string
  userFullName?: string
}

export interface DashboardOverview {
  kpis: DashboardKpis
  urgentOverdueInvoices: UrgentOverdueInvoice[]
  upcomingCommitments: UpcomingCommitment[]
  monthlyCashFlowSeries: MonthlyCashFlowPoint[]
  recentActivities: DashboardActivityItem[]
}

export interface AuditLog {
  id: string
  workspaceId?: string
  userId?: string
  userFullName?: string
  action: string
  entityName: string
  entityId: string
  changesJson?: string
  timestampUtc: string
}

// ==========================================
// MÓDULO FINANCEIRO (ETAPA 4)
// ==========================================

export type ReceivableStatus = 'Pending' | 'PartiallyPaid' | 'Paid' | 'Overdue' | 'Cancelled'

export type ReceivableCategory =
  | 'ServiceExecution'
  | 'Consulting'
  | 'RecurringSubscription'
  | 'Advisory'
  | 'AdvancePayment'
  | 'Other'

export type ExpenseStatus = 'Pending' | 'Paid' | 'Overdue' | 'Cancelled'

export type ExpenseCategory =
  | 'SoftwareAndTools'
  | 'OfficeAndCoworking'
  | 'MarketingAndSales'
  | 'TaxesAndAccounting'
  | 'EquipmentAndHardware'
  | 'ThirdPartyServices'
  | 'SalariesAndWithdrawals'
  | 'Other'

export type PaymentMethod =
  | 'Pix'
  | 'CreditCard'
  | 'DebitCard'
  | 'BankSlip'
  | 'BankTransfer'
  | 'Cash'
  | 'Other'

export interface Payment {
  id: string
  receivableId: string
  amountCents: number
  amountFormatted: number
  paymentDate: string
  method: PaymentMethod
  methodName: string
  transactionReference?: string
  notes?: string
  idempotencyKey?: string
  createdAtUtc: string
}

export interface Receivable {
  id: string
  customerId: string
  customerName: string
  customerDocument?: string
  contractId?: string
  contractTitle?: string
  title: string
  description?: string
  category: ReceivableCategory
  categoryName: string
  amountCents: number
  amountFormatted: number
  paidAmountCents: number
  paidAmountFormatted: number
  remainingAmountCents: number
  remainingAmountFormatted: number
  dueDate: string
  issueDate: string
  status: ReceivableStatus
  statusName: string
  installmentNumber?: number
  totalInstallments?: number
  notes?: string
  createdAtUtc: string
  payments: Payment[]
}

export interface CreateReceivablePayload {
  customerId: string
  contractId?: string
  title: string
  description?: string
  category: ReceivableCategory
  amountCents: number
  dueDate: string
  issueDate?: string
  totalInstallments?: number
  notes?: string
}

export interface UpdateReceivablePayload {
  customerId: string
  contractId?: string
  title: string
  description?: string
  category: ReceivableCategory
  amountCents: number
  dueDate: string
  issueDate?: string
  installmentNumber?: number
  totalInstallments?: number
  notes?: string
}

export interface RegisterPaymentPayload {
  amountCents: number
  paymentDate?: string
  method: PaymentMethod
  notes?: string
  transactionReference?: string
  idempotencyKey?: string
}

export interface Expense {
  id: string
  description: string
  category: ExpenseCategory
  categoryName: string
  amountCents: number
  amountFormatted: number
  dueDate: string
  paymentDate?: string
  status: ExpenseStatus
  statusName: string
  paymentMethod?: PaymentMethod
  paymentMethodName?: string
  supplier?: string
  notes?: string
  createdAtUtc: string
}

export interface CreateExpensePayload {
  description: string
  category: ExpenseCategory
  amountCents: number
  dueDate: string
  supplier?: string
  notes?: string
  isAlreadyPaid: boolean
  paymentDate?: string
  paymentMethod?: PaymentMethod
}

export interface UpdateExpensePayload {
  description: string
  category: ExpenseCategory
  amountCents: number
  dueDate: string
  supplier?: string
  notes?: string
}

export interface PayExpensePayload {
  paymentDate?: string
  method: PaymentMethod
  notes?: string
}

export interface DailyFlowItem {
  date: string
  inflowCents: number
  inflowFormatted: number
  outflowCents: number
  outflowFormatted: number
  netCents: number
  netFormatted: number
}

export interface CategoryDistribution {
  categoryName: string
  amountCents: number
  amountFormatted: number
  percentage: number
  type: 'Expense' | 'Receivable'
}

export interface FinancialActivity {
  id: string
  title: string
  category?: string
  type: 'Inflow' | 'Outflow'
  amountCents: number
  amountFormatted: number
  date: string
  status: string
  reference?: string
}

export interface CashFlowSummary {
  startDate: string
  endDate: string

  totalReceivablesPendingCents: number
  totalReceivablesPendingFormatted: number

  totalReceivablesOverdueCents: number
  totalReceivablesOverdueFormatted: number

  totalReceivablesPaidCents: number
  totalReceivablesPaidFormatted: number

  totalExpensesPendingCents: number
  totalExpensesPendingFormatted: number

  totalExpensesOverdueCents: number
  totalExpensesOverdueFormatted: number

  totalExpensesPaidCents: number
  totalExpensesPaidFormatted: number

  realizedNetBalanceCents: number
  realizedNetBalanceFormatted: number

  projectedNetBalanceCents: number
  projectedNetBalanceFormatted: number

  dailyFlow: DailyFlowItem[]
  categoryDistribution: CategoryDistribution[]
  recentActivities: FinancialActivity[]
}

export interface SimulatePaymentPayload {
  receivableId: string
  amountCents: number
  method: PaymentMethod
  idempotencyKey: string
  customerDocument?: string
  cardNumberMock?: string
  cardHolderMock?: string
  notes?: string
}

export interface SimulatePaymentResponse {
  receiptId: string
  idempotencyKey: string
  isIdempotentReplay: boolean
  status: string
  receivableId: string
  receivableTitle: string
  customerName: string
  amountPaidCents: number
  amountPaidFormatted: number
  remainingBalanceCents: number
  remainingBalanceFormatted: number
  receivableNewStatus: string
  paymentMethodName: string
  transactionAuthorizationCode: string
  pixQrCodePayload?: string
  processedAtUtc: string
  message: string
}

