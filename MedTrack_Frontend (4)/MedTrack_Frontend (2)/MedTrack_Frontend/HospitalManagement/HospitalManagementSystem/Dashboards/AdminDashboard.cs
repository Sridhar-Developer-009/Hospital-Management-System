using System.Text.RegularExpressions;
using HospitalManagementSystem.Database.Connection;
using HospitalManagementSystem.DoctorManagement.Menus;
using HospitalManagementSystem.NotificationManagement.Repositories;
using HospitalManagementSystem.PatientManagement.Menus;
using HospitalManagementSystem.PatientManagement.Repositories;
using HospitalManagementSystem.PatientManagement.Services;
using HospitalManagementSystem.ReportManagement.Menus;
using HospitalManagementSystem.Shared.Exceptions;
using HospitalManagementSystem.Shared.Utilities;
using HospitalManagementSystem.UserManagement.DTOs;
using Spectre.Console;
using Spectre.Console.Rendering;

namespace HospitalManagementSystem.Dashboards;

public class AdminDashboard
{
    private readonly DbConnectionFactory _factory;
    private readonly LoginResponse _user;
    private readonly DashboardService _dashboardService;

    public AdminDashboard(DbConnectionFactory factory, LoginResponse user)
    {
        _factory = factory;
        _user = user;
        _dashboardService = new DashboardService(factory);
    }

    public async Task ShowAsync()
    {
        while (true)
        {
            try
            {
                ConsoleManager.Clear();
                var m = await _dashboardService.GetAdminMetricsAsync();
                ConsoleManager.Header("HMS Admin Dashboard", $"Signed in as {_user.DisplayName} ({_user.RoleName})");
                Console.WriteLine($"  System Date : {DateTime.Now:dd-MMM-yyyy hh:mm tt}");
                ConsoleManager.Line();

                ConsoleManager.PrintMetricCards(
                    ("Active Departments", m.ActiveDepartments.ToString("N0")),
                    ("Total Active Doctors", m.TotalActiveDoctors.ToString("N0")),
                    ("Registered Patients", m.RegisteredPatients.ToString("N0")),
                    ("Booked Appointments", m.Scheduled.ToString("N0")),
                    ("Completed Appointments", m.Completed.ToString("N0")),
                    ("Cancelled Appointments", m.Cancelled.ToString("N0")),
                    ("No-Show Appointments", m.NoShows.ToString("N0")));

                ConsoleManager.Line();
                var choice = InputHelper.SelectFromMenu("Admin Menu:", false,
                    "Doctor Management",
                    "Patient Management",
                    "Appointment Management",
                    "Notification Management",
                    "Operational Reports",
                    "Logout");
                if (choice == "Logout" && Logout()) return;
                if (choice == "Doctor Management") await ConsoleManager.RunActionAsync(() => new DoctorMenu(_factory).ShowAdminDoctorManagementAsync());
                if (choice == "Patient Management") await ConsoleManager.RunActionAsync(() => new PatientMenu(_factory).ShowAdminPatientMonitoringAsync());
                if (choice == "Appointment Management") await ConsoleManager.RunActionAsync(() => new AppointmentManagement.Menus.AppointmentMenu(_factory).ShowAdminAppointmentManagementAsync(_user.UserId));
                if (choice == "Notification Management") await ConsoleManager.RunActionAsync(ShowNotificationMenuAsync);
                if (choice == "Operational Reports") await ConsoleManager.RunActionAsync(() => new ReportMenu(_factory).ShowAsync());
            }
            catch (MainMenuException)
            {
                // # Home - return to Admin Dashboard
            }
        }
    }

    private async Task ShowNotificationMenuAsync()
    {
        while (true)
        {
            ConsoleManager.Clear();
            ConsoleManager.Header("Notification Management", "Dashboard > Notifications");
            Console.WriteLine();
            var notifChoice = InputHelper.SelectFromMenu("Notification Management:",
                "View Recent Notifications",
                "Create Sample Notification",
                "Send Notification to Patient",
                "Back");
            if (notifChoice == "Back") return;
            if (notifChoice == "View Recent Notifications") await ConsoleManager.RunActionAsync(ShowNotificationsAsync);
            if (notifChoice == "Create Sample Notification") await ConsoleManager.RunActionAsync(SendTestNotificationAsync);
            if (notifChoice == "Send Notification to Patient") await ConsoleManager.RunActionAsync(SendNotificationToPatientAsync);
        }
    }

