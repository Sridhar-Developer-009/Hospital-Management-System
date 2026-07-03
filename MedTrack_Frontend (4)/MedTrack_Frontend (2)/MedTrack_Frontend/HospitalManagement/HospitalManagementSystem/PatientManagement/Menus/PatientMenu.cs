using HospitalManagementSystem.Database.Connection;
using HospitalManagementSystem.NotificationManagement.Repositories;
using HospitalManagementSystem.PatientManagement.Repositories;
using HospitalManagementSystem.PatientManagement.Services;
using HospitalManagementSystem.Shared.Utilities;

namespace HospitalManagementSystem.PatientManagement.Menus;

public class PatientMenu
{
    private readonly DbConnectionFactory _factory;
    private readonly PatientService _service;
    public PatientMenu(DbConnectionFactory factory)
    {
        _factory = factory;
        _service = new PatientService(new PatientRepository(factory));
    }

    public async Task RegisterPatientAsync()
    {
        ConsoleManager.Clear();
        ConsoleManager.Header("Patient Registration", "Main Menu > Patient Portal > Register");
        Console.WriteLine(" Please enter your details to create your patient profile.");
        ConsoleManager.RenderNavBar();
        ConsoleManager.Line();

        var name = InputHelper.ReadName(" Enter Your Full Name : ");
        var phone = InputHelper.ReadPhone(" Enter Contact Number : ");
        var email = InputHelper.ReadEmail(" Enter Email Address  : ");
        var gender = InputHelper.ReadGender(" Enter Gender (Male/Female/Other) : ");
        var dob = InputHelper.ReadDate(" Enter Date of Birth (DD-MM-YYYY) : ");
        var address = InputHelper.ReadOptional(" Enter Address : ");
        var blood = InputHelper.ReadOptional(" Enter Blood Group : ");
        var emergency = InputHelper.ReadOptional(" Enter Emergency Contact : ");
        Console.WriteLine("\n Create your sign-in details:");
        var username = InputHelper.ReadUsername("  Create Username     : ");
        var password = InputHelper.ReadPassword("  Create Password     : ");

        if (!InputHelper.ConfirmSelection(" Confirm Account Creation? (Y/N) : ")) return;

        ConsoleManager.Clear();
        ConsoleManager.Header("Creating Your Account", "Main Menu > Patient Portal > Register");
        ConsoleManager.Info("Setting things up...");

        var result = await _service.RegisterAsync(name, gender, dob, email, phone, address, blood, emergency, username, password);

        ConsoleManager.Clear();
        ConsoleManager.Header("Account Created", "Main Menu > Patient Portal > Register > Done");
        if (result.PatientId == 0)
        {
            ConsoleManager.Error("We couldn't create your account. Please try again.");
            ConsoleManager.Pause();
            return;
        }
        Console.WriteLine(" Your patient profile has been created successfully.");
        Console.WriteLine(" [ Your Patient Details ]");
        ConsoleManager.Line();
        Console.WriteLine($"  - Your Unique UHID : {result.UHID}");
        Console.WriteLine($"  - Registered Name  : {name}");
        Console.WriteLine($"  - Login Username   : {username}");
        Console.WriteLine("  - Account Status   : ACTIVE");
        ConsoleManager.Line();
        Console.WriteLine(" Please keep your UHID safe. You can now sign in from the Patient Portal.");
        ConsoleManager.Pause();
    }

