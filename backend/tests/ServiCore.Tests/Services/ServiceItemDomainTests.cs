using ServiCore.Domain.Common;
using ServiCore.Domain.Entities;
using ServiCore.Domain.Enums;
using Xunit;

namespace ServiCore.Tests.Services;

public class ServiceItemDomainTests
{
    [Fact]
    public void CreateServiceItem_ShouldInitializeWithActiveStatus()
    {
        var workspaceId = Guid.NewGuid();
        var service = new ServiceItem(
            workspaceId,
            "Consultoria em Arquitetura de Software",
            Money.FromCents(30000), // R$ 300,00
            ServiceBillingUnit.Hour,
            "Análise e estruturação de arquitetura limpa",
            estimatedHours: 10m
        );

        Assert.Equal(workspaceId, service.WorkspaceId);
        Assert.Equal("Consultoria em Arquitetura de Software", service.Name);
        Assert.Equal(30000, service.DefaultPrice.Cents);
        Assert.Equal(ServiceBillingUnit.Hour, service.BillingUnit);
        Assert.Equal(ServiceStatus.Active, service.Status);
        Assert.Equal(10m, service.EstimatedHours);
    }

    [Fact]
    public void DeactivateAndActivate_ShouldToggleStatus()
    {
        var service = new ServiceItem(
            Guid.NewGuid(),
            "Design de Interfaces",
            Money.FromCents(250000),
            ServiceBillingUnit.Project
        );

        Assert.Equal(ServiceStatus.Active, service.Status);

        service.Deactivate();
        Assert.Equal(ServiceStatus.Inactive, service.Status);

        service.Activate();
        Assert.Equal(ServiceStatus.Active, service.Status);
    }
}
