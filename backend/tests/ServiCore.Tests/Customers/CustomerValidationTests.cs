using ServiCore.Domain.Entities;
using ServiCore.Domain.Enums;
using Xunit;

namespace ServiCore.Tests.Customers;

public class CustomerValidationTests
{
    [Fact]
    public void CreateCustomer_WithValidData_ShouldNormalizeDocumentAndEmail()
    {
        var wsId = Guid.NewGuid();
        var customer = new Customer(
            wsId,
            "  Empresa Modelo Ltda  ",
            CustomerType.Company,
            " 12.345.678/0001-90 ",
            " CONTATO@MODELO.COM ",
            " (11) 98765-4321 ",
            " Observações gerais "
        );

        Assert.Equal("Empresa Modelo Ltda", customer.Name);
        Assert.Equal("12345678000190", customer.Document);
        Assert.Equal("contato@modelo.com", customer.Email);
        Assert.Equal("(11) 98765-4321", customer.Phone);
        Assert.Equal(CustomerType.Company, customer.Type);
        Assert.Equal(CustomerStatus.Active, customer.Status);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void CreateCustomer_WithEmptyName_ShouldThrowArgumentException(string invalidName)
    {
        Assert.Throws<ArgumentException>(() => new Customer(Guid.NewGuid(), invalidName, CustomerType.Individual));
    }

    [Fact]
    public void DeactivateAndActivate_ShouldChangeStatusProperly()
    {
        var customer = new Customer(Guid.NewGuid(), "João Silva", CustomerType.Individual);
        Assert.Equal(CustomerStatus.Active, customer.Status);

        customer.Deactivate();
        Assert.Equal(CustomerStatus.Inactive, customer.Status);

        customer.Activate();
        Assert.Equal(CustomerStatus.Active, customer.Status);
    }
}
