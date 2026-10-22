namespace ServiCore.Application.Common.Models;

public class SystemStatusDto
{
    public string AppName { get; set; } = "ServiCore API";
    public string Version { get; set; } = "1.0.0-foundation";
    public string Environment { get; set; } = "Development";
    public string DatabaseProvider { get; set; } = "SQLite";
    public bool DatabaseCanConnect { get; set; }
    public DateTime ServerTimeUtc { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Healthy";
}
