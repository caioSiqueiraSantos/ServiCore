using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ServiCore.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddContractsServicesTasksAndCalendar : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Contracts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CustomerId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    Amount = table.Column<long>(type: "INTEGER", nullable: false),
                    EstimatedHours = table.Column<decimal>(type: "TEXT", precision: 10, scale: 2, nullable: true),
                    StartDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    EndDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Terms = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Contracts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Contracts_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Contracts_Workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "Workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Services",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    DefaultPrice = table.Column<long>(type: "INTEGER", nullable: false),
                    BillingUnit = table.Column<int>(type: "INTEGER", nullable: false),
                    EstimatedHours = table.Column<decimal>(type: "TEXT", precision: 10, scale: 2, nullable: true),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Services", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Services_Workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "Workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ContractAttachments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ContractId = table.Column<Guid>(type: "TEXT", nullable: false),
                    FileName = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    ContentType = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    FileSizeBytes = table.Column<long>(type: "INTEGER", nullable: false),
                    StorageKeyOrUrl = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    UploadedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContractAttachments_Contracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "Contracts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ContractAttachments_Workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "Workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ContractItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ContractId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ServiceItemId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Description = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    Quantity = table.Column<decimal>(type: "TEXT", precision: 10, scale: 2, nullable: false),
                    UnitPrice = table.Column<long>(type: "INTEGER", nullable: false),
                    TotalPrice = table.Column<long>(type: "INTEGER", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContractItems_Contracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "Contracts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ContractItems_Services_ServiceItemId",
                        column: x => x.ServiceItemId,
                        principalTable: "Services",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Tasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    CustomerId = table.Column<Guid>(type: "TEXT", nullable: true),
                    ContractId = table.Column<Guid>(type: "TEXT", nullable: true),
                    ServiceItemId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Priority = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    DueDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    EstimatedMinutes = table.Column<int>(type: "INTEGER", nullable: true),
                    SpentMinutes = table.Column<int>(type: "INTEGER", nullable: true),
                    CompletedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tasks_Contracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "Contracts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Tasks_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Tasks_Services_ServiceItemId",
                        column: x => x.ServiceItemId,
                        principalTable: "Services",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Tasks_Workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "Workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CalendarEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    LocationOrLink = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    StartTimeUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    EndTimeUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    CustomerId = table.Column<Guid>(type: "TEXT", nullable: true),
                    ContractId = table.Column<Guid>(type: "TEXT", nullable: true),
                    TaskItemId = table.Column<Guid>(type: "TEXT", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CalendarEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CalendarEvents_Contracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "Contracts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CalendarEvents_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CalendarEvents_Tasks_TaskItemId",
                        column: x => x.TaskItemId,
                        principalTable: "Tasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CalendarEvents_Workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "Workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_ContractId",
                table: "CalendarEvents",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_CustomerId",
                table: "CalendarEvents",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_TaskItemId",
                table: "CalendarEvents",
                column: "TaskItemId");

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_WorkspaceId",
                table: "CalendarEvents",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_WorkspaceId_EndTimeUtc",
                table: "CalendarEvents",
                columns: new[] { "WorkspaceId", "EndTimeUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_WorkspaceId_StartTimeUtc",
                table: "CalendarEvents",
                columns: new[] { "WorkspaceId", "StartTimeUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_WorkspaceId_Status",
                table: "CalendarEvents",
                columns: new[] { "WorkspaceId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ContractAttachments_ContractId",
                table: "ContractAttachments",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractAttachments_WorkspaceId",
                table: "ContractAttachments",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractItems_ContractId",
                table: "ContractItems",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractItems_ServiceItemId",
                table: "ContractItems",
                column: "ServiceItemId");

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_CustomerId",
                table: "Contracts",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_WorkspaceId",
                table: "Contracts",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_WorkspaceId_CustomerId",
                table: "Contracts",
                columns: new[] { "WorkspaceId", "CustomerId" });

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_WorkspaceId_StartDate",
                table: "Contracts",
                columns: new[] { "WorkspaceId", "StartDate" });

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_WorkspaceId_Status",
                table: "Contracts",
                columns: new[] { "WorkspaceId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Services_WorkspaceId",
                table: "Services",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_Services_WorkspaceId_Name",
                table: "Services",
                columns: new[] { "WorkspaceId", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_Services_WorkspaceId_Status",
                table: "Services",
                columns: new[] { "WorkspaceId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_ContractId",
                table: "Tasks",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_CustomerId",
                table: "Tasks",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_ServiceItemId",
                table: "Tasks",
                column: "ServiceItemId");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_WorkspaceId",
                table: "Tasks",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_WorkspaceId_ContractId",
                table: "Tasks",
                columns: new[] { "WorkspaceId", "ContractId" });

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_WorkspaceId_CustomerId",
                table: "Tasks",
                columns: new[] { "WorkspaceId", "CustomerId" });

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_WorkspaceId_DueDate",
                table: "Tasks",
                columns: new[] { "WorkspaceId", "DueDate" });

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_WorkspaceId_Status",
                table: "Tasks",
                columns: new[] { "WorkspaceId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CalendarEvents");

            migrationBuilder.DropTable(
                name: "ContractAttachments");

            migrationBuilder.DropTable(
                name: "ContractItems");

            migrationBuilder.DropTable(
                name: "Tasks");

            migrationBuilder.DropTable(
                name: "Contracts");

            migrationBuilder.DropTable(
                name: "Services");
        }
    }
}
