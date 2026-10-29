namespace ServiCore.Application.Features.Dashboard.DTOs;

public record DashboardKpisDto(
    long TotalReceivedCents,
    decimal TotalReceivedFormatted,

    long PendingReceivablesCents,
    decimal PendingReceivablesFormatted,

    long OverdueReceivablesCents,
    decimal OverdueReceivablesFormatted,

    long PaidExpensesCents,
    decimal PaidExpensesFormatted,

    long RealizedNetBalanceCents,
    decimal RealizedNetBalanceFormatted,

    int ActiveContractsCount,
    int TotalCustomersCount,
    int OngoingTasksCount,
    int UpcomingEventsCount
);

public record UrgentOverdueInvoiceDto(
    Guid ReceivableId,
    string InvoiceTitle,
    string CustomerName,
    string? CustomerPhone,
    string? CustomerEmail,
    long AmountCents,
    decimal AmountFormatted,
    long RemainingCents,
    decimal RemainingFormatted,
    DateTime DueDate,
    int DaysOverdue,
    string? ContractTitle
);

public record UpcomingCommitmentDto(
    Guid Id,
    string Title,
    DateTime Date,
    string Type, // "Meeting", "Delivery", "TaskDeadline", "FollowUp"
    string TypeName,
    string? CustomerName,
    string? LocationOrLink,
    bool IsCompleted
);

public record MonthlyCashFlowPointDto(
    string Month, // "Mai/26", "Jun/26", etc.
    long ReceivedCents,
    decimal ReceivedFormatted,
    long ExpensesCents,
    decimal ExpensesFormatted,
    long NetCents,
    decimal NetFormatted
);

public record DashboardActivityItemDto(
    Guid Id,
    string Action,
    string EntityName,
    string Description,
    DateTime TimestampUtc,
    string? UserFullName
);

public record DashboardOverviewDto(
    DashboardKpisDto Kpis,
    List<UrgentOverdueInvoiceDto> UrgentOverdueInvoices,
    List<UpcomingCommitmentDto> UpcomingCommitments,
    List<MonthlyCashFlowPointDto> MonthlyCashFlowSeries,
    List<DashboardActivityItemDto> RecentActivities
);
