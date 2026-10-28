using System.ComponentModel.DataAnnotations;
using ServiCore.Domain.Enums;

namespace ServiCore.Application.Features.Finance.DTOs;

public record ExpenseDto(
    Guid Id,
    string Description,
    ExpenseCategory Category,
    string CategoryName,
    long AmountCents,
    decimal AmountFormatted,
    DateTime DueDate,
    DateTime? PaymentDate,
    ExpenseStatus Status,
    string StatusName,
    PaymentMethod? PaymentMethod,
    string? PaymentMethodName,
    string? Supplier,
    string? Notes,
    DateTime CreatedAtUtc
);

public record CreateExpenseRequest(
    [Required(ErrorMessage = "A descrição da despesa é obrigatória.")]
    [MaxLength(200, ErrorMessage = "A descrição deve ter no máximo 200 caracteres.")]
    string Description,

    ExpenseCategory Category,

    [Range(1, long.MaxValue, ErrorMessage = "O valor deve ser de pelo menos 1 centavo (R$ 0,01).")]
    long AmountCents,

    [Required(ErrorMessage = "A data de vencimento é obrigatória.")]
    DateTime DueDate,

    string? Supplier,
    string? Notes,
    bool IsAlreadyPaid,
    DateTime? PaymentDate,
    PaymentMethod? PaymentMethod
);

public record UpdateExpenseRequest(
    [Required(ErrorMessage = "A descrição da despesa é obrigatória.")]
    [MaxLength(200, ErrorMessage = "A descrição deve ter no máximo 200 caracteres.")]
    string Description,

    ExpenseCategory Category,

    [Range(1, long.MaxValue, ErrorMessage = "O valor deve ser de pelo menos 1 centavo (R$ 0,01).")]
    long AmountCents,

    [Required(ErrorMessage = "A data de vencimento é obrigatória.")]
    DateTime DueDate,

    string? Supplier,
    string? Notes
);

public record PayExpenseRequest(
    DateTime? PaymentDate,

    [Required(ErrorMessage = "O método de pagamento é obrigatório.")]
    PaymentMethod Method,

    string? Notes
);
