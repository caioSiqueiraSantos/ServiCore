using ServiCore.Domain.Entities;
using ServiCore.Domain.Enums;
using Xunit;

namespace ServiCore.Tests.Tasks;

public class TaskItemDomainTests
{
    [Fact]
    public void CreateTask_ShouldInitializeWithPendingStatus()
    {
        var workspaceId = Guid.NewGuid();
        var task = new TaskItem(
            workspaceId,
            "Elaborar Relatório de Sprint",
            TaskPriority.High,
            "Relatório consolidado para o cliente",
            dueDate: DateTime.UtcNow.AddDays(2),
            estimatedMinutes: 90
        );

        Assert.Equal(workspaceId, task.WorkspaceId);
        Assert.Equal("Elaborar Relatório de Sprint", task.Title);
        Assert.Equal(TaskPriority.High, task.Priority);
        Assert.Equal(TaskItemStatus.Pending, task.Status);
        Assert.Null(task.CompletedAtUtc);
        Assert.Equal(0, task.SpentMinutes);
    }

    [Fact]
    public void ChangeStatus_ToCompleted_ShouldSetCompletedAtUtc()
    {
        var task = new TaskItem(Guid.NewGuid(), "Desenvolver Endpoint");

        task.ChangeStatus(TaskItemStatus.InProgress);
        Assert.Equal(TaskItemStatus.InProgress, task.Status);
        Assert.Null(task.CompletedAtUtc);

        task.ChangeStatus(TaskItemStatus.Completed);
        Assert.Equal(TaskItemStatus.Completed, task.Status);
        Assert.NotNull(task.CompletedAtUtc);

        task.ChangeStatus(TaskItemStatus.Pending);
        Assert.Equal(TaskItemStatus.Pending, task.Status);
        Assert.Null(task.CompletedAtUtc);
    }

    [Fact]
    public void AddSpentMinutes_ShouldAccumulate()
    {
        var task = new TaskItem(Guid.NewGuid(), "Reunião e Ajustes");

        task.AddSpentMinutes(30);
        task.AddSpentMinutes(45);

        Assert.Equal(75, task.SpentMinutes);
    }
}
