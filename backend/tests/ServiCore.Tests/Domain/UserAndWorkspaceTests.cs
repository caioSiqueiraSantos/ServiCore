using ServiCore.Domain.Entities;
using ServiCore.Domain.Enums;
using Xunit;

namespace ServiCore.Tests.Domain;

public class UserAndWorkspaceTests
{
    [Fact]
    public void CreateUser_WithValidData_ShouldNormalizeEmailAndSetDefaults()
    {
        // Act
        var user = new User("  Carlos Silva  ", " Carlos@EMPRESA.com ", "hashed_pwd_123");

        // Assert
        Assert.Equal("Carlos Silva", user.FullName);
        Assert.Equal("carlos@empresa.com", user.Email);
        Assert.True(user.IsActive);
        Assert.NotEqual(Guid.Empty, user.Id);
    }

    [Theory]
    [InlineData("", "test@test.com", "hash")]
    [InlineData("Name", "", "hash")]
    [InlineData("Name", "test@test.com", "")]
    public void CreateUser_WithInvalidData_ShouldThrowArgumentException(string name, string email, string hash)
    {
        Assert.Throws<ArgumentException>(() => new User(name, email, hash));
    }

    [Fact]
    public void CreateWorkspace_ShouldCleanDocumentDigits()
    {
        // Act
        var ws = new Workspace("Tech Solutions", WorkspaceType.Enterprise, "12.345.678/0001-90");

        // Assert
        Assert.Equal("12345678000190", ws.Document);
        Assert.Equal(WorkspaceType.Enterprise, ws.Type);
    }
}
