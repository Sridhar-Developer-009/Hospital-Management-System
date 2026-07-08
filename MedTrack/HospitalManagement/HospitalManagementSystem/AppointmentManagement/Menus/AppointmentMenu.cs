using HospitalManagementSystem.AppointmentManagement.Repositories;
using HospitalManagementSystem.AppointmentManagement.Services;
using HospitalManagementSystem.AppointmentManagement.Events;
using HospitalManagementSystem.Database.Connection;
using HospitalManagementSystem.Database.Helpers;
using HospitalManagementSystem.DoctorManagement.Repositories;
using HospitalManagementSystem.DoctorManagement.Services;
using HospitalManagementSystem.NotificationManagement.Repositories;
using HospitalManagementSystem.NotificationManagement.Services;
using HospitalManagementSystem.Shared.Constants;
using HospitalManagementSystem.Shared.Exceptions;
using HospitalManagementSystem.Shared.Models;
using HospitalManagementSystem.Shared.Utilities;
using Microsoft.Data.SqlClient;

namespace HospitalManagementSystem.AppointmentManagement.Menus;

public class AppointmentMenu
{
    private readonly DbConnectionFactory _factory;
    private readonly DoctorService _doctorService;
    private readonly SlotService _slotService;
    private readonly AppointmentService _appointmentService;
    private readonly MedicalHistoryService _historyService;
    private readonly HolidayService _holidayService;
    private readonly NotificationService _notificationService;

    public AppointmentMenu(DbConnectionFactory factory)
    {
        _factory = factory;
        _doctorService = new DoctorService(new DoctorRepository(factory));
        _slotService = new SlotService(new SlotRepository(factory));
        _appointmentService = new AppointmentService(new AppointmentRepository(factory));
        _historyService = new MedicalHistoryService(new MedicalHistoryRepository(factory));
        _holidayService = new HolidayService(new HolidayRepository(factory));
        _notificationService = new NotificationService(new NotificationRepository(factory));

        // Subscribe to appointment lifecycle events to feed the NotificationLogs table.
        _appointmentService.AppointmentBooked += OnAppointmentBooked;
        _appointmentService.AppointmentCancelled += OnAppointmentCancelled;
        _appointmentService.AppointmentCompleted += OnAppointmentCompleted;
    }

