using System.ComponentModel.DataAnnotations;
using ServiCore.Domain.Enums;

namespace ServiCore.Application.Features.Finance.DTOs;

public record PaymentDto(
    Guid Id,
    Guid ReceivableId,
    long AmountCents,
    decimal AmountFormatted,
    DateTime PaymentDate,
    PaymentMethod Method,
    string MethodName,
    string? TransactionReference,
    string? Notes,
    string? IdempotencyKey,
    DateTime CreatedAtUtc
);

public record ReceivableDto(
    Guid Id,
    Guid CustomerId,
    string CustomerName,
    string? CustomerDocument,
    Guid? ContractId,
    string? ContractTitle,
    string Title,
    string? Description,
    ReceivableCategory Category,
    string CategoryName,
    long AmountCents,
    decimal AmountFormatted,
    long PaidAmountCents,
    decimal PaidAmountFormatted,
    long RemainingAmountCents,
    decimal RemainingAmountFormatted,
    DateTime DueDate,
    DateTime IssueDate,
    ReceivableStatus Status,
    string StatusName,
    int? InstallmentNumber,
    int? TotalInstallments,
    string? Notes,
    DateTime CreatedAtUtc,
    List<PaymentDto> Payments
);

public record CreateReceivableRequest(
    [Required(ErrorMessage = "O cliente é obrigatório.")]
    Guid CustomerId,

    Guid? ContractId,

    [Required(ErrorMessage = "O título é obrigatório.")]
    [MaxLength(200, ErrorMessage = "O título deve ter no máximo 200 caracteres.")]
    string Title,

    string? Description,

    ReceivableCategory Category,

    [Range(1, long.MaxValue, ErrorMessage = "O valor deve ser de pelo menos 1 centavo (R$ 0,01).")]
    long AmountCents,

    [Required(ErrorMessage = "A data de vencimento é obrigatória.")]
    DateTime DueDate,

    DateTime? IssueDate,

    [Range(1, 120, ErrorMessage = "O número total de parcelas deve ser entre 1 e 120.")]
    int? TotalInstallments,

    string? Notes
);

public record UpdateReceivableRequest(
    [Required(ErrorMessage = "O cliente é obrigatório.")]
    Guid CustomerId,

    Guid? ContractId,

    [Required(ErrorMessage = "O título é obrigatório.")]
    [MaxLength(200, ErrorMessage = "O título deve ter no máximo 200 caracteres.")]
    string Title,

    string? Description,

    ReceivableCategory Category,

    [Range(1, long.MaxValue, ErrorMessage = "O valor deve ser de pelo menos 1 centavo (R$ 0,01).")]
    long AmountCents,

    [Required(ErrorMessage = "A data de vencimento é obrigatória.")]
    DateTime DueDate,

    DateTime? IssueDate,

    int? InstallmentNumber,

    int? TotalInstallments,

    string? Notes
);

public record RegisterPaymentRequest(
    [Range(1, long.MaxValue, ErrorMessage = "O valor do pagamento deve ser de pelo menos 1 centavo (R$ 0,01).")]
    long AmountCents,

    DateTime? PaymentDate,

    [Required(ErrorMessage = "O método de pagamento é obrigatório.")]
    PaymentMethod Method,

    string? Notes,

    string? TransactionReference,

    string? IdempotencyKey
);
