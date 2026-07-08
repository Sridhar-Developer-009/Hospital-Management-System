using HospitalManagementSystem.AppointmentManagement.Menus;
using HospitalManagementSystem.Database.Connection;
using HospitalManagementSystem.PatientManagement.Menus;
using HospitalManagementSystem.Shared.Exceptions;
using HospitalManagementSystem.Shared.Utilities;
using HospitalManagementSystem.UserManagement.DTOs;

namespace HospitalManagementSystem.Dashboards;

public class PatientDashboard
{
    private readonly DbConnectionFactory _factory;
    private readonly LoginResponse _user;
    private readonly DashboardService _dashboardService;

    public PatientDashboard(DbConnectionFactory factory, LoginResponse user)
    {
        _factory = factory;
        _user = user;
        _dashboardService = new DashboardService(factory);
    }

    public async Task ShowAsync()
    {
        if (_user.PatientId == null)
        {
            ConsoleManager.Error("We couldn't find your patient profile. Please contact the hospital team.");
            ConsoleManager.Pause();
            return;
        }

        while (true)
        {
            try
            {
                var m = await ConsoleManager.WithStatusAsync("Getting everything ready...", () => _dashboardService.GetPatientMetricsAsync(_user.PatientId.Value));
                ConsoleManager.Clear();
                ConsoleManager.Header("Patient Account Dashboard", $"{_user.DisplayName} > UHID {_user.CodeOrUhid}");
                Console.WriteLine($"  System Date : {DateTime.Now:dd-MMM-yyyy hh:mm tt}");
                ConsoleManager.Line();
                ConsoleManager.PrintMetricCards(
                    ("UHID", _user.CodeOrUhid),
                    ("Patient Name", _user.DisplayName),
                    ("Upcoming Bookings", m.ScheduledUpcomingBookings.ToString("N0")),
                    ("Past Completed Visits", m.PastCompletedVisits.ToString("N0")),
                    ("Account Status", m.AccountStatus),
                    ("Emergency Line", "102"));
                ConsoleManager.Line();
                var choice = InputHelper.SelectFromMenu("Patient Menu:", false,
                    "Book an Appointment",
                    "Manage My Scheduled Appointments",
                    "View Medical History",
                    "View My Notifications",
                    "View My Patient Profile",
                    "Logout");
                if (choice == "Logout" && Logout()) return;
                var menu = new AppointmentMenu(_factory);
                if (choice == "Book an Appointment") await ConsoleManager.RunActionAsync(() => menu.BookAppointmentAsync(_user.PatientId.Value, _user.DisplayName, _user.CodeOrUhid));
                if (choice == "Manage My Scheduled Appointments") await ConsoleManager.RunActionAsync(() => menu.ManagePatientBookingsAsync(_user.PatientId.Value));
                if (choice == "View Medical History") await ConsoleManager.RunActionAsync(() => menu.ShowPatientHistoryAsync(_user.PatientId.Value));
                if (choice == "View My Notifications") await ConsoleManager.RunActionAsync(() => new PatientMenu(_factory).ShowMyNotificationsAsync(_user.PatientId.Value));
                if (choice == "View My Patient Profile") await ConsoleManager.RunActionAsync(() => new PatientMenu(_factory).ShowPatientProfileAsync(_user.PatientId.Value));
            }
            catch (MainMenuException)
            {
                // # Home - return to Patient Dashboard
            }
        }
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