    private async Task ShowNotificationsAsync()
    {
        ConsoleManager.Clear();
        ConsoleManager.Header("Notification History", "Dashboard > Notifications > History");
        ConsoleManager.RenderNavBar();
        ConsoleManager.Line();

        var repo = new NotificationRepository(_factory);
        var logs = await repo.GetRecentAsync(50);

        if (!logs.Any())
        {
            ConsoleManager.Info("No notifications have been sent yet.");
            ConsoleManager.Pause();
            return;
        }

        int page = 0, pageSize = 9;
        int totalPages = (int)Math.Ceiling(logs.Count / (double)pageSize);
        int width = ConsoleManager.PageWidth;

        while (true)
        {
            AnsiConsole.Clear();
            ConsoleManager.Header("Notification History", "Dashboard > Notifications > History");
            ConsoleManager.RenderNavBar();

            var pageLogs = logs.Skip(page * pageSize).Take(pageSize).ToList();

            var table = new Table()
                .Border(TableBorder.Square)
                .BorderColor(Color.Grey50)
                .Width(width);

            table.AddColumn(new TableColumn($"[bold {ConsoleManager.Accent}]S.No[/]").Width(5).Centered());
            table.AddColumn(new TableColumn($"[bold {ConsoleManager.Accent}]Notif ID[/]").Width(9));
            table.AddColumn(new TableColumn($"[bold {ConsoleManager.Accent}]Date/Time[/]").Width(22));
            table.AddColumn(new TableColumn($"[bold {ConsoleManager.Accent}]Source[/]").Width(10));
            table.AddColumn(new TableColumn($"[bold {ConsoleManager.Accent}]Category[/]").Width(24));
            table.AddColumn(new TableColumn($"[bold {ConsoleManager.Accent}]Recipient[/]"));

            foreach (var n in pageLogs)
            {
                int idx = logs.IndexOf(n);
                var style = idx % 2 == 0 ? "white" : "grey85";

                var dt = n.SentDate?.ToString("dd-MMM-yyyy hh:mm tt") ?? "-";

                table.AddRow(
                    new Markup($"[{style}]{idx + 1}[/]"),
                    new Markup($"[{style}]{n.NotificationId}[/]"),
                    new Markup($"[{style}]{Markup.Escape(dt)}[/]"),
                    new Markup($"[{style}]{Markup.Escape(n.NotificationType)}[/]"),
                    new Markup($"[{style}]{Markup.Escape(n.Status)}[/]"),
                    new Markup($"[{style}]{Markup.Escape(n.Recipient ?? string.Empty)}[/]")
                );
            }

            AnsiConsole.Write(table);
            AnsiConsole.WriteLine();

            if (totalPages <= 1)
            {
                AnsiConsole.MarkupLine($"  [{ConsoleManager.Muted}]Showing {logs.Count} notification(s)[/]");
            }
            else
            {
                var footer = new Panel(
                    Align.Center(new Markup(
                        $"[{ConsoleManager.Muted}]Page[/] [bold white]{page + 1}[/][{ConsoleManager.Muted}] of [/][bold white]{totalPages}[/]   [{ConsoleManager.Muted}]|   Showing [/][bold white]{page * pageSize + 1}-{page * pageSize + pageLogs.Count}[/][{ConsoleManager.Muted}] of [/][bold white]{logs.Count}[/]")))
                    .Border(BoxBorder.Rounded)
                    .BorderColor(Color.Grey50)
                    .Padding(1, 0);
                footer.Width = width;
                AnsiConsole.Write(footer);
                AnsiConsole.WriteLine();

                var navParts = new List<string>();
                if (page < totalPages - 1) navParts.Add("N next");
                if (page > 0) navParts.Add("P previous");
                var nav = navParts.Count > 0 ? string.Join(" | ", navParts) : "";
                AnsiConsole.MarkupLine($"  [black on {ConsoleManager.Accent} bold] PAGE [/]  [{ConsoleManager.Muted}]{nav}[/]");
            }

            AnsiConsole.MarkupLine($"  [black on {ConsoleManager.Accent} bold] VIEW [/]  [{ConsoleManager.Muted}]Enter notification ID for details |[/] [bold white]0[/] [{ConsoleManager.Muted}]Back[/]");

            var input = Console.ReadLine()?.Trim().ToUpperInvariant();

            if (string.IsNullOrWhiteSpace(input))
            {
                ConsoleManager.Warning("Input cannot be blank. Please enter a valid option.");
                ConsoleManager.Pause();
                continue;
            }

            if (input == "0") return;
            if (input == "#") throw new MainMenuException();

            if (input == "N")
            {
                if (page < totalPages - 1) { page++; continue; }
                ConsoleManager.Warning("Already on the last page.");
                ConsoleManager.Pause();
                continue;
            }

            if (input == "P")
            {
                if (page > 0) { page--; continue; }
                ConsoleManager.Warning("Already on the first page.");
                ConsoleManager.Pause();
                continue;
            }

            if (int.TryParse(input, out int id))
            {
                var match = logs.FirstOrDefault(n => n.NotificationId == id);
                if (match != null)
                {
                    AnsiConsole.Clear();
                    ConsoleManager.Header("Notification Details", "Dashboard > Notifications > History > Details");
                    AnsiConsole.WriteLine();

                    var details = new Panel(new Rows(
                            new Markup($"[bold]Notification ID[/]  [{ConsoleManager.Muted}]{match.NotificationId}[/]"),
                            new Text(""),
                            new Markup($"[bold]Date/Time[/]        [{ConsoleManager.Muted}]{match.SentDate?.ToString("dd-MMM-yyyy hh:mm tt") ?? "-"}[/]"),
                            new Markup($"[bold]Source[/]           [{ConsoleManager.Muted}]{Markup.Escape(match.NotificationType)}[/]"),
                            new Markup($"[bold]Category[/]         [{ConsoleManager.Muted}]{Markup.Escape(match.Status)}[/]"),
                            new Markup($"[bold]Recipient[/]        [{ConsoleManager.Muted}]{Markup.Escape(match.Recipient)}[/]"),
                            new Text(""),
                            new Markup($"[bold underline]Full Message[/]"),
                            new Markup($"[white]{Markup.Escape(match.Message)}[/]")))
                        .Border(BoxBorder.Rounded)
                        .BorderColor(Color.DeepSkyBlue1)
                        .Padding(1, 1);
                    details.Width = width;
                    AnsiConsole.Write(details);
                    ConsoleManager.Pause();
                    continue;
                }

                ConsoleManager.Warning($"Notification {id} was not found in this list.");
                ConsoleManager.Pause();
                continue;
            }

            ConsoleManager.Warning("Please choose N, P, a notification number, or 0.");
            ConsoleManager.Pause();
        }
    }

