using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ServiCore.Application.Common.Interfaces;
using ServiCore.Application.Common.Models;
using ServiCore.Application.Features.Calendar.DTOs;
using ServiCore.Domain.Entities;
using ServiCore.Domain.Enums;

namespace ServiCore.Api.Controllers;

[Authorize]
public class CalendarController : ApiControllerBase
{
    private readonly IAppDbContext _context;
    private readonly ICurrentWorkspaceService _currentWorkspaceService;

    public CalendarController(
        IAppDbContext context,
        ICurrentWorkspaceService currentWorkspaceService)
    {
        _context = context;
        _currentWorkspaceService = currentWorkspaceService;
    }

    /// <summary>
    /// Retorna os eventos e prazos operacionais para um intervalo de datas (visão mensal/semanal da agenda).
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<CalendarEventDto>>>> GetEvents([FromQuery] CalendarEventFilterParams query)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<List<CalendarEventDto>>.Fail("Workspace não identificado."));

        var baseQuery = _context.CalendarEvents
            .AsNoTracking()
            .Include(e => e.Customer)
            .Include(e => e.Contract)
            .Include(e => e.TaskItem)
            .AsQueryable();

        if (query.StartDate.HasValue)
        {
            baseQuery = baseQuery.Where(e => e.EndTimeUtc >= query.StartDate.Value);
        }

        if (query.EndDate.HasValue)
        {
            baseQuery = baseQuery.Where(e => e.StartTimeUtc <= query.EndDate.Value);
        }

        if (query.Type.HasValue)
        {
            baseQuery = baseQuery.Where(e => e.Type == query.Type.Value);
        }

        if (query.CustomerId.HasValue)
        {
            baseQuery = baseQuery.Where(e => e.CustomerId == query.CustomerId.Value);
        }

        var events = await baseQuery
            .OrderBy(e => e.StartTimeUtc)
            .Select(e => new CalendarEventDto
            {
                Id = e.Id,
                WorkspaceId = e.WorkspaceId,
                Title = e.Title,
                Description = e.Description,
                LocationOrLink = e.LocationOrLink,
                StartTimeUtc = e.StartTimeUtc,
                EndTimeUtc = e.EndTimeUtc,
                Type = e.Type,
                Status = e.Status,
                CustomerId = e.CustomerId,
                CustomerName = e.Customer != null ? e.Customer.Name : null,
                ContractId = e.ContractId,
                ContractTitle = e.Contract != null ? e.Contract.Title : null,
                TaskItemId = e.TaskItemId,
                TaskItemTitle = e.TaskItem != null ? e.TaskItem.Title : null,
                CreatedAtUtc = e.CreatedAtUtc
            })
            .ToListAsync();

        // Se solicitado, sintetiza também tarefas com prazo de entrega no intervalo
        if (query.IncludeTaskDeadlines)
        {
            var tasksQuery = _context.Tasks
                .AsNoTracking()
                .Include(t => t.Customer)
                .Include(t => t.Contract)
                .Where(t => t.DueDate.HasValue && t.Status != TaskItemStatus.Cancelled);

            if (query.StartDate.HasValue)
                tasksQuery = tasksQuery.Where(t => t.DueDate >= query.StartDate.Value);

            if (query.EndDate.HasValue)
                tasksQuery = tasksQuery.Where(t => t.DueDate <= query.EndDate.Value);

            if (query.CustomerId.HasValue)
                tasksQuery = tasksQuery.Where(t => t.CustomerId == query.CustomerId.Value);

            var tasks = await tasksQuery.ToListAsync();

            foreach (var task in tasks)
            {
                var dueDate = task.DueDate!.Value;
                events.Add(new CalendarEventDto
                {
                    Id = task.Id,
                    WorkspaceId = task.WorkspaceId,
                    Title = $"Prazo: {task.Title}",
                    Description = task.Description,
                    LocationOrLink = null,
                    StartTimeUtc = dueDate,
                    EndTimeUtc = dueDate.AddHours(1),
                    Type = CalendarEventType.TaskDeadline,
                    Status = task.Status == TaskItemStatus.Completed ? CalendarEventStatus.Completed : CalendarEventStatus.Scheduled,
                    CustomerId = task.CustomerId,
                    CustomerName = task.Customer?.Name,
                    ContractId = task.ContractId,
                    ContractTitle = task.Contract?.Title,
                    TaskItemId = task.Id,
                    TaskItemTitle = task.Title,
                    CreatedAtUtc = task.CreatedAtUtc
                });
            }

            events = events.OrderBy(e => e.StartTimeUtc).ToList();
        }

        return Ok(ApiResponse<List<CalendarEventDto>>.Ok(events));
    }

    /// <summary>
    /// Consulta detalhes de um evento da agenda por ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<CalendarEventDto>>> GetEventById(Guid id)
    {
        var ev = await _context.CalendarEvents
            .AsNoTracking()
            .Include(e => e.Customer)
            .Include(e => e.Contract)
            .Include(e => e.TaskItem)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (ev == null)
            return NotFound(ApiResponse<CalendarEventDto>.Fail("Compromisso não encontrado."));

        var dto = new CalendarEventDto
        {
            Id = ev.Id,
            WorkspaceId = ev.WorkspaceId,
            Title = ev.Title,
            Description = ev.Description,
            LocationOrLink = ev.LocationOrLink,
            StartTimeUtc = ev.StartTimeUtc,
            EndTimeUtc = ev.EndTimeUtc,
            Type = ev.Type,
            Status = ev.Status,
            CustomerId = ev.CustomerId,
            CustomerName = ev.Customer?.Name,
            ContractId = ev.ContractId,
            ContractTitle = ev.Contract?.Title,
            TaskItemId = ev.TaskItemId,
            TaskItemTitle = ev.TaskItem?.Title,
            CreatedAtUtc = ev.CreatedAtUtc
        };

        return Ok(ApiResponse<CalendarEventDto>.Ok(dto));
    }

    /// <summary>
    /// Agenda um novo compromisso na agenda do workspace.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<CalendarEventDto>>> CreateEvent([FromBody] CreateCalendarEventDto request)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        var userId = _currentWorkspaceService.UserId;

        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<CalendarEventDto>.Fail("Workspace não identificado."));

        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(ApiResponse<CalendarEventDto>.Fail("O título do compromisso é obrigatório."));

        if (request.EndTimeUtc < request.StartTimeUtc)
            return BadRequest(ApiResponse<CalendarEventDto>.Fail("O término do evento não pode ser anterior ao início."));

        var ev = new CalendarEvent(
            workspaceId.Value,
            request.Title,
            request.StartTimeUtc,
            request.EndTimeUtc,
            request.Type,
            request.Description,
            request.LocationOrLink,
            request.CustomerId,
            request.ContractId,
            request.TaskItemId
        );

        _context.CalendarEvents.Add(ev);

        var audit = new AuditLog(
            workspaceId.Value,
            userId,
            "CALENDAR_EVENT_CREATED",
            "CalendarEvent",
            ev.Id.ToString(),
            $"Compromisso '{ev.Title}' agendado para {ev.StartTimeUtc:g}."
        );
        _context.AuditLogs.Add(audit);

        await _context.SaveChangesAsync();

        var dto = new CalendarEventDto
        {
            Id = ev.Id,
            WorkspaceId = ev.WorkspaceId,
            Title = ev.Title,
            Description = ev.Description,
            LocationOrLink = ev.LocationOrLink,
            StartTimeUtc = ev.StartTimeUtc,
            EndTimeUtc = ev.EndTimeUtc,
            Type = ev.Type,
            Status = ev.Status,
            CustomerId = ev.CustomerId,
            ContractId = ev.ContractId,
            TaskItemId = ev.TaskItemId,
            CreatedAtUtc = ev.CreatedAtUtc
        };

        return CreatedAtAction(nameof(GetEventById), new { id = ev.Id }, ApiResponse<CalendarEventDto>.Ok(dto, "Compromisso agendado com sucesso."));
    }

    /// <summary>
    /// Atualiza um compromisso agendado.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<CalendarEventDto>>> UpdateEvent(Guid id, [FromBody] UpdateCalendarEventDto request)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        var userId = _currentWorkspaceService.UserId;

        var ev = await _context.CalendarEvents.FirstOrDefaultAsync(e => e.Id == id);
        if (ev == null)
            return NotFound(ApiResponse<CalendarEventDto>.Fail("Compromisso não encontrado."));

        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(ApiResponse<CalendarEventDto>.Fail("O título do compromisso é obrigatório."));

        if (request.EndTimeUtc < request.StartTimeUtc)
            return BadRequest(ApiResponse<CalendarEventDto>.Fail("O término do evento não pode ser anterior ao início."));

        ev.Update(
            request.Title,
            request.StartTimeUtc,
            request.EndTimeUtc,
            request.Type,
            request.Description,
            request.LocationOrLink,
            request.CustomerId,
            request.ContractId,
            request.TaskItemId
        );

        var audit = new AuditLog(
            workspaceId,
            userId,
            "CALENDAR_EVENT_UPDATED",
            "CalendarEvent",
            ev.Id.ToString(),
            $"Compromisso '{ev.Title}' atualizado."
        );
        _context.AuditLogs.Add(audit);

        await _context.SaveChangesAsync();

        var dto = new CalendarEventDto
        {
            Id = ev.Id,
            WorkspaceId = ev.WorkspaceId,
            Title = ev.Title,
            Description = ev.Description,
            LocationOrLink = ev.LocationOrLink,
            StartTimeUtc = ev.StartTimeUtc,
            EndTimeUtc = ev.EndTimeUtc,
            Type = ev.Type,
            Status = ev.Status,
            CustomerId = ev.CustomerId,
            ContractId = ev.ContractId,
            TaskItemId = ev.TaskItemId,
            CreatedAtUtc = ev.CreatedAtUtc
        };

        return Ok(ApiResponse<CalendarEventDto>.Ok(dto, "Compromisso atualizado com sucesso."));
    }

    /// <summary>
    /// Cancela ou remove um compromisso da agenda.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteEvent(Guid id)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        var userId = _currentWorkspaceService.UserId;

        var ev = await _context.CalendarEvents.FirstOrDefaultAsync(e => e.Id == id);
        if (ev == null)
            return NotFound(ApiResponse<bool>.Fail("Compromisso não encontrado."));

        _context.CalendarEvents.Remove(ev);

        var audit = new AuditLog(
            workspaceId,
            userId,
            "CALENDAR_EVENT_DELETED",
            "CalendarEvent",
            ev.Id.ToString(),
            $"Compromisso '{ev.Title}' removido."
        );
        _context.AuditLogs.Add(audit);

        await _context.SaveChangesAsync();

        return Ok(ApiResponse<bool>.Ok(true, "Compromisso removido com sucesso."));
    }
}
