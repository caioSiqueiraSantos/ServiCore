using ServiCore.Domain.Common;
using Xunit;

namespace ServiCore.Tests.Domain;

public class MoneyTests
{
    [Fact]
    public void FromDecimal_ShouldConvertToCentsAccurately()
    {
        // Arrange
        decimal amount = 1540.75m;

        // Act
        var money = Money.FromDecimal(amount);

        // Assert
        Assert.Equal(154075L, money.Cents);
        Assert.Equal(1540.75m, money.ToDecimal());
    }

    [Fact]
    public void Arithmetic_AdditionAndSubtraction_ShouldBeExact()
    {
        // Arrange
        var val1 = Money.FromDecimal(100.25m);
        var val2 = Money.FromDecimal(49.75m);

        // Act
        var sum = val1 + val2;
        var diff = val1 - val2;

        // Assert
        Assert.Equal(15000L, sum.Cents);
        Assert.Equal(150.00m, sum.ToDecimal());
        Assert.Equal(5050L, diff.Cents);
        Assert.Equal(50.50m, diff.ToDecimal());
    }

    [Fact]
    public void Comparisons_ShouldWorkExpectedly()
    {
        var small = Money.FromCents(1000);
        var big = Money.FromCents(2000);

        Assert.True(small < big);
        Assert.True(big > small);
        Assert.Equal(small, Money.FromCents(1000));
    }
}