    public async Task BookAppointmentAsync(int patientId, string patientName, string uhid, bool isReschedule = false, int? excludeSlotId = null)
    {
        ConsoleManager.Clear();
        ConsoleManager.Header("Select Medical Department", "Patient Portal > Book Appointment > Department");
        ConsoleManager.RenderNavBar();
        ConsoleManager.Line();

        var departments = await _doctorService.GetDepartmentsAsync();
        if (!departments.Any())
        {
            ConsoleManager.Warning("No active departments are available right now.");
            ConsoleManager.Pause();
            return;
        }

        ConsoleManager.PrintTable(
            new[] { "S.No", "Department ID", "Department" },
            departments.Select((d, i) => new[] { (i + 1).ToString(), d.DepartmentId.ToString(), d.DepartmentName }));

        var dc = InputHelper.ReadInt("Choose department: ", 0, departments.Count);
        if (dc == 0) return;
        var dept = departments[dc - 1];

        var doctors = (await _doctorService.GetDoctorsAsync()).Where(d => d.DepartmentId == dept.DepartmentId && d.IsActive).ToList();
        ConsoleManager.Clear();
        ConsoleManager.Header($"Select {dept.DepartmentName} Doctor", "Patient Portal > Book Appointment > Doctor");
        ConsoleManager.RenderNavBar();
        ConsoleManager.Line();

        if (!doctors.Any())
        {
            ConsoleManager.Warning("No active doctors are available in this department.");
            ConsoleManager.Pause();
            return;
        }

        ConsoleManager.PrintTable(
            new[] { "S.No", "Doctor Code", "Doctor Name", "Department", "Email", "Contact", "Status" },
            doctors.Select((d, i) => new[]
            {
                (i + 1).ToString(),
                d.DoctorCode,
                d.DoctorName,
                d.DepartmentName,
                d.Email,
                d.Phone,
                d.IsActive ? "ACTIVE" : "INACTIVE"
            }));

        var docChoice = InputHelper.ReadInt("Choose doctor: ", 0, doctors.Count);
        if (docChoice == 0) return;
        var doctor = doctors[docChoice - 1];

        Console.WriteLine("  Date format: DD-MM-YYYY    Example: 25-06-2026");
        var date = InputHelper.ReadDate("Appointment date: ");
        if (date.Date < DateTime.Today)
        {
            ConsoleManager.Warning("Appointments cannot be booked in the past. Please select today or a future date.");
            ConsoleManager.Pause();
            return;
        }
        if (!isReschedule)
        {
            var existing = await _appointmentService.GetPatientAppointmentsAsync(patientId);
            if (existing.Any(a => a.DoctorId == doctor.DoctorId && a.AppointmentDate == date && a.Status == "Booked"))
            {
                ConsoleManager.Warning("You already have a booked appointment with this doctor on this date. Only one appointment per doctor per day is allowed.");
                ConsoleManager.Pause();
                return;
            }
        }
        var slots = await _slotService.GetAvailableAsync(doctor.DoctorId, date);
        if (excludeSlotId.HasValue)
            slots = slots.Where(s => s.SlotId != excludeSlotId.Value).ToList();

        if (!slots.Any())
        {
            ConsoleManager.Warning("The doctor has no available slots for this date. Please choose another date.");
            ConsoleManager.Pause();
            return;
        }

        ConsoleManager.Clear();
        ConsoleManager.Header("Select Consultation Slot", "Patient Portal > Book Appointment > Slot");
        Console.WriteLine($"  Doctor: {doctor.DoctorCode} - {doctor.DoctorName}");
        ConsoleManager.RenderNavBar();
        ConsoleManager.Line();

        ConsoleManager.PrintTable(
            new[] { "S.No", "Date", "Start Time", "End Time", "Status" },
            slots.Select((s, i) => new[]
            {
                (i + 1).ToString(),
                s.SlotDate.ToString("dd-MMM-yyyy"),
                FormatTime(s.StartTime),
                FormatTime(s.EndTime),
                "AVAILABLE"
            }));

        var sc = InputHelper.ReadInt("Choose slot: ", 0, slots.Count);
        if (sc == 0) return;
        var slot = slots[sc - 1];

        var timeError = DateTimeValidationHelper.ValidateAppointmentDate(slot.SlotDate, slot.StartTime);
        if (!string.IsNullOrEmpty(timeError))
        {
            ConsoleManager.Warning(timeError);
            ConsoleManager.Pause();
            return;
        }

        ConsoleManager.Clear();
        ConsoleManager.Header("Confirm Appointment Booking", "Patient Portal > Book Appointment > Confirm");
        ConsoleManager.RenderNavBar();
        ConsoleManager.Line();
        Console.WriteLine($"  Patient Name       : {patientName} (UHID: {uhid})");
        Console.WriteLine($"  Assigned Physician : {doctor.DoctorName} ({doctor.DepartmentName})");
        Console.WriteLine($"  Appointment Date   : {slot.SlotDate:dd-MMM-yyyy} ({slot.SlotDate:dddd})");
        Console.WriteLine($"  Confirmed Time     : {FormatTime(slot.StartTime)} - {FormatTime(slot.EndTime)}");
        ConsoleManager.Line();

        var reason = InputHelper.ReadOptional("Reason for visit: ");
        if (!InputHelper.ConfirmSelection("Save this booking? (Y/N): ")) return;

        try
        {
            var booked = await _appointmentService.BookAsync(patientId, doctor.DoctorId, slot.SlotId, reason);
            if (booked == null)
            {
                ConsoleManager.Clear();
                ConsoleManager.Header("Booking Failed", "Patient Portal > Book Appointment > Failed");
                ConsoleManager.Warning("We couldn't complete this booking. Please try again.");
                ConsoleManager.Pause();
                return;
            }
            ConsoleManager.Clear();
            ConsoleManager.Header("Booking Completed", "Patient Portal > Book Appointment > Done");
            ConsoleManager.Success("Appointment booked.");
            ConsoleManager.Line();
            Console.WriteLine($"  Appointment Number : {booked.AppointmentNumber}");
            Console.WriteLine($"  Patient UHID       : {uhid}");
            Console.WriteLine($"  Scheduled Time     : {FormatTime(slot.StartTime)}");
            Console.WriteLine("  Appointment Status : BOOKED");
        }
        catch (DataAccessException ex)
        {
            ConsoleManager.Clear();
            ConsoleManager.Header("Booking Failed", "Patient Portal > Book Appointment > Failed");
            Logger.Error("Appointment booking failed", ex);
            ConsoleManager.Error("We couldn't book this appointment right now. Please try again.");
        }
        catch (Exception ex)
        {
            ConsoleManager.Clear();
            ConsoleManager.Header("Booking Failed", "Patient Portal > Book Appointment > Failed");
            Logger.Error("Unexpected appointment booking error", ex);
            ConsoleManager.Error("Something went wrong while booking. Please try again.");
        }

        ConsoleManager.Pause();
    }

