using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ServiCore.Application.Common.Interfaces;
using ServiCore.Application.Common.Models;
using ServiCore.Application.Features.Contracts.DTOs;
using ServiCore.Application.Features.Customers.DTOs;
using ServiCore.Domain.Common;
using ServiCore.Domain.Entities;
using ServiCore.Domain.Enums;

namespace ServiCore.Api.Controllers;

[Authorize]
public class ContractsController : ApiControllerBase
{
    private readonly IAppDbContext _context;
    private readonly ICurrentWorkspaceService _currentWorkspaceService;

    public ContractsController(
        IAppDbContext context,
        ICurrentWorkspaceService currentWorkspaceService)
    {
        _context = context;
        _currentWorkspaceService = currentWorkspaceService;
    }

    /// <summary>
    /// Lista contratos do workspace com suporte a busca, filtros e paginação.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<ContractDto>>>> GetContracts([FromQuery] ContractFilterParams query)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<PagedResult<ContractDto>>.Fail("Workspace não identificado."));

        var baseQuery = _context.Contracts
            .AsNoTracking()
            .Include(c => c.Customer)
            .Include(c => c.Tasks)
            .Include(c => c.Attachments)
            .Include(c => c.Items)
            .AsQueryable();

        // 1. Busca textual
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var searchClean = query.Search.Trim().ToLower();
            baseQuery = baseQuery.Where(c =>
                c.Title.ToLower().Contains(searchClean) ||
                (c.Description != null && c.Description.ToLower().Contains(searchClean)) ||
                c.Customer.Name.ToLower().Contains(searchClean)
            );
        }

        // 2. Filtro por cliente
        if (query.CustomerId.HasValue)
        {
            baseQuery = baseQuery.Where(c => c.CustomerId == query.CustomerId.Value);
        }

        // 3. Filtro por modalidade
        if (query.Type.HasValue)
        {
            baseQuery = baseQuery.Where(c => c.Type == query.Type.Value);
        }

        // 4. Filtro por status
        if (query.Status.HasValue)
        {
            baseQuery = baseQuery.Where(c => c.Status == query.Status.Value);
        }

        var totalCount = await baseQuery.CountAsync();

        // 5. Ordenação
        baseQuery = (query.SortBy?.ToLower(), query.SortDescending) switch
        {
            ("startdate", true) => baseQuery.OrderByDescending(c => c.StartDate),
            ("startdate", false) => baseQuery.OrderBy(c => c.StartDate),
            ("amount", true) => baseQuery.OrderByDescending(c => c.Amount.Cents),
            ("amount", false) => baseQuery.OrderBy(c => c.Amount.Cents),
            ("status", true) => baseQuery.OrderByDescending(c => c.Status),
            ("status", false) => baseQuery.OrderBy(c => c.Status),
            ("title", true) => baseQuery.OrderByDescending(c => c.Title),
            _ => baseQuery.OrderBy(c => c.Title)
        };

        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var items = await baseQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new ContractDto
            {
                Id = c.Id,
                WorkspaceId = c.WorkspaceId,
                CustomerId = c.CustomerId,
                CustomerName = c.Customer.Name,
                Title = c.Title,
                Description = c.Description,
                Type = c.Type,
                Status = c.Status,
                AmountCents = c.Amount.Cents,
                EstimatedHours = c.EstimatedHours,
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                Terms = c.Terms,
                TasksCount = c.Tasks.Count,
                CompletedTasksCount = c.Tasks.Count(t => t.Status == TaskItemStatus.Completed),
                AttachmentsCount = c.Attachments.Count,
                Items = c.Items.Select(i => new ContractItemDto
                {
                    Id = i.Id,
                    ContractId = i.ContractId,
                    ServiceItemId = i.ServiceItemId,
                    Description = i.Description,
                    Quantity = i.Quantity,
                    UnitPriceCents = i.UnitPrice.Cents,
                    TotalPriceCents = i.TotalPrice.Cents
                }).ToList(),
                CreatedAtUtc = c.CreatedAtUtc,
                UpdatedAtUtc = c.UpdatedAtUtc
            })
            .ToListAsync();

        var result = new PagedResult<ContractDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return Ok(ApiResponse<PagedResult<ContractDto>>.Ok(result));
    }

    /// <summary>
    /// Retorna as métricas operacionais consolidadas dos contratos do workspace.
    /// </summary>
    [HttpGet("metrics")]
    public async Task<ActionResult<ApiResponse<ContractMetricsDto>>> GetMetrics()
    {
        var contracts = await _context.Contracts
            .AsNoTracking()
            .ToListAsync();

        var metrics = new ContractMetricsDto
        {
            TotalContracts = contracts.Count,
            ActiveContracts = contracts.Count(c => c.Status == ContractStatus.Active),
            DraftContracts = contracts.Count(c => c.Status == ContractStatus.Draft),
            CompletedContracts = contracts.Count(c => c.Status == ContractStatus.Completed),
            TotalActiveValueCents = contracts
                .Where(c => c.Status == ContractStatus.Active && c.Type != ContractBillingType.Hourly)
                .Sum(c => c.Amount.Cents),
            MonthlyRecurringRevenueCents = contracts
                .Where(c => c.Status == ContractStatus.Active && c.Type == ContractBillingType.Recurring)
                .Sum(c => c.Amount.Cents)
        };

        return Ok(ApiResponse<ContractMetricsDto>.Ok(metrics));
    }

    /// <summary>
    /// Retorna detalhes de um contrato por ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<ContractDto>>> GetContractById(Guid id)
    {
        var contract = await _context.Contracts
            .AsNoTracking()
            .Include(c => c.Customer)
            .Include(c => c.Tasks)
            .Include(c => c.Attachments)
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (contract == null)
            return NotFound(ApiResponse<ContractDto>.Fail("Contrato não encontrado."));

        var dto = new ContractDto
        {
            Id = contract.Id,
            WorkspaceId = contract.WorkspaceId,
            CustomerId = contract.CustomerId,
            CustomerName = contract.Customer.Name,
            Title = contract.Title,
            Description = contract.Description,
            Type = contract.Type,
            Status = contract.Status,
            AmountCents = contract.Amount.Cents,
            EstimatedHours = contract.EstimatedHours,
            StartDate = contract.StartDate,
            EndDate = contract.EndDate,
            Terms = contract.Terms,
            TasksCount = contract.Tasks.Count,
            CompletedTasksCount = contract.Tasks.Count(t => t.Status == TaskItemStatus.Completed),
            AttachmentsCount = contract.Attachments.Count,
            Items = contract.Items.Select(i => new ContractItemDto
            {
                Id = i.Id,
                ContractId = i.ContractId,
                ServiceItemId = i.ServiceItemId,
                Description = i.Description,
                Quantity = i.Quantity,
                UnitPriceCents = i.UnitPrice.Cents,
                TotalPriceCents = i.TotalPrice.Cents
            }).ToList(),
            CreatedAtUtc = contract.CreatedAtUtc,
            UpdatedAtUtc = contract.UpdatedAtUtc
        };

        return Ok(ApiResponse<ContractDto>.Ok(dto));
    }

    /// <summary>
    /// Cria um novo contrato com itens opcionais no workspace ativo.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<ContractDto>>> CreateContract([FromBody] CreateContractDto request)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        var userId = _currentWorkspaceService.UserId;

        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<ContractDto>.Fail("Workspace não identificado."));

        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(ApiResponse<ContractDto>.Fail("O título do contrato é obrigatório."));

        var customerExists = await _context.Customers.AnyAsync(c => c.Id == request.CustomerId);
        if (!customerExists)
            return BadRequest(ApiResponse<ContractDto>.Fail("Cliente associado não encontrado no workspace."));

        var contract = new Contract(
            workspaceId.Value,
            request.CustomerId,
            request.Title,
            request.Type,
            new Money(request.AmountCents),
            request.StartDate,
            request.EndDate,
            request.Description,
            request.EstimatedHours,
            request.Terms
        );

        // Adiciona itens de escopo se informados
        if (request.Items != null && request.Items.Count > 0)
        {
            foreach (var item in request.Items)
            {
                if (!string.IsNullOrWhiteSpace(item.Description))
                {
                    contract.Items.Add(new ContractItem(
                        contract.Id,
                        item.Description,
                        item.Quantity > 0 ? item.Quantity : 1,
                        new Money(item.UnitPriceCents),
                        item.ServiceItemId
                    ));
                }
            }
        }

        _context.Contracts.Add(contract);

        var audit = new AuditLog(
            workspaceId.Value,
            userId,
            "CONTRACT_CREATED",
            "Contract",
            contract.Id.ToString(),
            $"Contrato '{contract.Title}' criado para o cliente ID {contract.CustomerId} ({contract.Type})."
        );
        _context.AuditLogs.Add(audit);

        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetContractById), new { id = contract.Id }, await GetContractByIdInternal(contract.Id));
    }

    /// <summary>
    /// Atualiza os dados de um contrato existente.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<ContractDto>>> UpdateContract(Guid id, [FromBody] UpdateContractDto request)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        var userId = _currentWorkspaceService.UserId;

        var contract = await _context.Contracts.FirstOrDefaultAsync(c => c.Id == id);
        if (contract == null)
            return NotFound(ApiResponse<ContractDto>.Fail("Contrato não encontrado."));

        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(ApiResponse<ContractDto>.Fail("O título do contrato é obrigatório."));

        var customerExists = await _context.Customers.AnyAsync(c => c.Id == request.CustomerId);
        if (!customerExists)
            return BadRequest(ApiResponse<ContractDto>.Fail("Cliente associado não encontrado."));

        contract.Update(
            request.CustomerId,
            request.Title,
            request.Type,
            new Money(request.AmountCents),
            request.StartDate,
            request.EndDate,
            request.Description,
            request.EstimatedHours,
            request.Terms
        );

        var audit = new AuditLog(
            workspaceId,
            userId,
            "CONTRACT_UPDATED",
            "Contract",
            contract.Id.ToString(),
            $"Contrato '{contract.Title}' atualizado."
        );
        _context.AuditLogs.Add(audit);

        await _context.SaveChangesAsync();

        return Ok(await GetContractByIdInternal(contract.Id));
    }

    /// <summary>
    /// Atualiza rapidamente o status de um contrato (Ativar, Suspender, Concluir, Cancelar).
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<ApiResponse<ContractDto>>> UpdateStatus(Guid id, [FromBody] UpdateContractStatusDto request)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        var userId = _currentWorkspaceService.UserId;

        var contract = await _context.Contracts.FirstOrDefaultAsync(c => c.Id == id);
        if (contract == null)
            return NotFound(ApiResponse<ContractDto>.Fail("Contrato não encontrado."));

        contract.ChangeStatus(request.Status);

        var audit = new AuditLog(
            workspaceId,
            userId,
            "CONTRACT_STATUS_CHANGED",
            "Contract",
            contract.Id.ToString(),
            $"Status do contrato '{contract.Title}' alterado para {request.Status}."
        );
        _context.AuditLogs.Add(audit);

        await _context.SaveChangesAsync();

        return Ok(await GetContractByIdInternal(contract.Id));
    }

    /// <summary>
    /// Cancela um contrato mantendo histórico.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteContract(Guid id)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        var userId = _currentWorkspaceService.UserId;

        var contract = await _context.Contracts.FirstOrDefaultAsync(c => c.Id == id);
        if (contract == null)
            return NotFound(ApiResponse<bool>.Fail("Contrato não encontrado."));

        contract.Cancel();

        var audit = new AuditLog(
            workspaceId,
            userId,
            "CONTRACT_CANCELLED",
            "Contract",
            contract.Id.ToString(),
            $"Contrato '{contract.Title}' cancelado."
        );
        _context.AuditLogs.Add(audit);

        await _context.SaveChangesAsync();

        return Ok(ApiResponse<bool>.Ok(true, "Contrato cancelado com sucesso."));
    }

    /// <summary>
    /// Retorna os anexos/documentos registrados do contrato.
    /// </summary>
    [HttpGet("{id:guid}/attachments")]
    public async Task<ActionResult<ApiResponse<List<ContractAttachmentDto>>>> GetAttachments(Guid id)
    {
        var attachments = await _context.ContractAttachments
            .AsNoTracking()
            .Where(a => a.ContractId == id)
            .OrderByDescending(a => a.UploadedAtUtc)
            .Select(a => new ContractAttachmentDto
            {
                Id = a.Id,
                ContractId = a.ContractId,
                FileName = a.FileName,
                ContentType = a.ContentType,
                FileSizeBytes = a.FileSizeBytes,
                StorageKeyOrUrl = a.StorageKeyOrUrl,
                Description = a.Description,
                UploadedAtUtc = a.UploadedAtUtc
            })
            .ToListAsync();

        return Ok(ApiResponse<List<ContractAttachmentDto>>.Ok(attachments));
    }

    /// <summary>
    /// Registra uma referência de anexo/documento para o contrato (preparado para PostgreSQL Neon Database).
    /// </summary>
    [HttpPost("{id:guid}/attachments")]
    public async Task<ActionResult<ApiResponse<ContractAttachmentDto>>> RegisterAttachmentReference(
        Guid id,
        [FromBody] CreateContractAttachmentReferenceDto request)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        var userId = _currentWorkspaceService.UserId;

        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<ContractAttachmentDto>.Fail("Workspace não identificado."));

        var contractExists = await _context.Contracts.AnyAsync(c => c.Id == id);
        if (!contractExists)
            return NotFound(ApiResponse<ContractAttachmentDto>.Fail("Contrato não encontrado."));

        var attachment = new ContractAttachment(
            workspaceId.Value,
            id,
            request.FileName,
            request.ContentType,
            request.FileSizeBytes,
            request.StorageKeyOrUrl,
            request.Description
        );

        _context.ContractAttachments.Add(attachment);

        var audit = new AuditLog(
            workspaceId.Value,
            userId,
            "CONTRACT_ATTACHMENT_REGISTERED",
            "ContractAttachment",
            attachment.Id.ToString(),
            $"Referência de anexo '{attachment.FileName}' registrada para o contrato."
        );
        _context.AuditLogs.Add(audit);

        await _context.SaveChangesAsync();

        var dto = new ContractAttachmentDto
        {
            Id = attachment.Id,
            ContractId = attachment.ContractId,
            FileName = attachment.FileName,
            ContentType = attachment.ContentType,
            FileSizeBytes = attachment.FileSizeBytes,
            StorageKeyOrUrl = attachment.StorageKeyOrUrl,
            Description = attachment.Description,
            UploadedAtUtc = attachment.UploadedAtUtc
        };

        return Ok(ApiResponse<ContractAttachmentDto>.Ok(
            dto,
            "Referência de documento registrada com sucesso. (Upload binário físico será integrado na migração PostgreSQL Neon)."
        ));
    }

    private async Task<ApiResponse<ContractDto>> GetContractByIdInternal(Guid id)
    {
        var contract = await _context.Contracts
            .AsNoTracking()
            .Include(c => c.Customer)
            .Include(c => c.Tasks)
            .Include(c => c.Attachments)
            .Include(c => c.Items)
            .FirstAsync(c => c.Id == id);

        var dto = new ContractDto
        {
            Id = contract.Id,
            WorkspaceId = contract.WorkspaceId,
            CustomerId = contract.CustomerId,
            CustomerName = contract.Customer.Name,
            Title = contract.Title,
            Description = contract.Description,
            Type = contract.Type,
            Status = contract.Status,
            AmountCents = contract.Amount.Cents,
            EstimatedHours = contract.EstimatedHours,
            StartDate = contract.StartDate,
            EndDate = contract.EndDate,
            Terms = contract.Terms,
            TasksCount = contract.Tasks.Count,
            CompletedTasksCount = contract.Tasks.Count(t => t.Status == TaskItemStatus.Completed),
            AttachmentsCount = contract.Attachments.Count,
            Items = contract.Items.Select(i => new ContractItemDto
            {
                Id = i.Id,
                ContractId = i.ContractId,
                ServiceItemId = i.ServiceItemId,
                Description = i.Description,
                Quantity = i.Quantity,
                UnitPriceCents = i.UnitPrice.Cents,
                TotalPriceCents = i.TotalPrice.Cents
            }).ToList(),
            CreatedAtUtc = contract.CreatedAtUtc,
            UpdatedAtUtc = contract.UpdatedAtUtc
        };

        return ApiResponse<ContractDto>.Ok(dto);
    }
}
