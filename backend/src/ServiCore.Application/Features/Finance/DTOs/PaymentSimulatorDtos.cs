using System.ComponentModel.DataAnnotations;
using ServiCore.Domain.Enums;

namespace ServiCore.Application.Features.Finance.DTOs;

public record SimulatePaymentRequest(
    [Required(ErrorMessage = "O identificador da conta a receber é obrigatório.")]
    Guid ReceivableId,

    [Range(1, long.MaxValue, ErrorMessage = "O valor deve ser de pelo menos 1 centavo (R$ 0,01).")]
    long AmountCents,

    [Required(ErrorMessage = "O método de pagamento é obrigatório.")]
    PaymentMethod Method,

    [Required(ErrorMessage = "A chave de idempotência é obrigatória para simulações seguras.")]
    [MaxLength(100, ErrorMessage = "A chave de idempotência deve ter no máximo 100 caracteres.")]
    string IdempotencyKey,

    string? CustomerDocument,
    string? CardNumberMock,
    string? CardHolderMock,
    string? Notes
);

public record SimulatePaymentResponse(
    string ReceiptId,
    string IdempotencyKey,
    bool IsIdempotentReplay,
    string Status,
    Guid ReceivableId,
    string ReceivableTitle,
    string CustomerName,
    long AmountPaidCents,
    decimal AmountPaidFormatted,
    long RemainingBalanceCents,
    decimal RemainingBalanceFormatted,
    string ReceivableNewStatus,
    string PaymentMethodName,
    string TransactionAuthorizationCode,
    string? PixQrCodePayload,
    DateTime ProcessedAtUtc,
    string Message
);