    public async Task ManagePatientBookingsAsync(int patientId)
    {
        while (true)
        {
            var active = (await _appointmentService.GetPatientAppointmentsAsync(patientId)).Where(a => a.Status == "Booked").ToList();
            ConsoleManager.Clear();
            ConsoleManager.Header("Manage My Bookings", "Patient Portal > Manage Bookings");
            ConsoleManager.RenderNavBar();
            ConsoleManager.Line();
            Console.WriteLine();
            var choice = InputHelper.SelectFromMenu("Manage My Bookings:",
                "View Active Bookings",
                "Reschedule Appointment",
                "Cancel Appointment",
                "Back");
            if (choice == "Back") return;

            if (!active.Any())
            {
                ConsoleManager.Info("No active appointments found.");
                ConsoleManager.Pause();
                continue;
            }

            if (choice == "View Active Bookings")
            {
                ConsoleManager.Clear();
                ConsoleManager.Header("Active Bookings", "Patient Portal > Manage Bookings > Active");
                PrintPatientAppointments(active);
                ConsoleManager.Pause();
                continue;
            }

            PrintPatientAppointments(active);
            var c = InputHelper.ReadInt(choice == "Reschedule Appointment" ? "Choose appointment to reschedule: " : "Choose appointment to cancel: ", 0, active.Count);
            if (c == 0) continue;
            var selected = active[c - 1];

            if (choice == "Reschedule Appointment")
            {
                ConsoleManager.Clear();
            ConsoleManager.Header("Reschedule Appointment", "Patient Portal > Manage Bookings > Reschedule");
            ConsoleManager.RenderNavBar();
            ConsoleManager.Warning("Your current booking will be cancelled first, then you can choose a new time.");
                Console.WriteLine($"  Old Appointment : {selected.AppointmentNumber}");
                Console.WriteLine($"  Old Date/Time   : {selected.AppointmentDate:dd-MMM-yyyy} {FormatTime(selected.StartTime)}");
                if (!InputHelper.ConfirmSelection("Continue with reschedule? (Y/N): ")) continue;

                var previousNumber = selected.AppointmentNumber;
                try
                {
                    await _appointmentService.CancelAsync(selected);
                    var rescheduleMenu = new AppointmentMenu(_factory);
                    await rescheduleMenu.BookAppointmentAsync(patientId, selected.PatientName, selected.UHID, isReschedule: true, excludeSlotId: selected.SlotId);
                    ConsoleManager.Success("Your appointment has been rescheduled.");
                }
                catch (BusinessRuleException ex)
                {
                    Logger.Error("Appointment reschedule failed", ex);
                    ConsoleManager.Error("We couldn't reschedule this appointment. Please try again.");
                }
                ConsoleManager.Pause();
                continue;
            }

            ConsoleManager.Clear();
            ConsoleManager.Header("Cancel Appointment", "Patient Portal > Manage Bookings > Cancel");
            ConsoleManager.RenderNavBar();
            ConsoleManager.Warning($"You are about to cancel appointment {selected.AppointmentNumber}.");
            Console.WriteLine("  This time will become available for booking again.");
            if (!InputHelper.ConfirmSelection("Are you sure you want to cancel this booking? (Y/N): ")) continue;

            try
            {
                await _appointmentService.CancelAsync(selected);
                ConsoleManager.Success("Appointment cancelled.");
            }
            catch (BusinessRuleException ex)
            {
                ConsoleManager.Clear();
                ConsoleManager.Header("Cancellation Locked", "Patient Portal > Manage Bookings > Cancel > Locked");
                Logger.Error("Appointment cancellation blocked", ex);
                ConsoleManager.Error("This appointment can no longer be cancelled online. Please contact the hospital team.");
            }
            catch (Exception ex)
            {
                Logger.Error("Appointment cancellation failed", ex);
                ConsoleManager.Error("We couldn't cancel this appointment. Please try again.");
            }

            ConsoleManager.Pause();
        }
    }

