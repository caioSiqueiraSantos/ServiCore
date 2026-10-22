using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ServiCore.Application.Common.Interfaces;
using ServiCore.Application.Common.Models;
using ServiCore.Application.Features.Customers.DTOs;
using ServiCore.Application.Features.Services.DTOs;
using ServiCore.Domain.Common;
using ServiCore.Domain.Entities;
using ServiCore.Domain.Enums;

namespace ServiCore.Api.Controllers;

[Authorize]
public class ServicesController : ApiControllerBase
{
    private readonly IAppDbContext _context;
    private readonly ICurrentWorkspaceService _currentWorkspaceService;

    public ServicesController(
        IAppDbContext context,
        ICurrentWorkspaceService currentWorkspaceService)
    {
        _context = context;
        _currentWorkspaceService = currentWorkspaceService;
    }

    /// <summary>
    /// Lista serviços do catálogo com suporte a busca, filtros e paginação.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<ServiceItemDto>>>> GetServices([FromQuery] ServiceItemFilterParams query)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<PagedResult<ServiceItemDto>>.Fail("Workspace não identificado."));

        var baseQuery = _context.Services.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var searchClean = query.Search.Trim().ToLower();
            baseQuery = baseQuery.Where(s =>
                s.Name.ToLower().Contains(searchClean) ||
                (s.Description != null && s.Description.ToLower().Contains(searchClean))
            );
        }

        if (query.Status.HasValue)
        {
            baseQuery = baseQuery.Where(s => s.Status == query.Status.Value);
        }

        if (query.BillingUnit.HasValue)
        {
            baseQuery = baseQuery.Where(s => s.BillingUnit == query.BillingUnit.Value);
        }

        var totalCount = await baseQuery.CountAsync();

        baseQuery = (query.SortBy?.ToLower(), query.SortDescending) switch
        {
            ("price", true) => baseQuery.OrderByDescending(s => s.DefaultPrice.Cents),
            ("price", false) => baseQuery.OrderBy(s => s.DefaultPrice.Cents),
            ("name", true) => baseQuery.OrderByDescending(s => s.Name),
            _ => baseQuery.OrderBy(s => s.Name)
        };

        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var items = await baseQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new ServiceItemDto
            {
                Id = s.Id,
                WorkspaceId = s.WorkspaceId,
                Name = s.Name,
                Description = s.Description,
                DefaultPriceCents = s.DefaultPrice.Cents,
                BillingUnit = s.BillingUnit,
                EstimatedHours = s.EstimatedHours,
                Status = s.Status,
                CreatedAtUtc = s.CreatedAtUtc,
                UpdatedAtUtc = s.UpdatedAtUtc
            })
            .ToListAsync();

        var result = new PagedResult<ServiceItemDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return Ok(ApiResponse<PagedResult<ServiceItemDto>>.Ok(result));
    }

    /// <summary>
    /// Consulta detalhes de um serviço do catálogo por ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<ServiceItemDto>>> GetServiceById(Guid id)
    {
        var service = await _context.Services
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id);

        if (service == null)
            return NotFound(ApiResponse<ServiceItemDto>.Fail("Serviço não encontrado."));

        var dto = new ServiceItemDto
        {
            Id = service.Id,
            WorkspaceId = service.WorkspaceId,
            Name = service.Name,
            Description = service.Description,
            DefaultPriceCents = service.DefaultPrice.Cents,
            BillingUnit = service.BillingUnit,
            EstimatedHours = service.EstimatedHours,
            Status = service.Status,
            CreatedAtUtc = service.CreatedAtUtc,
            UpdatedAtUtc = service.UpdatedAtUtc
        };

        return Ok(ApiResponse<ServiceItemDto>.Ok(dto));
    }

    /// <summary>
    /// Cadastra um novo serviço no catálogo do workspace ativo.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<ServiceItemDto>>> CreateService([FromBody] CreateServiceItemDto request)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        var userId = _currentWorkspaceService.UserId;

        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<ServiceItemDto>.Fail("Workspace não identificado."));

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<ServiceItemDto>.Fail("O nome do serviço é obrigatório."));

        var service = new ServiceItem(
            workspaceId.Value,
            request.Name,
            new Money(request.DefaultPriceCents),
            request.BillingUnit,
            request.Description,
            request.EstimatedHours
        );

        _context.Services.Add(service);

        var audit = new AuditLog(
            workspaceId.Value,
            userId,
            "SERVICE_CREATED",
            "ServiceItem",
            service.Id.ToString(),
            $"Serviço '{service.Name}' cadastrado no catálogo."
        );
        _context.AuditLogs.Add(audit);

        await _context.SaveChangesAsync();

        var dto = new ServiceItemDto
        {
            Id = service.Id,
            WorkspaceId = service.WorkspaceId,
            Name = service.Name,
            Description = service.Description,
            DefaultPriceCents = service.DefaultPrice.Cents,
            BillingUnit = service.BillingUnit,
            EstimatedHours = service.EstimatedHours,
            Status = service.Status,
            CreatedAtUtc = service.CreatedAtUtc
        };

        return CreatedAtAction(nameof(GetServiceById), new { id = service.Id }, ApiResponse<ServiceItemDto>.Ok(dto, "Serviço cadastrado com sucesso."));
    }

    /// <summary>
    /// Atualiza dados de um serviço no catálogo.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<ServiceItemDto>>> UpdateService(Guid id, [FromBody] UpdateServiceItemDto request)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        var userId = _currentWorkspaceService.UserId;

        var service = await _context.Services.FirstOrDefaultAsync(s => s.Id == id);
        if (service == null)
            return NotFound(ApiResponse<ServiceItemDto>.Fail("Serviço não encontrado."));

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<ServiceItemDto>.Fail("O nome do serviço é obrigatório."));

        service.Update(
            request.Name,
            new Money(request.DefaultPriceCents),
            request.BillingUnit,
            request.Description,
            request.EstimatedHours,
            request.Status
        );

        var audit = new AuditLog(
            workspaceId,
            userId,
            "SERVICE_UPDATED",
            "ServiceItem",
            service.Id.ToString(),
            $"Serviço '{service.Name}' atualizado."
        );
        _context.AuditLogs.Add(audit);

        await _context.SaveChangesAsync();

        var dto = new ServiceItemDto
        {
            Id = service.Id,
            WorkspaceId = service.WorkspaceId,
            Name = service.Name,
            Description = service.Description,
            DefaultPriceCents = service.DefaultPrice.Cents,
            BillingUnit = service.BillingUnit,
            EstimatedHours = service.EstimatedHours,
            Status = service.Status,
            CreatedAtUtc = service.CreatedAtUtc,
            UpdatedAtUtc = service.UpdatedAtUtc
        };

        return Ok(ApiResponse<ServiceItemDto>.Ok(dto, "Serviço atualizado com sucesso."));
    }

    /// <summary>
    /// Inativa um serviço do catálogo (preservando integridade com contratos).
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteService(Guid id)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        var userId = _currentWorkspaceService.UserId;

        var service = await _context.Services.FirstOrDefaultAsync(s => s.Id == id);
        if (service == null)
            return NotFound(ApiResponse<bool>.Fail("Serviço não encontrado."));

        service.Deactivate();

        var audit = new AuditLog(
            workspaceId,
            userId,
            "SERVICE_DEACTIVATED",
            "ServiceItem",
            service.Id.ToString(),
            $"Serviço '{service.Name}' inativado."
        );
        _context.AuditLogs.Add(audit);

        await _context.SaveChangesAsync();

        return Ok(ApiResponse<bool>.Ok(true, "Serviço inativado com sucesso."));
    }
}
