using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ServiCore.Application.Common.Interfaces;
using ServiCore.Application.Common.Models;
using ServiCore.Application.Features.Customers.DTOs;
using ServiCore.Domain.Entities;
using ServiCore.Domain.Enums;

namespace ServiCore.Api.Controllers;

[Authorize]
public class CustomersController : ApiControllerBase
{
    private readonly IAppDbContext _context;
    private readonly ICurrentWorkspaceService _currentWorkspaceService;

    public CustomersController(
        IAppDbContext context,
        ICurrentWorkspaceService currentWorkspaceService)
    {
        _context = context;
        _currentWorkspaceService = currentWorkspaceService;
    }

    /// <summary>
    /// Lista clientes do workspace autenticado com suporte a busca, filtros e paginação.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<CustomerDto>>>> GetCustomers([FromQuery] CustomerFilterParams query)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<PagedResult<CustomerDto>>.Fail("Workspace não identificado."));

        // O Global Query Filter do EF Core já isola os registros do workspace autenticado
        var baseQuery = _context.Customers.AsNoTracking();

        // 1. Busca textual rápida
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var searchClean = query.Search.Trim().ToLower();
            var searchDigits = new string(query.Search.Where(char.IsDigit).ToArray());

            baseQuery = baseQuery.Where(c =>
                c.Name.ToLower().Contains(searchClean) ||
                (c.Email != null && c.Email.ToLower().Contains(searchClean)) ||
                (c.Phone != null && c.Phone.Contains(searchClean)) ||
                (!string.IsNullOrEmpty(searchDigits) && c.Document != null && c.Document.Contains(searchDigits))
            );
        }

        // 2. Filtro por tipo (PF / PJ)
        if (query.Type.HasValue)
        {
            baseQuery = baseQuery.Where(c => c.Type == query.Type.Value);
        }

        // 3. Filtro por status (Ativo / Inativo)
        if (query.Status.HasValue)
        {
            baseQuery = baseQuery.Where(c => c.Status == query.Status.Value);
        }

        // Total antes da paginação
        var totalCount = await baseQuery.CountAsync();

        // 4. Ordenação
        baseQuery = (query.SortBy?.ToLower(), query.SortDescending) switch
        {
            ("createdat", true) => baseQuery.OrderByDescending(c => c.CreatedAtUtc),
            ("createdat", false) => baseQuery.OrderBy(c => c.CreatedAtUtc),
            ("document", true) => baseQuery.OrderByDescending(c => c.Document),
            ("document", false) => baseQuery.OrderBy(c => c.Document),
            ("name", true) => baseQuery.OrderByDescending(c => c.Name),
            _ => baseQuery.OrderBy(c => c.Name)
        };

        // 5. Paginação
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var items = await baseQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CustomerDto
            {
                Id = c.Id,
                WorkspaceId = c.WorkspaceId,
                Type = c.Type,
                Name = c.Name,
                Document = c.Document,
                Email = c.Email,
                Phone = c.Phone,
                Notes = c.Notes,
                Status = c.Status,
                CreatedAtUtc = c.CreatedAtUtc,
                UpdatedAtUtc = c.UpdatedAtUtc
            })
            .ToListAsync();

        var result = new PagedResult<CustomerDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return Ok(ApiResponse<PagedResult<CustomerDto>>.Ok(result));
    }

    /// <summary>
    /// Consulta os detalhes de um cliente por ID no workspace autenticado.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<CustomerDto>>> GetCustomerById(Guid id)
    {
        var customer = await _context.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);

        if (customer == null)
            return NotFound(ApiResponse<CustomerDto>.Fail("Cliente não encontrado ou não pertence a este workspace."));

        var dto = new CustomerDto
        {
            Id = customer.Id,
            WorkspaceId = customer.WorkspaceId,
            Type = customer.Type,
            Name = customer.Name,
            Document = customer.Document,
            Email = customer.Email,
            Phone = customer.Phone,
            Notes = customer.Notes,
            Status = customer.Status,
            CreatedAtUtc = customer.CreatedAtUtc,
            UpdatedAtUtc = customer.UpdatedAtUtc
        };

        return Ok(ApiResponse<CustomerDto>.Ok(dto));
    }

    /// <summary>
    /// Cadastra um novo cliente no workspace ativo.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<CustomerDto>>> CreateCustomer([FromBody] CreateCustomerDto request)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        var userId = _currentWorkspaceService.UserId;

        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<CustomerDto>.Fail("Workspace não identificado."));

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<CustomerDto>.Fail("O nome do cliente é obrigatório."));

        // Se documento fornecido, valida unicidade no workspace
        var cleanDoc = string.IsNullOrWhiteSpace(request.Document)
            ? null
            : new string(request.Document.Where(char.IsDigit).ToArray());

        if (!string.IsNullOrEmpty(cleanDoc))
        {
            var docExists = await _context.Customers.AnyAsync(c => c.Document == cleanDoc);
            if (docExists)
            {
                return BadRequest(ApiResponse<CustomerDto>.Fail("Já existe um cliente cadastrado com este documento neste workspace."));
            }
        }

        var customer = new Customer(
            workspaceId.Value,
            request.Name,
            request.Type,
            cleanDoc,
            request.Email,
            request.Phone,
            request.Notes
        );

        _context.Customers.Add(customer);

        var audit = new AuditLog(
            workspaceId.Value,
            userId,
            "CUSTOMER_CREATED",
            "Customer",
            customer.Id.ToString(),
            $"Cliente '{customer.Name}' cadastrado ({customer.Type})."
        );
        _context.AuditLogs.Add(audit);

        await _context.SaveChangesAsync();

        var dto = new CustomerDto
        {
            Id = customer.Id,
            WorkspaceId = customer.WorkspaceId,
            Type = customer.Type,
            Name = customer.Name,
            Document = customer.Document,
            Email = customer.Email,
            Phone = customer.Phone,
            Notes = customer.Notes,
            Status = customer.Status,
            CreatedAtUtc = customer.CreatedAtUtc
        };

        return CreatedAtAction(nameof(GetCustomerById), new { id = customer.Id }, ApiResponse<CustomerDto>.Ok(dto, "Cliente cadastrado com sucesso."));
    }

    /// <summary>
    /// Atualiza os dados de um cliente existente.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<CustomerDto>>> UpdateCustomer(Guid id, [FromBody] UpdateCustomerDto request)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        var userId = _currentWorkspaceService.UserId;

        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Id == id);
        if (customer == null)
            return NotFound(ApiResponse<CustomerDto>.Fail("Cliente não encontrado ou não pertence a este workspace."));

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<CustomerDto>.Fail("O nome do cliente é obrigatório."));

        var cleanDoc = string.IsNullOrWhiteSpace(request.Document)
            ? null
            : new string(request.Document.Where(char.IsDigit).ToArray());

        if (!string.IsNullOrEmpty(cleanDoc))
        {
            var docExists = await _context.Customers.AnyAsync(c => c.Id != id && c.Document == cleanDoc);
            if (docExists)
            {
                return BadRequest(ApiResponse<CustomerDto>.Fail("Já existe outro cliente com este documento neste workspace."));
            }
        }

        customer.Update(
            request.Name,
            request.Type,
            cleanDoc,
            request.Email,
            request.Phone,
            request.Notes
        );

        if (request.Status == CustomerStatus.Active && customer.Status != CustomerStatus.Active)
            customer.Activate();
        else if (request.Status == CustomerStatus.Inactive && customer.Status != CustomerStatus.Inactive)
            customer.Deactivate();

        var audit = new AuditLog(
            workspaceId,
            userId,
            "CUSTOMER_UPDATED",
            "Customer",
            customer.Id.ToString(),
            $"Cliente '{customer.Name}' atualizado."
        );
        _context.AuditLogs.Add(audit);

        await _context.SaveChangesAsync();

        var dto = new CustomerDto
        {
            Id = customer.Id,
            WorkspaceId = customer.WorkspaceId,
            Type = customer.Type,
            Name = customer.Name,
            Document = customer.Document,
            Email = customer.Email,
            Phone = customer.Phone,
            Notes = customer.Notes,
            Status = customer.Status,
            CreatedAtUtc = customer.CreatedAtUtc,
            UpdatedAtUtc = customer.UpdatedAtUtc
        };

        return Ok(ApiResponse<CustomerDto>.Ok(dto, "Cliente atualizado com sucesso."));
    }

    /// <summary>
    /// Inativa ou remove um cliente do workspace.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteCustomer(Guid id)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        var userId = _currentWorkspaceService.UserId;

        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Id == id);
        if (customer == null)
            return NotFound(ApiResponse<bool>.Fail("Cliente não encontrado ou não pertence a este workspace."));

        // Inativação segura (preserva rastreabilidade e histórico)
        customer.Deactivate();

        var audit = new AuditLog(
            workspaceId,
            userId,
            "CUSTOMER_DEACTIVATED",
            "Customer",
            customer.Id.ToString(),
            $"Cliente '{customer.Name}' foi inativado."
        );
        _context.AuditLogs.Add(audit);

        await _context.SaveChangesAsync();

        return Ok(ApiResponse<bool>.Ok(true, "Cliente inativado com sucesso."));
    }

    /// <summary>
    /// Retorna o resumo operacional e financeiro do cliente.
    /// </summary>
    [HttpGet("{id:guid}/summary")]
    public async Task<ActionResult<ApiResponse<CustomerSummaryDto>>> GetCustomerSummary(Guid id)
    {
        var customer = await _context.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);

        if (customer == null)
            return NotFound(ApiResponse<CustomerSummaryDto>.Fail("Cliente não encontrado."));

        var summary = new CustomerSummaryDto
        {
            Id = customer.Id,
            Name = customer.Name,
            Type = customer.Type,
            Document = customer.Document,
            Email = customer.Email,
            Phone = customer.Phone,
            Status = customer.Status,
            ActiveContractsCount = 0,
            TotalBilledCents = 0,
            PendingReceivablesCents = 0
        };

        return Ok(ApiResponse<CustomerSummaryDto>.Ok(summary));
    }
}