    private static void PrintPatientAppointments(IReadOnlyList<AppointmentRow> appointments)
    {
        ConsoleManager.PrintPagedTable(
            new[] { "S.No", "Appointment No", "Doctor", "Department", "Date", "Time", "Status" },
            appointments.Select((a, i) => new[]
            {
                (i + 1).ToString(),
                a.AppointmentNumber,
                a.DoctorName,
                a.DepartmentName,
                a.AppointmentDate.ToString("dd-MMM-yyyy"),
                $"{FormatTime(a.StartTime)} - {FormatTime(a.EndTime)}",
                a.Status
            }).ToList(),
            8);
    }

    public async Task ShowPatientHistoryAsync(int patientId)
    {
        var rows = await _historyService.GetPatientHistoryAsync(patientId);
        ConsoleManager.Clear();
        ConsoleManager.Header("Medical History", "Patient Portal > Medical History");
        ConsoleManager.RenderNavBar();
        ConsoleManager.Line();

        var grouped = rows.GroupBy(r => r.HistoryId).ToList();
        if (!grouped.Any())
        {
            ConsoleManager.Info("No medical history is available yet.");
            ConsoleManager.Pause();
            return;
        }

        ConsoleManager.PrintTable(
            new[] { "S.No", "Date", "Case ID", "Doctor", "Primary Diagnosis" },
            grouped.Select((g, i) =>
            {
                var r = g.First();
                return new[] { (i + 1).ToString(), r.AppointmentDate.ToString("dd-MMM-yyyy"), $"HISTORY-{r.HistoryId:D4}", r.DoctorName, r.Diagnosis };
            }));

        var c = InputHelper.ReadInt("Choose case to view: ", 0, grouped.Count);
        if (c == 0) return;
        var group = grouped[c - 1].ToList();
        var item = group.First();

        ConsoleManager.Clear();
        ConsoleManager.Header("Clinical Visit Details", "Patient Portal > Medical History > Details");
        Console.WriteLine($"  Case ID      : HISTORY-{item.HistoryId:D4}");
        Console.WriteLine($"  Visit Date   : {item.AppointmentDate:dd-MMM-yyyy}");
        Console.WriteLine($"  Doctor       : {item.DoctorName} ({item.DepartmentName})");
        ConsoleManager.Line();
        Console.WriteLine("  Diagnosis");
        Console.WriteLine($"  - {item.Diagnosis}");
        Console.WriteLine();
        Console.WriteLine("  Clinical Notes");
        Console.WriteLine($"  - {item.ClinicalNotes}");
        Console.WriteLine();
        Console.WriteLine("  Prescriptions");
        var meds = group.Where(x => !string.IsNullOrWhiteSpace(x.MedicineName)).ToList();
        if (!meds.Any()) Console.WriteLine("  - No prescriptions added yet.");
        for (var i = 0; i < meds.Count; i++)
        {
            var p = meds[i];
            Console.WriteLine($"  {i + 1}. {p.MedicineName} {p.Dosage} - {p.Frequency} x {p.DurationDays} days. {p.Instructions}");
        }

        ConsoleManager.Pause();
    }

    public async Task ShowAdminAppointmentManagementAsync(int userId)
    {
        while (true)
        {
            ConsoleManager.Clear();
            ConsoleManager.Header("Appointment Management", "Dashboard > Appointment Oversight");
            ConsoleManager.RenderNavBar();
            ConsoleManager.Line();
            Console.WriteLine();
            var c = InputHelper.SelectFromMenu("Appointment Management:",
                "View All Appointments",
                "Search Appointment by Appointment Number",
                "View Appointments by Date",
                "View Appointments by Status",
                "Declare Hospital Holiday",
                "Back");
            if (c == "Back") return;
            if (c == "View All Appointments") await ConsoleManager.RunActionAsync(ViewAllAppointmentsAsync);
            if (c == "Search Appointment by Appointment Number") await ConsoleManager.RunActionAsync(SearchAppointmentAsync);
            if (c == "View Appointments by Date") await ConsoleManager.RunActionAsync(ViewAppointmentsByDateAsync);
            if (c == "View Appointments by Status") await ConsoleManager.RunActionAsync(ViewAppointmentsByStatusAsync);
            if (c == "Declare Hospital Holiday") await ConsoleManager.RunActionAsync(DeclareHolidayAsync);
        }
    }

