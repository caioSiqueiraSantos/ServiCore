using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ServiCore.Application.Common.Interfaces;
using ServiCore.Application.Common.Models;
using ServiCore.Application.Features.Auth.DTOs;
using ServiCore.Domain.Entities;
using ServiCore.Domain.Enums;

namespace ServiCore.Api.Controllers;

public class AuthController : ApiControllerBase
{
    private readonly IAppDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly ICurrentWorkspaceService _currentWorkspaceService;

    public AuthController(
        IAppDbContext context,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator,
        ICurrentWorkspaceService currentWorkspaceService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
        _currentWorkspaceService = currentWorkspaceService;
    }

    /// <summary>
    /// Cadastra um novo usuário, provisiona seu workspace inicial e gera o token de acesso JWT.
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register([FromBody] RegisterRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
            return BadRequest(ApiResponse<AuthResponseDto>.Fail("O nome completo é obrigatório."));

        if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@'))
            return BadRequest(ApiResponse<AuthResponseDto>.Fail("O e-mail informado é inválido."));

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            return BadRequest(ApiResponse<AuthResponseDto>.Fail("A senha deve possuir pelo menos 6 caracteres."));

        if (string.IsNullOrWhiteSpace(request.WorkspaceName))
            return BadRequest(ApiResponse<AuthResponseDto>.Fail("O nome do workspace/empresa é obrigatório."));

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        // Verifica se o e-mail já está em uso
        var emailExists = await _context.Users.AnyAsync(u => u.Email == normalizedEmail);
        if (emailExists)
            return BadRequest(ApiResponse<AuthResponseDto>.Fail("Já existe uma conta cadastrada com este e-mail."));

        // Cria o Usuário com hash seguro PBKDF2
        var passwordHash = _passwordHasher.HashPassword(request.Password);
        var user = new User(request.FullName, normalizedEmail, passwordHash);

        // Cria o Workspace padrão
        var workspace = new Workspace(request.WorkspaceName, request.WorkspaceType, request.Document);

        // Associa o usuário como Proprietário (Owner)
        var membership = new Membership(user.Id, workspace.Id, MembershipRole.Owner);

        // Auditoria
        var audit = new AuditLog(workspace.Id, user.Id, "REGISTER", "User", user.Id.ToString(), "Conta e workspace criados.");

        _context.Users.Add(user);
        _context.Workspaces.Add(workspace);
        _context.Memberships.Add(membership);
        _context.AuditLogs.Add(audit);

        await _context.SaveChangesAsync();

        // Gera token JWT com claims contextuais
        var token = _jwtTokenGenerator.GenerateToken(user, workspace, MembershipRole.Owner, out var expiresAt);

        var response = new AuthResponseDto
        {
            Token = token,
            ExpiresAtUtc = expiresAt,
            User = new UserSummaryDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email
            },
            ActiveWorkspace = new WorkspaceSummaryDto
            {
                Id = workspace.Id,
                Name = workspace.Name,
                Type = workspace.Type,
                Document = workspace.Document,
                Role = MembershipRole.Owner
            },
            AvailableWorkspaces = new List<WorkspaceSummaryDto>
            {
                new()
                {
                    Id = workspace.Id,
                    Name = workspace.Name,
                    Type = workspace.Type,
                    Document = workspace.Document,
                    Role = MembershipRole.Owner
                }
            }
        };

