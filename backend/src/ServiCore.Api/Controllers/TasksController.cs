using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ServiCore.Application.Common.Interfaces;
using ServiCore.Application.Common.Models;
using ServiCore.Application.Features.Customers.DTOs;
using ServiCore.Application.Features.Tasks.DTOs;
using ServiCore.Domain.Entities;
using ServiCore.Domain.Enums;

namespace ServiCore.Api.Controllers;

[Authorize]
public class TasksController : ApiControllerBase
{
    private readonly IAppDbContext _context;
    private readonly ICurrentWorkspaceService _currentWorkspaceService;

    public TasksController(
        IAppDbContext context,
        ICurrentWorkspaceService currentWorkspaceService)
    {
        _context = context;
        _currentWorkspaceService = currentWorkspaceService;
    }

    /// <summary>
    /// Lista tarefas do workspace com filtros operacionais (status, prioridade, cliente, contrato).
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<TaskItemDto>>>> GetTasks([FromQuery] TaskItemFilterParams query)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<PagedResult<TaskItemDto>>.Fail("Workspace não identificado."));

        var baseQuery = _context.Tasks
            .AsNoTracking()
            .Include(t => t.Customer)
            .Include(t => t.Contract)
            .Include(t => t.ServiceItem)
            .AsQueryable();

        // 1. Busca textual
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var searchClean = query.Search.Trim().ToLower();
            baseQuery = baseQuery.Where(t =>
                t.Title.ToLower().Contains(searchClean) ||
                (t.Description != null && t.Description.ToLower().Contains(searchClean))
            );
        }

        // 2. Filtro por status
        if (query.Status.HasValue)
        {
            baseQuery = baseQuery.Where(t => t.Status == query.Status.Value);
        }

        // 3. Filtro por prioridade
        if (query.Priority.HasValue)
        {
            baseQuery = baseQuery.Where(t => t.Priority == query.Priority.Value);
        }

        // 4. Filtro por cliente
        if (query.CustomerId.HasValue)
        {
            baseQuery = baseQuery.Where(t => t.CustomerId == query.CustomerId.Value);
        }

        // 5. Filtro por contrato
        if (query.ContractId.HasValue)
        {
            baseQuery = baseQuery.Where(t => t.ContractId == query.ContractId.Value);
        }

        var totalCount = await baseQuery.CountAsync();

        // 6. Ordenação
        baseQuery = (query.SortBy?.ToLower(), query.SortDescending) switch
        {
            ("priority", true) => baseQuery.OrderByDescending(t => t.Priority),
            ("priority", false) => baseQuery.OrderBy(t => t.Priority),
            ("createdat", true) => baseQuery.OrderByDescending(t => t.CreatedAtUtc),
            ("createdat", false) => baseQuery.OrderBy(t => t.CreatedAtUtc),
            ("title", true) => baseQuery.OrderByDescending(t => t.Title),
            ("title", false) => baseQuery.OrderBy(t => t.Title),
            ("duedate", true) => baseQuery.OrderByDescending(t => t.DueDate),
            _ => baseQuery.OrderBy(t => t.DueDate.HasValue ? 0 : 1).ThenBy(t => t.DueDate)
        };

        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var items = await baseQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new TaskItemDto
            {
                Id = t.Id,
                WorkspaceId = t.WorkspaceId,
                Title = t.Title,
                Description = t.Description,
                CustomerId = t.CustomerId,
                CustomerName = t.Customer != null ? t.Customer.Name : null,
                ContractId = t.ContractId,
                ContractTitle = t.Contract != null ? t.Contract.Title : null,
                ServiceItemId = t.ServiceItemId,
                ServiceItemName = t.ServiceItem != null ? t.ServiceItem.Name : null,
                Priority = t.Priority,
                Status = t.Status,
                DueDate = t.DueDate,
                EstimatedMinutes = t.EstimatedMinutes,
                SpentMinutes = t.SpentMinutes,
                CompletedAtUtc = t.CompletedAtUtc,
                CreatedAtUtc = t.CreatedAtUtc,
                UpdatedAtUtc = t.UpdatedAtUtc
            })
            .ToListAsync();

        var result = new PagedResult<TaskItemDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return Ok(ApiResponse<PagedResult<TaskItemDto>>.Ok(result));
    }

    /// <summary>
    /// Consulta detalhes de uma tarefa por ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<TaskItemDto>>> GetTaskById(Guid id)
    {
        var task = await _context.Tasks
            .AsNoTracking()
            .Include(t => t.Customer)
            .Include(t => t.Contract)
            .Include(t => t.ServiceItem)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (task == null)
            return NotFound(ApiResponse<TaskItemDto>.Fail("Tarefa não encontrada."));

        var dto = new TaskItemDto
        {
            Id = task.Id,
            WorkspaceId = task.WorkspaceId,
            Title = task.Title,
            Description = task.Description,
            CustomerId = task.CustomerId,
            CustomerName = task.Customer?.Name,
            ContractId = task.ContractId,
            ContractTitle = task.Contract?.Title,
            ServiceItemId = task.ServiceItemId,
            ServiceItemName = task.ServiceItem?.Name,
            Priority = task.Priority,
            Status = task.Status,
            DueDate = task.DueDate,
            EstimatedMinutes = task.EstimatedMinutes,
            SpentMinutes = task.SpentMinutes,
            CompletedAtUtc = task.CompletedAtUtc,
            CreatedAtUtc = task.CreatedAtUtc,
            UpdatedAtUtc = task.UpdatedAtUtc
        };

        return Ok(ApiResponse<TaskItemDto>.Ok(dto));
    }

    /// <summary>
    /// Cria uma nova tarefa na operação.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<TaskItemDto>>> CreateTask([FromBody] CreateTaskItemDto request)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        var userId = _currentWorkspaceService.UserId;

        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<TaskItemDto>.Fail("Workspace não identificado."));

        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(ApiResponse<TaskItemDto>.Fail("O título da tarefa é obrigatório."));

        var task = new TaskItem(
            workspaceId.Value,
            request.Title,
            request.Priority,
            request.Description,
            request.CustomerId,
            request.ContractId,
            request.ServiceItemId,
            request.DueDate,
            request.EstimatedMinutes
        );

        _context.Tasks.Add(task);

        var audit = new AuditLog(
            workspaceId.Value,
            userId,
            "TASK_CREATED",
            "TaskItem",
            task.Id.ToString(),
            $"Tarefa '{task.Title}' criada com prioridade {task.Priority}."
        );
        _context.AuditLogs.Add(audit);

        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTaskById), new { id = task.Id }, await GetTaskByIdInternal(task.Id));
    }

    /// <summary>
    /// Atualiza dados da tarefa.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<TaskItemDto>>> UpdateTask(Guid id, [FromBody] UpdateTaskItemDto request)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        var userId = _currentWorkspaceService.UserId;

        var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == id);
        if (task == null)
            return NotFound(ApiResponse<TaskItemDto>.Fail("Tarefa não encontrada."));

        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(ApiResponse<TaskItemDto>.Fail("O título da tarefa é obrigatório."));

        task.Update(
            request.Title,
            request.Priority,
            request.Description,
            request.CustomerId,
            request.ContractId,
            request.ServiceItemId,
            request.DueDate,
            request.EstimatedMinutes
        );

        if (request.SpentMinutes.HasValue && request.SpentMinutes.Value >= 0)
        {
            task.AddSpentMinutes(request.SpentMinutes.Value - (task.SpentMinutes ?? 0));
        }

        var audit = new AuditLog(
            workspaceId,
            userId,
            "TASK_UPDATED",
            "TaskItem",
            task.Id.ToString(),
            $"Tarefa '{task.Title}' atualizada."
        );
        _context.AuditLogs.Add(audit);

        await _context.SaveChangesAsync();

        return Ok(await GetTaskByIdInternal(task.Id));
    }

    /// <summary>
    /// Altera rapidamente o status da tarefa (ex: Pendente -> Em Andamento -> Concluída).
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<ApiResponse<TaskItemDto>>> UpdateStatus(Guid id, [FromBody] UpdateTaskStatusDto request)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        var userId = _currentWorkspaceService.UserId;

        var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == id);
        if (task == null)
            return NotFound(ApiResponse<TaskItemDto>.Fail("Tarefa não encontrada."));

        task.ChangeStatus(request.Status);

        var audit = new AuditLog(
            workspaceId,
            userId,
            "TASK_STATUS_CHANGED",
            "TaskItem",
            task.Id.ToString(),
            $"Status da tarefa '{task.Title}' alterado para {request.Status}."
        );
        _context.AuditLogs.Add(audit);

        await _context.SaveChangesAsync();

        return Ok(await GetTaskByIdInternal(task.Id));
    }

    /// <summary>
    /// Exclui uma tarefa.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteTask(Guid id)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        var userId = _currentWorkspaceService.UserId;

        var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == id);
        if (task == null)
            return NotFound(ApiResponse<bool>.Fail("Tarefa não encontrada."));

        _context.Tasks.Remove(task);

        var audit = new AuditLog(
            workspaceId,
            userId,
            "TASK_DELETED",
            "TaskItem",
            task.Id.ToString(),
            $"Tarefa '{task.Title}' excluída."
        );
        _context.AuditLogs.Add(audit);

        await _context.SaveChangesAsync();

        return Ok(ApiResponse<bool>.Ok(true, "Tarefa excluída com sucesso."));
    }

    private async Task<ApiResponse<TaskItemDto>> GetTaskByIdInternal(Guid id)
    {
        var task = await _context.Tasks
            .AsNoTracking()
            .Include(t => t.Customer)
            .Include(t => t.Contract)
            .Include(t => t.ServiceItem)
            .FirstAsync(t => t.Id == id);

        var dto = new TaskItemDto
        {
            Id = task.Id,
            WorkspaceId = task.WorkspaceId,
            Title = task.Title,
            Description = task.Description,
            CustomerId = task.CustomerId,
            CustomerName = task.Customer?.Name,
            ContractId = task.ContractId,
            ContractTitle = task.Contract?.Title,
            ServiceItemId = task.ServiceItemId,
            ServiceItemName = task.ServiceItem?.Name,
            Priority = task.Priority,
            Status = task.Status,
            DueDate = task.DueDate,
            EstimatedMinutes = task.EstimatedMinutes,
            SpentMinutes = task.SpentMinutes,
            CompletedAtUtc = task.CompletedAtUtc,
            CreatedAtUtc = task.CreatedAtUtc,
            UpdatedAtUtc = task.UpdatedAtUtc
        };

        return ApiResponse<TaskItemDto>.Ok(dto);
    }
}