    public async Task ShowAdminPatientMonitoringAsync()
    {
        while (true)
        {
            ConsoleManager.Clear();
            ConsoleManager.Header("Patient Management", "Dashboard > Patient Management");
            ConsoleManager.RenderNavBar();
            ConsoleManager.Line();
            Console.WriteLine();
            var c = InputHelper.SelectFromMenu("Patient Management:",
                "View Active Patients",
                "Search Patient Profiles",
                "Back");
            if (c == "Back") return;

            if (c == "View Active Patients")
            {
                await ConsoleManager.RunActionAsync(async () =>
                {
                    var patients = await _service.GetAllAsync();
                    ConsoleManager.Clear();
                    ConsoleManager.Header("ACTIVE PATIENT DIRECTORY", "Dashboard > Patient Management > Directory");
                    if (!patients.Any())
                    {
                        Console.WriteLine("No active patients found.");
                        ConsoleManager.Pause();
                    }
                    else
                    {
                        ConsoleManager.PrintPagedTable(
                            new[] { "S.No", "UHID", "Patient Full Name", "Contact No", "Email" },
                            patients.Select((p, i) => new[]
                            {
                                (i + 1).ToString(),
                                p.UHID,
                                p.PatientName,
                                p.Phone,
                                p.Email
                            }).ToList());
                        ConsoleManager.Pause();
                    }
                });
            }

            if (c == "Search Patient Profiles")
            {
                await ConsoleManager.RunActionAsync(async () =>
                {
                    ConsoleManager.Clear();
                    ConsoleManager.Header("SEARCH PATIENT MASTER PROFILES", "Dashboard > Patient Management > Search");
                    Console.WriteLine();
                    var searchMode = InputHelper.SelectFromMenu("Search By:",
                        "Patient UHID (Exact Match)",
                        "Registered Contact Number (Exact Match)",
                        "Back");
                    if (searchMode == "Back") return;
                    var query = InputHelper.ReadRequired(" Enter patient details to search : ");
                    var isPhone = searchMode == "Registered Contact Number (Exact Match)";
                    var p = isPhone ? await _service.GetByPhoneAsync(query) : await _service.GetByUhidAsync(query);
                    PrintPatient(p);
                });
            }
        }
    }

    public async Task ShowPatientProfileAsync(int patientId)
    {
        var p = await _service.GetByIdAsync(patientId);
        PrintPatient(p);
    }

    public async Task ShowMyNotificationsAsync(int patientId)
    {
        var repo = new NotificationRepository(_factory);
        var notifications = await repo.GetByPatientIdAsync(patientId);
        ConsoleManager.Clear();
        ConsoleManager.Header("My Notifications", "Patient Portal > Notifications");
        if (!notifications.Any())
        {
            ConsoleManager.Info("You don't have any notifications yet.");
            ConsoleManager.Pause();
        }
        else
        {
            ConsoleManager.PrintPagedTable(
                new[] { "S.No", "Date/Time", "Source", "Category", "Message" },
                notifications.Select((n, i) => new[]
                {
                    (i + 1).ToString(),
                    n.SentDate?.ToString("dd-MMM-yyyy hh:mm tt") ?? "-",
                    n.NotificationType,
                    n.Status,
                    n.Message
                }).ToList());
        }
    }

    private static void PrintPatient(HospitalManagementSystem.Shared.Models.PatientRow? p)
    {
        ConsoleManager.Clear();
        ConsoleManager.Header("PATIENT PROFILE MASTER CARD", "Dashboard > Patient Management > Profile");
        if (p == null)
        {
            ConsoleManager.Error("We couldn't find that patient.");
            ConsoleManager.Pause();
            return;
        }
        ConsoleManager.Line();
        Console.WriteLine($" - UHID Code          : {p.UHID}");
        Console.WriteLine($" - Full Name          : {p.PatientName}");
        Console.WriteLine($" - Gender             : {p.Gender}");
        Console.WriteLine($" - Date of Birth      : {p.DateOfBirth:dd-MMM-yyyy}");
        Console.WriteLine($" - Age                : {CalculateAge(p.DateOfBirth)} years");
        Console.WriteLine($" - Primary Contact    : {p.Phone}");
        Console.WriteLine($" - Registered Email ID: {p.Email}");
        Console.WriteLine($" - Blood Group        : {p.BloodGroup}");
        Console.WriteLine($" - Emergency Contact  : {p.EmergencyContact}");
        Console.WriteLine($" - Profile Status     : {(p.IsActive ? "ACTIVE" : "INACTIVE")}");
        ConsoleManager.Line();
        Console.WriteLine(" This profile is view-only.");
        ConsoleManager.Pause();
    }

    private static int CalculateAge(DateTime dateOfBirth)
    {
        var today = DateTime.Today;
        var age = today.Year - dateOfBirth.Year;
        if (dateOfBirth.Date > today.AddYears(-age))
        {
            age--;
        }

        return Math.Max(age, 0);
    }
}
