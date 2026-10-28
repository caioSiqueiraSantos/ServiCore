namespace ServiCore.Application.Features.Finance.DTOs;

public record DailyFlowItemDto(
    string Date,
    long InflowCents,
    decimal InflowFormatted,
    long OutflowCents,
    decimal OutflowFormatted,
    long NetCents,
    decimal NetFormatted
);

public record CategoryDistributionDto(
    string CategoryName,
    long AmountCents,
    decimal AmountFormatted,
    decimal Percentage,
    string Type // "Receivable" ou "Expense"
);

public record FinancialActivityDto(
    Guid Id,
    string Title,
    string? Category,
    string Type, // "Inflow" (Entrada) ou "Outflow" (Saída)
    long AmountCents,
    decimal AmountFormatted,
    DateTime Date,
    string Status,
    string? Reference
);

public record CashFlowSummaryDto(
    DateTime StartDate,
    DateTime EndDate,

    long TotalReceivablesPendingCents,
    decimal TotalReceivablesPendingFormatted,

    long TotalReceivablesOverdueCents,
    decimal TotalReceivablesOverdueFormatted,

    long TotalReceivablesPaidCents,
    decimal TotalReceivablesPaidFormatted,

    long TotalExpensesPendingCents,
    decimal TotalExpensesPendingFormatted,

    long TotalExpensesOverdueCents,
    decimal TotalExpensesOverdueFormatted,

    long TotalExpensesPaidCents,
    decimal TotalExpensesPaidFormatted,

    long RealizedNetBalanceCents,
    decimal RealizedNetBalanceFormatted,

    long ProjectedNetBalanceCents,
    decimal ProjectedNetBalanceFormatted,

    List<DailyFlowItemDto> DailyFlow,
    List<CategoryDistributionDto> CategoryDistribution,
    List<FinancialActivityDto> RecentActivities
);
