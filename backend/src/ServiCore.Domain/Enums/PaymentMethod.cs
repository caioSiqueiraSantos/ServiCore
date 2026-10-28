namespace ServiCore.Domain.Enums;

public enum PaymentMethod
{
    Pix = 1,
    CreditCard = 2,
    DebitCard = 3,
    BankSlip = 4,      // Boleto Bancário
    BankTransfer = 5,  // TED / DOC / Transferência
    Cash = 6,          // Dinheiro
    Other = 7
}