    private async Task SendTestNotificationAsync()
    {
        ConsoleManager.Clear();
        ConsoleManager.Header("Create Sample Notification", "Dashboard > Notifications > Sample");
        ConsoleManager.RenderNavBar();
        Console.WriteLine("  This creates a sample notification for review.");
        ConsoleManager.Line();

        var repo = new NotificationRepository(_factory);

        string recipient = string.Empty;
        while (true)
        {
            ConsoleManager.InputGuide("Email or 10-digit phone | Required");
            ConsoleManager.Prompt("Recipient email or phone: ");
            var raw = Console.ReadLine()?.Trim();

            if (string.IsNullOrWhiteSpace(raw))
            {
                ConsoleManager.Warning("Input cannot be blank. Please enter a valid option.");
                continue;
            }

            if (raw == "0") { return; }
            if (raw == "#") { throw new MainMenuException(); }

            if (Regex.IsMatch(raw, @"^[^@\s]+@[^@\s]+\.[^@\s]+$") ||
                Regex.IsMatch(raw, @"^[6-9]\d{9}$"))
            {
                var lookup = await repo.LookupRecipientAsync(raw);
                if (lookup.Exists)
                {
                    recipient = raw;
                    ConsoleManager.Success("Recipient found.");
                    ConsoleManager.Line();
                    break;
                }

                ConsoleManager.Warning("No registered patient or doctor found with this email or phone.");
                continue;
            }

            ConsoleManager.Warning("Invalid format. Enter a valid email or a 10-digit phone starting with 6-9.");
        }

        var message = InputHelper.ReadRequiredWithFormat("Test message: ", ValidationRules.ForMaxChars(500));
        if (!InputHelper.ConfirmSelection("Save this sample notification? (Y/N): ")) return;

        var ok = await repo.AddTestAsync(recipient, message);
        if (ok)
        {
            ConsoleManager.Success("Sample notification saved.");
        }
        else
        {
            ConsoleManager.Warning("Create a booking first, then try again.");
        }
        ConsoleManager.Pause();
    }

    private async Task SendNotificationToPatientAsync()
    {
        ConsoleManager.Clear();
        ConsoleManager.Header("Send Notification to Patient", "Dashboard > Notifications > Send to Patient");
        ConsoleManager.RenderNavBar();
        var uhid = InputHelper.ReadRequired("Enter Patient UHID: ");
        var patientService = new PatientService(new PatientRepository(_factory));
        var patient = await patientService.GetByUhidAsync(uhid);
        if (patient == null)
        {
            ConsoleManager.Error("We couldn't find a patient with that UHID.");
            ConsoleManager.Pause();
            return;
        }
        ConsoleManager.Line();
        Console.WriteLine($"  Patient : {patient.PatientName} ({patient.UHID})");
        Console.WriteLine($"  Contact : {patient.Phone}  |  {patient.Email}");
        ConsoleManager.Line();
        var message = InputHelper.ReadRequired("Notification message: ");
        if (!InputHelper.ConfirmSelection("Send this notification to the patient? (Y/N): ")) return;

        var repo = new NotificationRepository(_factory);
        var ok = await repo.SendToPatientAsync(patient.PatientId, patient.Email, message);
        if (ok)
        {
            ConsoleManager.Success("Notification sent to patient.");
        }
        else
        {
            ConsoleManager.Warning("No appointments found for this patient. A booking must exist before sending notifications.");
        }
        ConsoleManager.Pause();
    }

    private bool Logout()
    {
        if (!InputHelper.ConfirmSelection(" Are you sure you want to logout?"))
        {
            ConsoleManager.Info("Logout cancelled.");
            ConsoleManager.Pause();
            return false;
        }

        ConsoleManager.Clear();
        ConsoleManager.Header("Logging Out", "Dashboard > Logout");
        ConsoleManager.Info("You have been signed out. Returning to the main menu.");
        ConsoleManager.Pause();
        return true;
    }
}
