using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ServiCore.Application.Common.Interfaces;
using ServiCore.Application.Common.Models;
using ServiCore.Application.Features.Dashboard.DTOs;
using ServiCore.Domain.Enums;

namespace ServiCore.Api.Controllers;

[Authorize]
public class DashboardController : ApiControllerBase
{
    private readonly IAppDbContext _context;
    private readonly ICurrentWorkspaceService _currentWorkspaceService;

    public DashboardController(
        IAppDbContext context,
        ICurrentWorkspaceService currentWorkspaceService)
    {
        _context = context;
        _currentWorkspaceService = currentWorkspaceService;
    }

    /// <summary>
    /// Retorna a visão geral consolidada em tempo real do dashboard com métricas de todos os módulos.
    /// </summary>
    [HttpGet("overview")]
    public async Task<ActionResult<ApiResponse<DashboardOverviewDto>>> GetOverview()
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<DashboardOverviewDto>.Fail("Workspace não identificado."));

        var now = DateTime.UtcNow;

        // 1. Clientes e Contratos
        var totalCustomersCount = await _context.Customers
            .CountAsync(c => c.Status == CustomerStatus.Active);

        var activeContractsCount = await _context.Contracts
            .CountAsync(c => c.Status == ContractStatus.Active);

        // 2. Tarefas e Compromissos
        var ongoingTasksCount = await _context.Tasks
            .CountAsync(t => t.Status == TaskItemStatus.Pending || t.Status == TaskItemStatus.InProgress);

        var upcomingEventsCount = await _context.CalendarEvents
            .CountAsync(e => e.StartTimeUtc >= now && e.StartTimeUtc <= now.AddDays(7) && e.Status != CalendarEventStatus.Cancelled);

        // 3. Contas a Receber e Pagamentos
        var receivables = await _context.Receivables
            .Include(r => r.Customer)
            .Include(r => r.Contract)
            .AsNoTracking()
            .ToListAsync();

        var allPayments = await _context.Payments
            .AsNoTracking()
            .ToListAsync();

        long totalReceivedCents = allPayments
            .Sum(p => p.Amount.Cents);

        long pendingReceivablesCents = 0;
        long overdueReceivablesCents = 0;
        var urgentOverdueList = new List<UrgentOverdueInvoiceDto>();

        foreach (var r in receivables)
        {
            if (r.Status == ReceivableStatus.Cancelled || r.Status == ReceivableStatus.Paid)
                continue;

            var isOverdue = r.Status == ReceivableStatus.Overdue || r.DueDate < now;
            if (isOverdue)
            {
                overdueReceivablesCents += r.RemainingAmount.Cents;
                var daysOverdue = Math.Max(1, (int)(now.Date - r.DueDate.Date).TotalDays);

                urgentOverdueList.Add(new UrgentOverdueInvoiceDto(
                    r.Id,
                    r.Title,
                    r.Customer.Name,
                    r.Customer.Phone,
                    r.Customer.Email,
                    r.Amount.Cents,
                    r.Amount.ToDecimal(),
                    r.RemainingAmount.Cents,
                    r.RemainingAmount.ToDecimal(),
                    r.DueDate,
                    daysOverdue,
                    r.Contract?.Title
                ));
            }
            else
            {
                pendingReceivablesCents += r.RemainingAmount.Cents;
            }
        }

        // Ordena faturas vencidas pela maior criticidade (mais dias de atraso e maior valor)
        urgentOverdueList = urgentOverdueList
            .OrderByDescending(x => x.DaysOverdue)
            .ThenByDescending(x => x.RemainingCents)
            .Take(5)
            .ToList();

        // 4. Despesas
        var allExpenses = await _context.Expenses
            .AsNoTracking()
            .ToListAsync();

        long paidExpensesCents = allExpenses
            .Where(e => e.Status == ExpenseStatus.Paid)
            .Sum(e => e.Amount.Cents);

        long realizedNetBalanceCents = totalReceivedCents - paidExpensesCents;

        var kpis = new DashboardKpisDto(
            totalReceivedCents,
            totalReceivedCents / 100m,
            pendingReceivablesCents,
            pendingReceivablesCents / 100m,
            overdueReceivablesCents,
            overdueReceivablesCents / 100m,
            paidExpensesCents,
            paidExpensesCents / 100m,
            realizedNetBalanceCents,
            realizedNetBalanceCents / 100m,
            activeContractsCount,
            totalCustomersCount,
            ongoingTasksCount,
            upcomingEventsCount
        );

        // 5. Próximos Compromissos (Eventos de agenda + Tarefas com prazo nos próximos 14 dias)
        var upcomingEvents = await _context.CalendarEvents
            .Include(e => e.Customer)
            .Where(e => e.StartTimeUtc >= now.AddHours(-2) && e.StartTimeUtc <= now.AddDays(14) && e.Status != CalendarEventStatus.Cancelled)
            .OrderBy(e => e.StartTimeUtc)
            .Take(6)
            .ToListAsync();

        var upcomingTasksWithDeadline = await _context.Tasks
            .Include(t => t.Customer)
            .Where(t => t.DueDate.HasValue && t.DueDate.Value >= now.AddDays(-1) && t.DueDate.Value <= now.AddDays(14) && t.Status != TaskItemStatus.Completed && t.Status != TaskItemStatus.Cancelled)
            .OrderBy(t => t.DueDate)
            .Take(4)
            .ToListAsync();

        var commitments = new List<UpcomingCommitmentDto>();

        foreach (var ev in upcomingEvents)
        {
            commitments.Add(new UpcomingCommitmentDto(
                ev.Id,
                ev.Title,
                ev.StartTimeUtc,
                ev.Type.ToString(),
                GetCalendarEventTypeName(ev.Type),
                ev.Customer?.Name,
                ev.LocationOrLink,
                ev.Status == CalendarEventStatus.Completed
            ));
        }

        foreach (var task in upcomingTasksWithDeadline)
        {
            commitments.Add(new UpcomingCommitmentDto(
                task.Id,
                $"Entrega de Tarefa: {task.Title}",
                task.DueDate!.Value,
                "TaskDeadline",
                "Prazo Operacional",
                task.Customer?.Name,
                null,
                false
            ));
        }

        commitments = commitments.OrderBy(c => c.Date).Take(8).ToList();

        // 6. Série Mensal de Fluxo de Caixa (Últimos 6 meses)
        var monthlySeries = new List<MonthlyCashFlowPointDto>();
        var currentMonthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var payments = await _context.Payments
            .Where(p => p.PaymentDate >= currentMonthStart.AddMonths(-5))
            .AsNoTracking()
            .ToListAsync();

        var paidExpenses = allExpenses
            .Where(e => e.Status == ExpenseStatus.Paid && e.PaymentDate.HasValue && e.PaymentDate >= currentMonthStart.AddMonths(-5))
            .ToList();

        for (int i = 5; i >= 0; i--)
        {
            var mStart = currentMonthStart.AddMonths(-i);
            var mEnd = mStart.AddMonths(1);

            var inMonthCents = payments
                .Where(p => p.PaymentDate >= mStart && p.PaymentDate < mEnd)
                .Sum(p => p.Amount.Cents);

            var outMonthCents = paidExpenses
                .Where(e => e.PaymentDate >= mStart && e.PaymentDate < mEnd)
                .Sum(e => e.Amount.Cents);

            var label = mStart.ToString("MMM/yy", System.Globalization.CultureInfo.GetCultureInfo("pt-BR"));

            monthlySeries.Add(new MonthlyCashFlowPointDto(
                label,
                inMonthCents,
                inMonthCents / 100m,
                outMonthCents,
                outMonthCents / 100m,
                inMonthCents - outMonthCents,
                (inMonthCents - outMonthCents) / 100m
            ));
        }

        // 7. Atividades Recentes e Auditoria
        var recentAuditLogs = await _context.AuditLogs
            .OrderByDescending(a => a.TimestampUtc)
            .Take(8)
            .ToListAsync();

        var recentActivities = new List<DashboardActivityItemDto>();

        foreach (var log in recentAuditLogs)
        {
            recentActivities.Add(new DashboardActivityItemDto(
                log.Id,
                log.Action,
                log.EntityName,
                log.ChangesJson ?? $"{log.Action} realizada em {log.EntityName}",
                log.TimestampUtc,
                null
            ));
        }

        if (recentActivities.Count == 0)
        {
            // Se ainda não houver logs na tabela AuditLogs, alimenta com os últimos pagamentos e contratos
            var latestPayments = payments.OrderByDescending(p => p.PaymentDate).Take(4);
            foreach (var lp in latestPayments)
            {
                var rec = receivables.FirstOrDefault(r => r.Id == lp.ReceivableId);
                recentActivities.Add(new DashboardActivityItemDto(
                    lp.Id,
                    "Pagamento Registrado",
                    "Financeiro",
                    $"Baixa de {lp.Amount} ({lp.Method}) referente a '{rec?.Title ?? "Conta"}'.",
                    lp.PaymentDate,
                    "Sistema"
                ));
            }
        }

        var overview = new DashboardOverviewDto(
            kpis,
            urgentOverdueList,
            commitments,
            monthlySeries,
            recentActivities
        );

        return Ok(ApiResponse<DashboardOverviewDto>.Ok(overview));
    }

    private static string GetCalendarEventTypeName(CalendarEventType type) => type switch
    {
        CalendarEventType.Meeting => "Reunião de Alinhamento",
        CalendarEventType.Delivery => "Entrega de Marco / Projeto",
        CalendarEventType.FollowUp => "Follow-up com Cliente",
        CalendarEventType.Internal => "Compromisso Interno",
        _ => "Compromisso Geral"
    };
}