    private async Task ViewAllAppointmentsAsync()
    {
        var rows = (await _appointmentService.GetAllForAdminAsync()).ToList();
        if (rows.Count == 0)
        {
            ConsoleManager.Clear();
            ConsoleManager.Header("All Appointments", "Dashboard > Appointment Oversight > All");
            ConsoleManager.Info("No appointments found.");
            ConsoleManager.Pause();
            return;
        }
        ConsoleManager.Clear();
        ConsoleManager.Header("All Appointments", "Dashboard > Appointment Oversight > All");
        ConsoleManager.Line();
        ConsoleManager.PrintPagedTable(
            new[] { "S.No", "Appointment No", "Patient", "UHID", "Doctor", "Date", "Time", "Status" },
            rows.Select((a, i) => new[]
            {
                (i + 1).ToString(),
                a.AppointmentNumber,
                a.PatientName,
                a.UHID,
                a.DoctorName,
                a.AppointmentDate.ToString("dd-MMM-yyyy"),
                $"{FormatTime(a.StartTime)} - {FormatTime(a.EndTime)}",
                a.Status
            }).ToList(),
            8);
    }

    private async Task SearchAppointmentAsync()
    {
        ConsoleManager.Clear();
        ConsoleManager.Header("Search Appointment", "Dashboard > Appointment Oversight > Search");
        ConsoleManager.Line();

        var number = InputHelper.ReadRequiredWithFormat("Appointment number: ", ValidationRules.ForAppointmentNumber());
        var appointment = await _appointmentService.GetByNumberForAdminAsync(number);
        if (appointment == null)
        {
            ConsoleManager.Warning("No appointment found with that appointment number.");
            ConsoleManager.Pause();
            return;
        }

        PrintAppointments(new[] { appointment });
        ConsoleManager.Pause();
    }

    private async Task ViewAppointmentsByDateAsync()
    {
        while (true)
        {
            ConsoleManager.Clear();
            ConsoleManager.Header("Appointments by Date", "Dashboard > Appointment Oversight > By Date");
            ConsoleManager.RenderNavBar();
            ConsoleManager.Line();
            Console.WriteLine("  Enter a date to filter appointments for that day.");

            var date = InputHelper.ReadDate("Appointment date (0 to back): ");
            var rows = await _appointmentService.GetByDateForAdminAsync(date);

            ConsoleManager.Clear();
            ConsoleManager.Header($"Appointments on {date:dd-MMM-yyyy}", "Dashboard > Appointment Oversight > By Date");
            ConsoleManager.Line();
            if (rows.Count == 0)
            {
                ConsoleManager.Info("No appointments found for that date.");
            }
            else
            {
                PrintAppointments(rows);
            }
            ConsoleManager.Line();
            ConsoleManager.Prompt("Press Enter for another date, 0 to back, # for Home: ");
            var again = Console.ReadLine()?.Trim();
            if (string.IsNullOrWhiteSpace(again))
            {
                continue;
            }
            if (again == "0") return;
            if (again == "#") throw new MainMenuException();
        }
    }

    private async Task ViewAppointmentsByStatusAsync()
    {
        var options = new[] { "Booked", "Completed", "Cancelled", "NoShow" };
        while (true)
        {
            ConsoleManager.Clear();
            ConsoleManager.Header("Appointments by Status", "Dashboard > Appointment Oversight > By Status");
            ConsoleManager.RenderNavBar();
            Console.WriteLine("  Choose a status to filter appointments.");
            ConsoleManager.Line();

            ConsoleManager.PrintTable(
                new[] { "S.No", "Status" },
                options.Select((status, i) => new[] { (i + 1).ToString(), status }));
            ConsoleManager.Line();

            var choice = InputHelper.ReadInt("Choose status (0 to back): ", 0, options.Length);
            if (choice == 0) return;
            var rows = await _appointmentService.GetByStatusForAdminAsync(options[choice - 1]);

            ConsoleManager.Clear();
            ConsoleManager.Header($"Appointments - {options[choice - 1]}", "Dashboard > Appointment Oversight > By Status");
            ConsoleManager.Line();
            if (rows.Count == 0)
            {
                ConsoleManager.Info($"No {options[choice - 1].ToLowerInvariant()} appointments found.");
            }
            else
            {
                PrintAppointments(rows);
            }
            ConsoleManager.Line();
            ConsoleManager.Prompt("Press Enter for another status, 0 to back, # for Home: ");
            var again = Console.ReadLine()?.Trim();
            if (string.IsNullOrWhiteSpace(again))
            {
                continue;
            }
            if (again == "0") return;
            if (again == "#") throw new MainMenuException();
        }
    }