        return Ok(ApiResponse<AuthResponseDto>.Ok(response, "Conta e workspace criados com sucesso."));
    }

    /// <summary>
    /// Autentica um usuário existente por e-mail e senha, retornando token JWT e contexto do workspace.
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] LoginRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(ApiResponse<AuthResponseDto>.Fail("E-mail e senha são obrigatórios."));

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await _context.Users
            .Include(u => u.Memberships)
                .ThenInclude(m => m.Workspace)
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail);

        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            return Unauthorized(ApiResponse<AuthResponseDto>.Fail("Credenciais inválidas. Verifique seu e-mail e senha."));
        }

        if (!user.IsActive)
        {
            return Unauthorized(ApiResponse<AuthResponseDto>.Fail("Sua conta está desativada. Entre em contato com o suporte."));
        }

        // Obtém os workspaces aos quais o usuário pertence
        var memberships = user.Memberships.ToList();
        if (!memberships.Any())
        {
            return BadRequest(ApiResponse<AuthResponseDto>.Fail("O usuário não possui nenhum workspace associado."));
        }

        // Workspace ativo (prioriza o primeiro ou Owner)
        var activeMembership = memberships.FirstOrDefault(m => m.Role == MembershipRole.Owner) ?? memberships.First();
        var workspace = activeMembership.Workspace;

        var token = _jwtTokenGenerator.GenerateToken(user, workspace, activeMembership.Role, out var expiresAt);

        var availableWorkspaces = memberships.Select(m => new WorkspaceSummaryDto
        {
            Id = m.Workspace.Id,
            Name = m.Workspace.Name,
            Type = m.Workspace.Type,
            Document = m.Workspace.Document,
            Role = m.Role
        }).ToList();

        var response = new AuthResponseDto
        {
            Token = token,
            ExpiresAtUtc = expiresAt,
            User = new UserSummaryDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email
            },
            ActiveWorkspace = new WorkspaceSummaryDto
            {
                Id = workspace.Id,
                Name = workspace.Name,
                Type = workspace.Type,
                Document = workspace.Document,
                Role = activeMembership.Role
            },
            AvailableWorkspaces = availableWorkspaces
        };

        return Ok(ApiResponse<AuthResponseDto>.Ok(response, "Login realizado com sucesso."));
    }

    /// <summary>
    /// Retorna os dados do usuário autenticado e seus workspaces.
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> GetMe()
    {
        var userId = _currentWorkspaceService.UserId;
        if (!userId.HasValue)
            return Unauthorized(ApiResponse<UserProfileDto>.Fail("Sessão inválida ou não autenticada."));

        var user = await _context.Users
            .Include(u => u.Memberships)
                .ThenInclude(m => m.Workspace)
            .FirstOrDefaultAsync(u => u.Id == userId.Value);

        if (user == null)
            return NotFound(ApiResponse<UserProfileDto>.Fail("Usuário não encontrado."));

        var profile = new UserProfileDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            CreatedAtUtc = user.CreatedAtUtc,
            Workspaces = user.Memberships.Select(m => new WorkspaceSummaryDto
            {
                Id = m.Workspace.Id,
                Name = m.Workspace.Name,
                Type = m.Workspace.Type,
                Document = m.Workspace.Document,
                Role = m.Role
            }).ToList()
        };

        return Ok(ApiResponse<UserProfileDto>.Ok(profile));
    }

    /// <summary>
    /// Permite alternar o workspace ativo, emitindo um novo token com o contexto selecionado.
    /// </summary>
    [Authorize]
    [HttpPost("switch-workspace")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> SwitchWorkspace([FromBody] SwitchWorkspaceRequestDto request)
    {
        var userId = _currentWorkspaceService.UserId;
        if (!userId.HasValue)
            return Unauthorized(ApiResponse<AuthResponseDto>.Fail("Usuário não autenticado."));

        var membership = await _context.Memberships
            .Include(m => m.Workspace)
            .Include(m => m.User)
            .FirstOrDefaultAsync(m => m.UserId == userId.Value && m.WorkspaceId == request.WorkspaceId);

        if (membership == null)
            return BadRequest(ApiResponse<AuthResponseDto>.Fail("Você não possui permissão para acessar este workspace."));

        var user = membership.User;
        var workspace = membership.Workspace;

        var token = _jwtTokenGenerator.GenerateToken(user, workspace, membership.Role, out var expiresAt);

        var allMemberships = await _context.Memberships
            .Include(m => m.Workspace)
            .Where(m => m.UserId == userId.Value)
            .ToListAsync();

        var response = new AuthResponseDto
        {
            Token = token,
            ExpiresAtUtc = expiresAt,
            User = new UserSummaryDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email
            },
            ActiveWorkspace = new WorkspaceSummaryDto
            {
                Id = workspace.Id,
                Name = workspace.Name,
                Type = workspace.Type,
                Document = workspace.Document,
                Role = membership.Role
            },
            AvailableWorkspaces = allMemberships.Select(m => new WorkspaceSummaryDto
            {
                Id = m.Workspace.Id,
                Name = m.Workspace.Name,
                Type = m.Workspace.Type,
                Document = m.Workspace.Document,
                Role = m.Role
            }).ToList()
        };

        return Ok(ApiResponse<AuthResponseDto>.Ok(response, "Workspace alternado com sucesso."));
    }

    /// <summary>
    /// Atualiza os dados de perfil do usuário autenticado.
    /// </summary>
    [Authorize]
    [HttpPut("profile")]
    public async Task<ActionResult<ApiResponse<UserSummaryDto>>> UpdateProfile([FromBody] UpdateProfileDto request)
    {
        var userId = _currentWorkspaceService.UserId;
        if (!userId.HasValue)
            return Unauthorized(ApiResponse<UserSummaryDto>.Fail("Usuário não autenticado."));

        if (string.IsNullOrWhiteSpace(request.FullName))
            return BadRequest(ApiResponse<UserSummaryDto>.Fail("O nome completo não pode ser vazio."));

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
        if (user == null)
            return NotFound(ApiResponse<UserSummaryDto>.Fail("Usuário não encontrado."));

        user.UpdateProfile(request.FullName);
        await _context.SaveChangesAsync();

        var summary = new UserSummaryDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email
        };

        return Ok(ApiResponse<UserSummaryDto>.Ok(summary, "Perfil atualizado com sucesso."));
    }
}
