namespace ServiCore.Domain.Common;

/// <summary>
/// Value Object para tratamento consistente de valores monetários representados em centavos (long).
/// Evita erros de arredondamento inerentes a ponto flutuante em operações financeiras e no SQLite.
/// </summary>
public readonly struct Money : IEquatable<Money>, IComparable<Money>
{
    public long Cents { get; }

    public Money(long cents)
    {
        Cents = cents;
    }

    public static Money Zero => new(0);

    public static Money FromCents(long cents) => new(cents);

    public static Money FromDecimal(decimal amount)
    {
        return new Money((long)Math.Round(amount * 100m, MidpointRounding.AwayFromZero));
    }

    public decimal ToDecimal() => Cents / 100m;

    public static Money operator +(Money a, Money b) => new(a.Cents + b.Cents);
    public static Money operator -(Money a, Money b) => new(a.Cents - b.Cents);
    public static Money operator *(Money a, int multiplier) => new(a.Cents * multiplier);
    public static Money operator *(Money a, decimal multiplier)
    {
        return new Money((long)Math.Round(a.Cents * multiplier, MidpointRounding.AwayFromZero));
    }

    public static bool operator ==(Money a, Money b) => a.Cents == b.Cents;
    public static bool operator !=(Money a, Money b) => a.Cents != b.Cents;
    public static bool operator <(Money a, Money b) => a.Cents < b.Cents;
    public static bool operator <=(Money a, Money b) => a.Cents <= b.Cents;
    public static bool operator >(Money a, Money b) => a.Cents > b.Cents;
    public static bool operator >=(Money a, Money b) => a.Cents >= b.Cents;

    public bool Equals(Money other) => Cents == other.Cents;
    public override bool Equals(object? obj) => obj is Money other && Equals(other);
    public override int GetHashCode() => Cents.GetHashCode();
    public int CompareTo(Money other) => Cents.CompareTo(other.Cents);

    public override string ToString()
    {
        return ToDecimal().ToString("C2", System.Globalization.CultureInfo.GetCultureInfo("pt-BR"));
    }
}