    private async Task DeclareHolidayAsync()
    {
        ConsoleManager.Clear();
        ConsoleManager.Header("Declare Hospital Holiday", "Dashboard > Appointment Oversight > Declare Holiday");
        ConsoleManager.RenderNavBar();
        Console.WriteLine("  This marks the selected date as a hospital holiday.");
        Console.WriteLine("  Any booked appointments on this date will be cancelled and their times will become available again.");
        ConsoleManager.Line();

        var date = InputHelper.ReadDate("Holiday date: ");
        var name = InputHelper.ReadRequiredWithFormat("Holiday name: ", ValidationRules.ForMaxChars(200));
        var reason = InputHelper.ReadRequiredWithFormat("Reason / note: ", ValidationRules.ForMaxChars(500));
        if (!InputHelper.ConfirmSelection("Save this holiday? (Y/N): ")) return;

        var (cancelled, released) = await _holidayService.DeclareWithCascadeAsync(date, name, reason);
        ConsoleManager.Success("Holiday saved.");
        if (cancelled > 0)
        {
            ConsoleManager.Warning($"{cancelled} appointment(s) cancelled and {released} time slot(s) released.");
        }
        else
        {
            ConsoleManager.Info("No active bookings were affected by this holiday.");
        }
        ConsoleManager.Pause();
    }

    private static void PrintAppointments(IEnumerable<AppointmentOversightRow> appointments)
    {
        var rows = appointments.ToList();
        ConsoleManager.PrintPagedTable(
            new[]
            {
                "S.No", "Appointment No", "Patient", "UHID",
                "Doctor", "Date", "Time", "Status"
            },
            rows.Select((a, i) => new[]
            {
                (i + 1).ToString(),
                a.AppointmentNumber,
                a.PatientName,
                a.UHID,
                a.DoctorName,
                a.AppointmentDate.ToString("dd-MMM-yyyy"),
                $"{FormatTime(a.StartTime)} - {FormatTime(a.EndTime)}",
                a.Status
            }).ToList(),
            8);
    }

    private static string FormatTime(TimeSpan time) => DateTime.Today.Add(time).ToString("hh:mm tt");

    // ---------------------------------------------------------------------
    // Notification handlers: react to appointment lifecycle events and
    // record a NotificationLog entry that admin can view in Notification
    // Management. Recipient = the patient's email (best-effort lookup).
    // ---------------------------------------------------------------------
    private void OnAppointmentBooked(object? sender, AppointmentBookedEvent e)
    {
        var recipient = ResolvePatientEmailAsync(e.PatientName).GetAwaiter().GetResult();
        var msg = $"Your appointment {e.AppointmentNumber} is confirmed.";
        _notificationService.NotifyAsync(e.AppointmentId, recipient, msg, e.TriggeredBy, "AppointmentConfirmed").GetAwaiter().GetResult();
    }

    private void OnAppointmentCancelled(object? sender, AppointmentCancelledEvent e)
    {
        var recipient = "-";
        var msg = $"Your appointment {e.AppointmentNumber} has been cancelled.";
        _notificationService.NotifyAsync(e.AppointmentId, recipient, msg, e.TriggeredBy, "AppointmentCancelled").GetAwaiter().GetResult();
    }

    private void OnAppointmentCompleted(object? sender, AppointmentCompletedEvent e)
    {
        var recipient = "-";
        var msg = $"Your visit for appointment {e.AppointmentNumber} is complete. History id: {e.HistoryId}.";
        _notificationService.NotifyAsync(e.AppointmentId, recipient, msg, e.TriggeredBy, "SystemAlert").GetAwaiter().GetResult();
    }

    private async Task<string> ResolvePatientEmailAsync(string patientName)
    {
        try
        {
            await using var conn = await _factory.CreateOpenConnectionAsync();
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT TOP (1) Email FROM vw_PatientDetails WHERE PatientName = @n AND Email IS NOT NULL";
            cmd.Parameters.Add(SqlParameterHelper.Param("@n", patientName));
            var result = await cmd.ExecuteScalarAsync();
            return Convert.ToString(result) ?? patientName;
        }
        catch
        {
            return patientName;
        }
    }
}
