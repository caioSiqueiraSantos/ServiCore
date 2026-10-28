using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ServiCore.Application.Common.Interfaces;
using ServiCore.Application.Common.Models;
using ServiCore.Application.Features.Finance.DTOs;
using ServiCore.Domain.Common;
using ServiCore.Domain.Entities;
using ServiCore.Domain.Enums;

namespace ServiCore.Api.Controllers;

[Authorize]
public class FinanceController : ApiControllerBase
{
    private readonly IAppDbContext _context;
    private readonly ICurrentWorkspaceService _currentWorkspaceService;

    public FinanceController(
        IAppDbContext context,
        ICurrentWorkspaceService currentWorkspaceService)
    {
        _context = context;
        _currentWorkspaceService = currentWorkspaceService;
    }

    #region Contas a Receber (Receivables)

    /// <summary>
    /// Lista contas a receber com filtros por status, cliente, contrato, data e busca textual.
    /// </summary>
    [HttpGet("receivables")]
    public async Task<ActionResult<ApiResponse<List<ReceivableDto>>>> GetReceivables(
        [FromQuery] ReceivableStatus? status,
        [FromQuery] Guid? customerId,
        [FromQuery] Guid? contractId,
        [FromQuery] bool? isOverdue,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? search)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<List<ReceivableDto>>.Fail("Workspace não identificado."));

        var query = _context.Receivables
            .Include(r => r.Customer)
            .Include(r => r.Contract)
            .Include(r => r.Payments)
            .AsNoTracking()
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(r => r.Status == status.Value);

        if (customerId.HasValue)
            query = query.Where(r => r.CustomerId == customerId.Value);

        if (contractId.HasValue)
            query = query.Where(r => r.ContractId == contractId.Value);

        if (isOverdue.HasValue && isOverdue.Value)
            query = query.Where(r => r.Status == ReceivableStatus.Overdue || (r.Status == ReceivableStatus.Pending && r.DueDate < DateTime.UtcNow));

        if (startDate.HasValue)
            query = query.Where(r => r.DueDate >= startDate.Value.Date);

        if (endDate.HasValue)
            query = query.Where(r => r.DueDate <= endDate.Value.Date.AddDays(1).AddTicks(-1));

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchClean = search.Trim().ToLower();
            query = query.Where(r =>
                r.Title.ToLower().Contains(searchClean) ||
                (r.Description != null && r.Description.ToLower().Contains(searchClean)) ||
                r.Customer.Name.ToLower().Contains(searchClean));
        }

        var receivables = await query
            .OrderBy(r => r.DueDate)
            .ToListAsync();

        var dtos = receivables.Select(MapReceivableToDto).ToList();
        return Ok(ApiResponse<List<ReceivableDto>>.Ok(dtos, $"{dtos.Count} contas a receber carregadas com sucesso."));
    }

    /// <summary>
    /// Obtém detalhes de uma conta a receber por ID com histórico de pagamentos.
    /// </summary>
    [HttpGet("receivables/{id:guid}")]
    public async Task<ActionResult<ApiResponse<ReceivableDto>>> GetReceivableById(Guid id)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<ReceivableDto>.Fail("Workspace não identificado."));

        var receivable = await _context.Receivables
            .Include(r => r.Customer)
            .Include(r => r.Contract)
            .Include(r => r.Payments)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (receivable == null)
            return NotFound(ApiResponse<ReceivableDto>.Fail("Conta a receber não encontrada."));

        return Ok(ApiResponse<ReceivableDto>.Ok(MapReceivableToDto(receivable)));
    }

    /// <summary>
    /// Cadastra uma nova conta a receber (ou múltiplas parcelas se TotalInstallments > 1).
    /// </summary>
    [HttpPost("receivables")]
    public async Task<ActionResult<ApiResponse<List<ReceivableDto>>>> CreateReceivable([FromBody] CreateReceivableRequest request)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<List<ReceivableDto>>.Fail("Workspace não identificado."));

        var customerExists = await _context.Customers.AnyAsync(c => c.Id == request.CustomerId);
        if (!customerExists)
            return BadRequest(ApiResponse<List<ReceivableDto>>.Fail("O cliente informado não existe."));

        if (request.ContractId.HasValue)
        {
            var contractExists = await _context.Contracts.AnyAsync(c => c.Id == request.ContractId.Value);
            if (!contractExists)
                return BadRequest(ApiResponse<List<ReceivableDto>>.Fail("O contrato informado não existe."));
        }

        var issueDate = request.IssueDate ?? DateTime.UtcNow;
        var totalInstallments = request.TotalInstallments.GetValueOrDefault(1);
        if (totalInstallments <= 0) totalInstallments = 1;

        var createdReceivables = new List<Receivable>();

        if (totalInstallments == 1)
        {
            var receivable = new Receivable(
                workspaceId.Value,
                request.CustomerId,
                request.Title,
                new Money(request.AmountCents),
                request.DueDate,
                issueDate,
                request.Category,
                request.ContractId,
                request.Description,
                1,
                1,
                request.Notes
            );
            createdReceivables.Add(receivable);
            _context.Receivables.Add(receivable);
        }
        else
        {
            // Divisão proporcional exata em centavos para evitar discrepâncias decimais
            long baseInstallmentCents = request.AmountCents / totalInstallments;
            long remainderCents = request.AmountCents % totalInstallments;

            for (int i = 1; i <= totalInstallments; i++)
            {
                long installmentAmount = baseInstallmentCents + (i == 1 ? remainderCents : 0);
                var installmentDueDate = request.DueDate.AddMonths(i - 1);
                var installmentTitle = $"{request.Title} ({i}/{totalInstallments})";

                var receivable = new Receivable(
                    workspaceId.Value,
                    request.CustomerId,
                    installmentTitle,
                    new Money(installmentAmount),
                    installmentDueDate,
                    issueDate,
                    request.Category,
                    request.ContractId,
                    request.Description,
                    i,
                    totalInstallments,
                    request.Notes
                );
                createdReceivables.Add(receivable);
                _context.Receivables.Add(receivable);
            }
        }

        await _context.SaveChangesAsync();

        var ids = createdReceivables.Select(r => r.Id).ToList();
        var reloaded = await _context.Receivables
            .Include(r => r.Customer)
            .Include(r => r.Contract)
            .Include(r => r.Payments)
            .Where(r => ids.Contains(r.Id))
            .OrderBy(r => r.InstallmentNumber)
            .ToListAsync();

        var dtos = reloaded.Select(MapReceivableToDto).ToList();
        return CreatedAtAction(
            nameof(GetReceivables),
            ApiResponse<List<ReceivableDto>>.Ok(dtos, totalInstallments > 1
                ? $"{totalInstallments} parcelas geradas com sucesso."
                : "Conta a receber criada com sucesso."));
    }

    /// <summary>
    /// Atualiza uma conta a receber existente.
    /// </summary>
    [HttpPut("receivables/{id:guid}")]
    public async Task<ActionResult<ApiResponse<ReceivableDto>>> UpdateReceivable(Guid id, [FromBody] UpdateReceivableRequest request)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<ReceivableDto>.Fail("Workspace não identificado."));

        var receivable = await _context.Receivables
            .Include(r => r.Customer)
            .Include(r => r.Contract)
            .Include(r => r.Payments)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (receivable == null)
            return NotFound(ApiResponse<ReceivableDto>.Fail("Conta a receber não encontrada."));

        try
        {
            receivable.Update(
                request.CustomerId,
                request.Title,
                new Money(request.AmountCents),
                request.DueDate,
                request.IssueDate ?? receivable.IssueDate,
                request.Category,
                request.ContractId,
                request.Description,
                request.InstallmentNumber,
                request.TotalInstallments,
                request.Notes
            );

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<ReceivableDto>.Ok(MapReceivableToDto(receivable), "Conta a receber atualizada com sucesso."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<ReceivableDto>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Registra uma baixa parcial ou total manual em uma conta a receber.
    /// </summary>
    [HttpPost("receivables/{id:guid}/payments")]
    public async Task<ActionResult<ApiResponse<ReceivableDto>>> RegisterPayment(Guid id, [FromBody] RegisterPaymentRequest request)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<ReceivableDto>.Fail("Workspace não identificado."));

        var receivable = await _context.Receivables
            .Include(r => r.Customer)
            .Include(r => r.Contract)
            .Include(r => r.Payments)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (receivable == null)
            return NotFound(ApiResponse<ReceivableDto>.Fail("Conta a receber não encontrada."));

        try
        {
            var paymentDate = request.PaymentDate ?? DateTime.UtcNow;
            var payment = receivable.RegisterPayment(
                new Money(request.AmountCents),
                paymentDate,
                request.Method,
                request.Notes,
                request.TransactionReference,
                request.IdempotencyKey
            );

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<ReceivableDto>.Ok(
                MapReceivableToDto(receivable),
                receivable.Status == ReceivableStatus.Paid
                    ? "Baixa total registrada com sucesso. Conta quitada!"
                    : $"Baixa parcial de {new Money(request.AmountCents)} registrada com sucesso. Saldo restante: {receivable.RemainingAmount}"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<ReceivableDto>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Cancela uma conta a receber caso ainda não possua pagamentos.
    /// </summary>
    [HttpDelete("receivables/{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteReceivable(Guid id, [FromQuery] string? reason)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<bool>.Fail("Workspace não identificado."));

        var receivable = await _context.Receivables
            .Include(r => r.Payments)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (receivable == null)
            return NotFound(ApiResponse<bool>.Fail("Conta a receber não encontrada."));

        try
        {
            if (receivable.Payments.Count == 0 && receivable.PaidAmount.Cents == 0)
            {
                _context.Receivables.Remove(receivable);
                await _context.SaveChangesAsync();
                return Ok(ApiResponse<bool>.Ok(true, "Conta a receber excluída com sucesso."));
            }

            receivable.Cancel(reason);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<bool>.Ok(true, "Conta a receber cancelada com sucesso."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<bool>.Fail(ex.Message));
        }
    }

    #endregion

    #region Contas a Pagar / Despesas (Expenses)

    /// <summary>
    /// Lista despesas com filtros por categoria, status, datas e busca.
    /// </summary>
    [HttpGet("expenses")]
    public async Task<ActionResult<ApiResponse<List<ExpenseDto>>>> GetExpenses(
        [FromQuery] ExpenseCategory? category,
        [FromQuery] ExpenseStatus? status,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? search)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<List<ExpenseDto>>.Fail("Workspace não identificado."));

        var query = _context.Expenses
            .AsNoTracking()
            .AsQueryable();

        if (category.HasValue)
            query = query.Where(e => e.Category == category.Value);

        if (status.HasValue)
            query = query.Where(e => e.Status == status.Value);

        if (startDate.HasValue)
            query = query.Where(e => e.DueDate >= startDate.Value.Date);

        if (endDate.HasValue)
            query = query.Where(e => e.DueDate <= endDate.Value.Date.AddDays(1).AddTicks(-1));

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchClean = search.Trim().ToLower();
            query = query.Where(e =>
                e.Description.ToLower().Contains(searchClean) ||
                (e.Supplier != null && e.Supplier.ToLower().Contains(searchClean)) ||
                (e.Notes != null && e.Notes.ToLower().Contains(searchClean)));
        }

        var expenses = await query
            .OrderBy(e => e.DueDate)
            .ToListAsync();

        var dtos = expenses.Select(MapExpenseToDto).ToList();
        return Ok(ApiResponse<List<ExpenseDto>>.Ok(dtos, $"{dtos.Count} despesas carregadas com sucesso."));
    }

    /// <summary>
    /// Cadastra uma nova despesa operacional.
    /// </summary>
    [HttpPost("expenses")]
    public async Task<ActionResult<ApiResponse<ExpenseDto>>> CreateExpense([FromBody] CreateExpenseRequest request)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<ExpenseDto>.Fail("Workspace não identificado."));

        var expense = new Expense(
            workspaceId.Value,
            request.Description,
            request.Category,
            new Money(request.AmountCents),
            request.DueDate,
            request.Supplier,
            request.Notes,
            request.IsAlreadyPaid,
            request.PaymentDate,
            request.PaymentMethod
        );

        _context.Expenses.Add(expense);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetExpenses),
            ApiResponse<ExpenseDto>.Ok(MapExpenseToDto(expense), "Despesa registrada com sucesso."));
    }

    /// <summary>
    /// Atualiza uma despesa existente.
    /// </summary>
    [HttpPut("expenses/{id:guid}")]
    public async Task<ActionResult<ApiResponse<ExpenseDto>>> UpdateExpense(Guid id, [FromBody] UpdateExpenseRequest request)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<ExpenseDto>.Fail("Workspace não identificado."));

        var expense = await _context.Expenses.FirstOrDefaultAsync(e => e.Id == id);
        if (expense == null)
            return NotFound(ApiResponse<ExpenseDto>.Fail("Despesa não encontrada."));

        try
        {
            expense.Update(
                request.Description,
                request.Category,
                new Money(request.AmountCents),
                request.DueDate,
                request.Supplier,
                request.Notes
            );

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<ExpenseDto>.Ok(MapExpenseToDto(expense), "Despesa atualizada com sucesso."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<ExpenseDto>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Liquida/paga uma despesa.
    /// </summary>
    [HttpPost("expenses/{id:guid}/pay")]
    public async Task<ActionResult<ApiResponse<ExpenseDto>>> PayExpense(Guid id, [FromBody] PayExpenseRequest request)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<ExpenseDto>.Fail("Workspace não identificado."));

        var expense = await _context.Expenses.FirstOrDefaultAsync(e => e.Id == id);
        if (expense == null)
            return NotFound(ApiResponse<ExpenseDto>.Fail("Despesa não encontrada."));

        try
        {
            var paymentDate = request.PaymentDate ?? DateTime.UtcNow;
            expense.MarkAsPaid(paymentDate, request.Method, request.Notes);

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<ExpenseDto>.Ok(MapExpenseToDto(expense), "Despesa liquidada com sucesso."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<ExpenseDto>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Exclui ou cancela uma despesa.
    /// </summary>
    [HttpDelete("expenses/{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteExpense(Guid id)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<bool>.Fail("Workspace não identificado."));

        var expense = await _context.Expenses.FirstOrDefaultAsync(e => e.Id == id);
        if (expense == null)
            return NotFound(ApiResponse<bool>.Fail("Despesa não encontrada."));

        _context.Expenses.Remove(expense);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<bool>.Ok(true, "Despesa excluída com sucesso."));
    }

    #endregion

    #region Fluxo de Caixa Real (Cash Flow Summary)

    /// <summary>
    /// Consolida o fluxo de caixa real e projetado do workspace dentro do período selecionado.
    /// </summary>
    [HttpGet("cash-flow")]
    public async Task<ActionResult<ApiResponse<CashFlowSummaryDto>>> GetCashFlow(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<CashFlowSummaryDto>.Fail("Workspace não identificado."));

        var periodStart = startDate?.Date ?? DateTime.UtcNow.AddMonths(-1).Date;
        var periodEnd = endDate?.Date ?? DateTime.UtcNow.AddMonths(1).Date;

        var allReceivables = await _context.Receivables
            .Include(r => r.Customer)
            .Include(r => r.Payments)
            .AsNoTracking()
            .ToListAsync();

        var allExpenses = await _context.Expenses
            .AsNoTracking()
            .ToListAsync();

        // 1. Totais Contas a Receber
        long recPendingCents = 0;
        long recOverdueCents = 0;
        long recPaidCents = 0;

        foreach (var r in allReceivables)
        {
            if (r.Status == ReceivableStatus.Cancelled) continue;

            recPaidCents += r.PaidAmount.Cents;
            if (r.Status == ReceivableStatus.Overdue || (r.Status != ReceivableStatus.Paid && r.DueDate < DateTime.UtcNow))
            {
                recOverdueCents += r.RemainingAmount.Cents;
            }
            else if (r.Status == ReceivableStatus.Pending || r.Status == ReceivableStatus.PartiallyPaid)
            {
                recPendingCents += r.RemainingAmount.Cents;
            }
        }

        // 2. Totais Despesas
        long expPendingCents = 0;
        long expOverdueCents = 0;
        long expPaidCents = 0;

        foreach (var e in allExpenses)
        {
            if (e.Status == ExpenseStatus.Cancelled) continue;

            if (e.Status == ExpenseStatus.Paid)
            {
                expPaidCents += e.Amount.Cents;
            }
            else if (e.Status == ExpenseStatus.Overdue || e.DueDate < DateTime.UtcNow)
            {
                expOverdueCents += e.Amount.Cents;
            }
            else
            {
                expPendingCents += e.Amount.Cents;
            }
        }

        // 3. Saldos
        long realizedNetCents = recPaidCents - expPaidCents;
        long projectedNetCents = (recPaidCents + recPendingCents + recOverdueCents) - (expPaidCents + expPendingCents + expOverdueCents);

        // 4. Fluxo diário consolidado para gráficos
        var allPayments = await _context.Payments
            .Where(p => p.PaymentDate >= periodStart && p.PaymentDate <= periodEnd.AddDays(1))
            .AsNoTracking()
            .ToListAsync();

        var paidExpensesInPeriod = allExpenses
            .Where(e => e.Status == ExpenseStatus.Paid && e.PaymentDate.HasValue && e.PaymentDate >= periodStart && e.PaymentDate <= periodEnd.AddDays(1))
            .ToList();

        var dailyMap = new Dictionary<string, (long Inflow, long Outflow)>();

        for (var day = periodStart; day <= periodEnd; day = day.AddDays(1))
        {
            var dayKey = day.ToString("yyyy-MM-dd");
            dailyMap[dayKey] = (0, 0);
        }

        foreach (var p in allPayments)
        {
            var dayKey = p.PaymentDate.ToString("yyyy-MM-dd");
            if (dailyMap.ContainsKey(dayKey))
            {
                var cur = dailyMap[dayKey];
                dailyMap[dayKey] = (cur.Inflow + p.Amount.Cents, cur.Outflow);
            }
        }

        foreach (var e in paidExpensesInPeriod)
        {
            var dayKey = e.PaymentDate!.Value.ToString("yyyy-MM-dd");
            if (dailyMap.ContainsKey(dayKey))
            {
                var cur = dailyMap[dayKey];
                dailyMap[dayKey] = (cur.Inflow, cur.Outflow + e.Amount.Cents);
            }
        }

        var dailyList = dailyMap
            .OrderBy(kvp => kvp.Key)
            .Select(kvp => new DailyFlowItemDto(
                kvp.Key,
                kvp.Value.Inflow,
                kvp.Value.Inflow / 100m,
                kvp.Value.Outflow,
                kvp.Value.Outflow / 100m,
                kvp.Value.Inflow - kvp.Value.Outflow,
                (kvp.Value.Inflow - kvp.Value.Outflow) / 100m
            ))
            .ToList();

        // 5. Distribuição por categorias
        var categoryList = new List<CategoryDistributionDto>();
        long totalExpenseAmount = allExpenses.Where(e => e.Status != ExpenseStatus.Cancelled).Sum(e => e.Amount.Cents);
        if (totalExpenseAmount > 0)
        {
            var expByCat = allExpenses
                .Where(e => e.Status != ExpenseStatus.Cancelled)
                .GroupBy(e => e.Category)
                .Select(g => new
                {
                    CatName = GetExpenseCategoryName(g.Key),
                    Total = g.Sum(x => x.Amount.Cents)
                });

            foreach (var item in expByCat)
            {
                categoryList.Add(new CategoryDistributionDto(
                    item.CatName,
                    item.Total,
                    item.Total / 100m,
                    Math.Round((decimal)item.Total / totalExpenseAmount * 100m, 1),
                    "Expense"
                ));
            }
        }

        // 6. Atividades recentes
        var recentActivities = new List<FinancialActivityDto>();

        foreach (var p in allPayments.OrderByDescending(p => p.PaymentDate).Take(8))
        {
            var parentRec = allReceivables.FirstOrDefault(r => r.Id == p.ReceivableId);
            recentActivities.Add(new FinancialActivityDto(
                p.Id,
                parentRec?.Title ?? "Recebimento",
                parentRec?.Customer.Name,
                "Inflow",
                p.Amount.Cents,
                p.Amount.ToDecimal(),
                p.PaymentDate,
                "Recebido",
                p.TransactionReference ?? p.Method.ToString()
            ));
        }

        foreach (var e in paidExpensesInPeriod.OrderByDescending(e => e.PaymentDate).Take(8))
        {
            recentActivities.Add(new FinancialActivityDto(
                e.Id,
                e.Description,
                e.Supplier ?? GetExpenseCategoryName(e.Category),
                "Outflow",
                e.Amount.Cents,
                e.Amount.ToDecimal(),
                e.PaymentDate ?? e.DueDate,
                "Pago",
                e.PaymentMethod?.ToString() ?? "Liquidado"
            ));
        }

        var sortedActivities = recentActivities
            .OrderByDescending(a => a.Date)
            .Take(10)
            .ToList();

        var summary = new CashFlowSummaryDto(
            periodStart,
            periodEnd,
            recPendingCents,
            recPendingCents / 100m,
            recOverdueCents,
            recOverdueCents / 100m,
            recPaidCents,
            recPaidCents / 100m,
            expPendingCents,
            expPendingCents / 100m,
            expOverdueCents,
            expOverdueCents / 100m,
            expPaidCents,
            expPaidCents / 100m,
            realizedNetCents,
            realizedNetCents / 100m,
            projectedNetCents,
            projectedNetCents / 100m,
            dailyList,
            categoryList,
            sortedActivities
        );

        return Ok(ApiResponse<CashFlowSummaryDto>.Ok(summary));
    }

    #endregion

    #region Simulador de Pagamentos Idempotente

    /// <summary>
    /// Simula a quitação de uma fatura com garantia de idempotência.
    /// Reenvios com a mesma IdempotencyKey retornam a transação idêntica original sem duplicar baixas financeiras.
    /// </summary>
    [HttpPost("simulate-payment")]
    public async Task<ActionResult<ApiResponse<SimulatePaymentResponse>>> SimulatePayment(
        [FromBody] SimulatePaymentRequest request)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<SimulatePaymentResponse>.Fail("Workspace não identificado."));

        if (string.IsNullOrWhiteSpace(request.IdempotencyKey))
            return BadRequest(ApiResponse<SimulatePaymentResponse>.Fail("A chave de idempotência é obrigatória para simulações seguras."));

        var cleanKey = request.IdempotencyKey.Trim();

        // 1. CHECAGEM DE IDEMPOTÊNCIA:
        // Verifica se já existe um pagamento registrado com esta Mesma IdempotencyKey neste Workspace
        var existingPayment = await _context.Payments
            .Include(p => p.Receivable)
                .ThenInclude(r => r.Customer)
            .FirstOrDefaultAsync(p => p.WorkspaceId == workspaceId.Value && p.IdempotencyKey == cleanKey);

        if (existingPayment != null)
        {
            var replayResponse = new SimulatePaymentResponse(
                ReceiptId: $"RCP-{existingPayment.Id.ToString()[..8].ToUpper()}",
                IdempotencyKey: cleanKey,
                IsIdempotentReplay: true,
                Status: "Settled",
                ReceivableId: existingPayment.ReceivableId,
                ReceivableTitle: existingPayment.Receivable.Title,
                CustomerName: existingPayment.Receivable.Customer.Name,
                AmountPaidCents: existingPayment.Amount.Cents,
                AmountPaidFormatted: existingPayment.Amount.ToDecimal(),
                RemainingBalanceCents: existingPayment.Receivable.RemainingAmount.Cents,
                RemainingBalanceFormatted: existingPayment.Receivable.RemainingAmount.ToDecimal(),
                ReceivableNewStatus: existingPayment.Receivable.Status.ToString(),
                PaymentMethodName: GetPaymentMethodName(existingPayment.Method),
                TransactionAuthorizationCode: existingPayment.TransactionReference ?? $"AUTH-{cleanKey[..8].ToUpper()}",
                PixQrCodePayload: existingPayment.Method == PaymentMethod.Pix
                    ? $"00020126580014br.gov.bcb.pix0136{existingPayment.Id}520400005303986540{existingPayment.Amount.ToDecimal():F2}5802BR5925SERVICORE PAGAMENTOS6009SAO PAULO62070503***6304"
                    : null,
                ProcessedAtUtc: existingPayment.CreatedAtUtc,
                Message: "Transação já processada anteriormente. Resposta idempotente recuperada com segurança, sem duplicidade de débito."
            );

            return Ok(ApiResponse<SimulatePaymentResponse>.Ok(replayResponse, "Transação idempotente recuperada com sucesso."));
        }

        // 2. Localiza a conta a receber
        var receivable = await _context.Receivables
            .Include(r => r.Customer)
            .Include(r => r.Payments)
            .FirstOrDefaultAsync(r => r.Id == request.ReceivableId);

        if (receivable == null)
            return NotFound(ApiResponse<SimulatePaymentResponse>.Fail("Conta a receber não encontrada."));

        if (receivable.Status == ReceivableStatus.Paid)
            return BadRequest(ApiResponse<SimulatePaymentResponse>.Fail("Esta conta a receber já está totalmente quitada."));

        if (request.AmountCents > receivable.RemainingAmount.Cents)
            return BadRequest(ApiResponse<SimulatePaymentResponse>.Fail($"O valor da simulação (R$ {request.AmountCents / 100m:F2}) excede o saldo restante (R$ {receivable.RemainingAmount.ToDecimal():F2})."));

        // 3. Processa a transação e registra o pagamento com a IdempotencyKey vinculada
        var authCode = $"AUTH-{Guid.NewGuid().ToString()[..8].ToUpper()}";
        var transactionRef = request.Method switch
        {
            PaymentMethod.Pix => $"PIX-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString()[..6].ToUpper()}",
            PaymentMethod.CreditCard => $"CC-AUTH-{authCode}",
            PaymentMethod.BankSlip => $"BOL-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(10000, 99999)}",
            _ => $"TX-{Guid.NewGuid().ToString()[..8].ToUpper()}"
        };

        var notes = $"Simulação Idempotente [{request.Method}]: {request.Notes ?? "Liquidação autorizada pelo simulador"}";

        var payment = receivable.RegisterPayment(
            new Money(request.AmountCents),
            DateTime.UtcNow,
            request.Method,
            notes,
            transactionRef,
            cleanKey
        );

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        var pixPayload = request.Method == PaymentMethod.Pix
            ? $"00020126580014br.gov.bcb.pix0136{payment.Id}520400005303986540{payment.Amount.ToDecimal():F2}5802BR5925SERVICORE PAGAMENTOS6009SAO PAULO62070503***6304"
            : null;

        var response = new SimulatePaymentResponse(
            ReceiptId: $"RCP-{payment.Id.ToString()[..8].ToUpper()}",
            IdempotencyKey: cleanKey,
            IsIdempotentReplay: false,
            Status: "Approved",
            ReceivableId: receivable.Id,
            ReceivableTitle: receivable.Title,
            CustomerName: receivable.Customer.Name,
            AmountPaidCents: payment.Amount.Cents,
            AmountPaidFormatted: payment.Amount.ToDecimal(),
            RemainingBalanceCents: receivable.RemainingAmount.Cents,
            RemainingBalanceFormatted: receivable.RemainingAmount.ToDecimal(),
            ReceivableNewStatus: receivable.Status.ToString(),
            PaymentMethodName: GetPaymentMethodName(request.Method),
            TransactionAuthorizationCode: authCode,
            PixQrCodePayload: pixPayload,
            ProcessedAtUtc: payment.CreatedAtUtc,
            Message: "Pagamento simulado e processado com sucesso. Baixa financeira registrada no fluxo de caixa."
        );

        return Ok(ApiResponse<SimulatePaymentResponse>.Ok(response, "Pagamento simulado com sucesso."));
    }

    /// <summary>
    /// Gera contas a receber diretamente a partir de um contrato aprovado.
    /// </summary>
    [HttpPost("generate-from-contract/{contractId:guid}")]
    public async Task<ActionResult<ApiResponse<List<ReceivableDto>>>> GenerateFromContract(
        Guid contractId,
        [FromQuery] int installments = 1,
        [FromQuery] DateTime? firstDueDate = null)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<List<ReceivableDto>>.Fail("Workspace não identificado."));

        var contract = await _context.Contracts
            .Include(c => c.Customer)
            .FirstOrDefaultAsync(c => c.Id == contractId);

        if (contract == null)
            return NotFound(ApiResponse<List<ReceivableDto>>.Fail("Contrato não encontrado."));

        if (contract.Amount.Cents <= 0)
            return BadRequest(ApiResponse<List<ReceivableDto>>.Fail("O contrato possui valor zerado."));

        var count = installments > 0 ? installments : 1;
        var dueDate = firstDueDate ?? DateTime.UtcNow.AddDays(15);
        var created = new List<Receivable>();

        var cat = contract.Type switch
        {
            ContractBillingType.Recurring => ReceivableCategory.RecurringSubscription,
            ContractBillingType.Hourly => ReceivableCategory.ServiceExecution,
            _ => ReceivableCategory.ServiceExecution
        };

        long baseInstallment = contract.Amount.Cents / count;
        long remainder = contract.Amount.Cents % count;

        for (int i = 1; i <= count; i++)
        {
            long amount = baseInstallment + (i == 1 ? remainder : 0);
            var title = count > 1
                ? $"{contract.Title} - Parcela {i}/{count}"
                : $"{contract.Title}";

            var rec = new Receivable(
                workspaceId.Value,
                contract.CustomerId,
                title,
                new Money(amount),
                dueDate.AddMonths(i - 1),
                DateTime.UtcNow,
                cat,
                contract.Id,
                $"Fatura gerada a partir do contrato {contract.Title}.",
                i,
                count,
                $"Gerado automaticamente em {DateTime.UtcNow:dd/MM/yyyy}."
            );

            created.Add(rec);
            _context.Receivables.Add(rec);
        }

        await _context.SaveChangesAsync();

        var dtos = created.Select(MapReceivableToDto).ToList();
        return Ok(ApiResponse<List<ReceivableDto>>.Ok(dtos, $"{dtos.Count} contas a receber faturadas do contrato com sucesso!"));
    }

    #endregion

    #region Helpers de Mapeamento

    private static ReceivableDto MapReceivableToDto(Receivable r)
    {
        return new ReceivableDto(
            r.Id,
            r.CustomerId,
            r.Customer?.Name ?? string.Empty,
            r.Customer?.Document,
            r.ContractId,
            r.Contract?.Title,
            r.Title,
            r.Description,
            r.Category,
            GetReceivableCategoryName(r.Category),
            r.Amount.Cents,
            r.Amount.ToDecimal(),
            r.PaidAmount.Cents,
            r.PaidAmount.ToDecimal(),
            r.RemainingAmount.Cents,
            r.RemainingAmount.ToDecimal(),
            r.DueDate,
            r.IssueDate,
            r.Status,
            GetReceivableStatusName(r.Status),
            r.InstallmentNumber,
            r.TotalInstallments,
            r.Notes,
            r.CreatedAtUtc,
            r.Payments.OrderByDescending(p => p.PaymentDate).Select(p => new PaymentDto(
                p.Id,
                p.ReceivableId,
                p.Amount.Cents,
                p.Amount.ToDecimal(),
                p.PaymentDate,
                p.Method,
                GetPaymentMethodName(p.Method),
                p.TransactionReference,
                p.Notes,
                p.IdempotencyKey,
                p.CreatedAtUtc
            )).ToList()
        );
    }

    private static ExpenseDto MapExpenseToDto(Expense e)
    {
        return new ExpenseDto(
            e.Id,
            e.Description,
            e.Category,
            GetExpenseCategoryName(e.Category),
            e.Amount.Cents,
            e.Amount.ToDecimal(),
            e.DueDate,
            e.PaymentDate,
            e.Status,
            GetExpenseStatusName(e.Status),
            e.PaymentMethod,
            e.PaymentMethod.HasValue ? GetPaymentMethodName(e.PaymentMethod.Value) : null,
            e.Supplier,
            e.Notes,
            e.CreatedAtUtc
        );
    }

    private static string GetReceivableStatusName(ReceivableStatus status) => status switch
    {
        ReceivableStatus.Pending => "Pendente",
        ReceivableStatus.PartiallyPaid => "Parcialmente Pago",
        ReceivableStatus.Paid => "Quitado",
        ReceivableStatus.Overdue => "Atrasado",
        ReceivableStatus.Cancelled => "Cancelado",
        _ => status.ToString()
    };

    private static string GetExpenseStatusName(ExpenseStatus status) => status switch
    {
        ExpenseStatus.Pending => "A Pagar",
        ExpenseStatus.Paid => "Pago",
        ExpenseStatus.Overdue => "Vencido",
        ExpenseStatus.Cancelled => "Cancelado",
        _ => status.ToString()
    };

    private static string GetPaymentMethodName(PaymentMethod method) => method switch
    {
        PaymentMethod.Pix => "Pix Instantâneo",
        PaymentMethod.CreditCard => "Cartão de Crédito",
        PaymentMethod.DebitCard => "Cartão de Débito",
        PaymentMethod.BankSlip => "Boleto Bancário",
        PaymentMethod.BankTransfer => "Transferência / TED",
        PaymentMethod.Cash => "Dinheiro em Espécie",
        _ => "Outro Método"
    };

    private static string GetReceivableCategoryName(ReceivableCategory cat) => cat switch
    {
        ReceivableCategory.ServiceExecution => "Execução de Serviços",
        ReceivableCategory.Consulting => "Consultoria Especializada",
        ReceivableCategory.RecurringSubscription => "Mensalidade / Recorrência",
        ReceivableCategory.Advisory => "Assessoria Contínua",
        ReceivableCategory.AdvancePayment => "Entrada / Adiantamento",
        _ => "Outro Recebimento"
    };

    private static string GetExpenseCategoryName(ExpenseCategory cat) => cat switch
    {
        ExpenseCategory.SoftwareAndTools => "Softwares & Ferramentas",
        ExpenseCategory.OfficeAndCoworking => "Escritório & Coworking",
        ExpenseCategory.MarketingAndSales => "Marketing & Vendas",
        ExpenseCategory.TaxesAndAccounting => "Impostos & Contabilidade",
        ExpenseCategory.EquipmentAndHardware => "Equipamentos & Hardware",
        ExpenseCategory.ThirdPartyServices => "Serviços de Terceiros",
        ExpenseCategory.SalariesAndWithdrawals => "Pró-Labore & Salários",
        _ => "Outras Despesas"
    };

    #endregion
}
