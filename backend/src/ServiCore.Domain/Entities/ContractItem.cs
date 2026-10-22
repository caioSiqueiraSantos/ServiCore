using ServiCore.Domain.Common;

namespace ServiCore.Domain.Entities;

public class ContractItem : BaseEntity
{
    public Guid ContractId { get; private set; }
    public Contract Contract { get; private set; } = null!;

    public Guid? ServiceItemId { get; private set; }
    public ServiceItem? ServiceItem { get; private set; }

    public string Description { get; private set; } = string.Empty;
    public decimal Quantity { get; private set; } = 1m;
    public Money UnitPrice { get; private set; } = Money.Zero;
    public Money TotalPrice { get; private set; } = Money.Zero;

    protected ContractItem() { }

    public ContractItem(
        Guid contractId,
        string description,
        decimal quantity,
        Money unitPrice,
        Guid? serviceItemId = null)
    {
        if (contractId == Guid.Empty)
            throw new ArgumentException("O ContractId é obrigatório.", nameof(contractId));

        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("A descrição do item é obrigatória.", nameof(description));

        if (quantity <= 0)
            throw new ArgumentException("A quantidade deve ser maior que zero.", nameof(quantity));

        ContractId = contractId;
        Description = description.Trim();
        Quantity = quantity;
        UnitPrice = unitPrice;
        TotalPrice = unitPrice * quantity;
        ServiceItemId = serviceItemId;
    }

    public void Update(string description, decimal quantity, Money unitPrice, Guid? serviceItemId = null)
    {
        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("A descrição do item é obrigatória.", nameof(description));

        if (quantity <= 0)
            throw new ArgumentException("A quantidade deve ser maior que zero.", nameof(quantity));

        Description = description.Trim();
        Quantity = quantity;
        UnitPrice = unitPrice;
        TotalPrice = unitPrice * quantity;
        ServiceItemId = serviceItemId;
        MarkAsUpdated();
    }
}
