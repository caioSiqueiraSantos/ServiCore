namespace ServiCore.Domain.Enums;

public enum ReceivableStatus
{
    Pending = 0,
    PartiallyPaid = 1,
    Paid = 2,
    Overdue = 3,
    Cancelled = 4
}
