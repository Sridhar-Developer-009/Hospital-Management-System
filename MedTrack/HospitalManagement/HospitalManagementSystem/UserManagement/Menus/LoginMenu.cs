using HospitalManagementSystem.Database.Connection;
using HospitalManagementSystem.Dashboards;
using HospitalManagementSystem.Shared.Exceptions;
using HospitalManagementSystem.Shared.Utilities;
using HospitalManagementSystem.UserManagement.DTOs;
using HospitalManagementSystem.UserManagement.Repositories;
using HospitalManagementSystem.UserManagement.Services;

namespace HospitalManagementSystem.UserManagement.Menus;

public class LoginMenu
{
    private readonly DbConnectionFactory _factory;
    private readonly AuthenticationService _auth;
    public LoginMenu(DbConnectionFactory factory)
    {
        _factory = factory;
        _auth = new AuthenticationService(new UserRepository(factory));
    }

    public async Task ShowRootAsync()
    {
        while (true)
        {
            try
            {
                ConsoleManager.Clear();
                ConsoleManager.Header("HOSPITAL MANAGEMENT SYSTEM");
                Console.WriteLine();
                Console.WriteLine($"  System Time : {DateTime.Now:dd-MMM-yyyy hh:mm tt}");
                Console.WriteLine();
                var roleChoice = InputHelper.SelectFromMenu("Welcome! Select your role to proceed:", false,
                    "System Administrator",
                    "Doctor",
                    "Patient",
                    "Exit Application");
                if (roleChoice == "Exit Application") return;
                if (roleChoice == "System Administrator") await ConsoleManager.RunActionAsync(() => LoginAndRouteAsync("SYSTEM ADMINISTRATOR", "Admin"));
                if (roleChoice == "Doctor") await ConsoleManager.RunActionAsync(() => LoginAndRouteAsync("DOCTOR PHYSICIAN PORTAL", "Doctor"));
                if (roleChoice == "Patient") await ConsoleManager.RunActionAsync(PatientPortalAsync);
            }
            catch (MainMenuException)
            {
                // # Home requested from a nested screen before role login. Redraw root menu.
            }
        }
    }

    private async Task PatientPortalAsync()
    {
        var patientMenu = new PatientManagement.Menus.PatientMenu(_factory);
        while (true)
        {
            ConsoleManager.Clear();
            ConsoleManager.Header("PATIENT PORTAL", "Main Menu > Patient Portal Gateway");
            Console.WriteLine();
            var portalChoice = InputHelper.SelectFromMenu("Patient Portal:",
                "Login to Existing Patient Account",
                "Register New Patient Account (Online Self-Service)");
            if (portalChoice == "Login to Existing Patient Account") await ConsoleManager.RunActionAsync(() => LoginAndRouteAsync("PATIENT SECURE LOGIN", "Patient"));
            if (portalChoice == "Register New Patient Account (Online Self-Service)") await ConsoleManager.RunActionAsync(patientMenu.RegisterPatientAsync);
        }
    }

    private async Task LoginAndRouteAsync(string context, string expectedRole)
    {
        ConsoleManager.Clear();
        ConsoleManager.Header("Sign In");
        Console.WriteLine($" Signing in as: {context}");
        Console.WriteLine();
        ConsoleManager.RenderNavBar();
        var username = InputHelper.ReadUsername(" Enter username : ");
        var password = SecurePasswordReader.Read(" Enter password : ");
        ConsoleManager.Line();
        ConsoleManager.Info("Signing you in...");
        try
        {
            var user = await _auth.LoginAsync(new LoginRequest { Username = username, Password = password }, expectedRole);
            ConsoleManager.Success("Welcome back!");
            ConsoleManager.Pause();
            if (user.RoleName == "Admin") await new AdminDashboard(_factory, user).ShowAsync();
            else if (user.RoleName == "Doctor") await new DoctorDashboard(_factory, user).ShowAsync();
            else if (user.RoleName == "Patient") await new PatientDashboard(_factory, user).ShowAsync();
        }
        catch (AuthenticationException ex)
        {
            Logger.Error("Sign-in rejected", ex);
            ConsoleManager.Error("We couldn't sign you in. Please check your details and try again.");
            ConsoleManager.Pause();
        }
        catch (Exception ex)
        {
            Logger.Error("Login failed", ex);
            ConsoleManager.Error("We couldn't sign you in right now. Please try again later.");
            ConsoleManager.Pause();
        }
    }


}
