using HospitalManagementSystem.AppointmentManagement.Repositories;
using HospitalManagementSystem.AppointmentManagement.Services;
using HospitalManagementSystem.Database.Connection;
using HospitalManagementSystem.DoctorManagement.Repositories;
using HospitalManagementSystem.DoctorManagement.Services;
using HospitalManagementSystem.Shared.Exceptions;
using HospitalManagementSystem.Shared.Models;
using HospitalManagementSystem.Shared.Utilities;
using Spectre.Console;

namespace HospitalManagementSystem.DoctorManagement.Menus;

public class DoctorMenu
{
    private const int DateColWidth = 12;
    private const int SlotColWidth = 13;

    private readonly DbConnectionFactory _factory;
    private readonly DoctorService _doctorService;
    private readonly SlotService _slotService;
    private readonly LeaveService _leaveService;

    public DoctorMenu(DbConnectionFactory factory)
    {
        _factory = factory;
        _doctorService = new DoctorService(new DoctorRepository(factory));
        _slotService = new SlotService(new SlotRepository(factory));
        _leaveService = new LeaveService(new LeaveRepository(factory));
    }

    public async Task ShowAdminDoctorManagementAsync()
    {
        while (true)
        {
            ConsoleManager.Clear();
            ConsoleManager.Header("Doctor Management", "Dashboard > Doctor Management");
            Console.WriteLine();
            var docMgmtChoice = InputHelper.SelectFromMenu("Doctor Management:",
                "Register New Doctor Profile",
                "View Doctor Profiles",
                "Modify Doctor Profile",
                "View Doctor Slots & Shifts (Read-Only)",
                "Back");
            if (docMgmtChoice == "Back") return;
            if (docMgmtChoice == "Register New Doctor Profile") await ConsoleManager.RunActionAsync(RegisterDoctorAsync);
            if (docMgmtChoice == "View Doctor Profiles") await ConsoleManager.RunActionAsync(ViewDoctorProfilesAsync);
            if (docMgmtChoice == "Modify Doctor Profile") await ConsoleManager.RunActionAsync(ModifyDoctorProfileAsync);
            if (docMgmtChoice == "View Doctor Slots & Shifts (Read-Only)") await ConsoleManager.RunActionAsync(ShowAdminViewSlotsAsync);
        }
    }

    private async Task RegisterDoctorAsync()
    {
        ConsoleManager.Clear();
        ConsoleManager.Header("Register Doctor", "Dashboard > Doctor Management > Register");
        ConsoleManager.RenderNavBar();

        var name = InputHelper.ReadName("Doctor full name: ");
        var departments = await _doctorService.GetDepartmentsAsync();
        if (!departments.Any())
        {
            ConsoleManager.Warning("No active departments are available yet.");
            ConsoleManager.Pause();
            return;
        }

        Console.WriteLine("  Select Department");
        ConsoleManager.PrintTable(
            new[] { "S.No", "Department ID", "Department Name" },
            departments.Select((d, i) => new[] { (i + 1).ToString(), d.DepartmentId.ToString(), d.DepartmentName }));

        var deptChoice = InputHelper.ReadInt("Choose department: ", 1, departments.Count);
        var phone = InputHelper.ReadPhone("Contact number: ");
        var email = InputHelper.ReadEmail("Email address: ");
        var qualification = InputHelper.ReadRequired("Qualification: ");
        var exp = InputHelper.ReadInt("Experience years: ", 0, 70);
        Console.WriteLine("  Set sign-in details");
        var username = InputHelper.ReadUsername("Username: ");
        var password = InputHelper.ReadPassword("Password: ");

        if (!InputHelper.ConfirmSelection("Save this doctor profile? (Y/N): ")) return;

        var id = await _doctorService.RegisterDoctorAsync(name, departments[deptChoice - 1].DepartmentId, email, phone, qualification, exp, username, password);
        var doctor = await _doctorService.GetDoctorAsync(id);

        ConsoleManager.Clear();
        ConsoleManager.Header("Registration Success", "Dashboard > Doctor Management > Register > Done");
        ConsoleManager.Success("Doctor saved.");
        ConsoleManager.Line();
        Console.WriteLine($"  Doctor Code : {doctor?.DoctorCode}");
        Console.WriteLine($"  Name        : {doctor?.DoctorName}");
        Console.WriteLine($"  Department  : {doctor?.DepartmentName}");
        Console.WriteLine("  Status      : ACTIVE");
        ConsoleManager.Pause();
    }

    private async Task ViewDoctorProfilesAsync()
    {
        ConsoleManager.Clear();
        ConsoleManager.Header("View Doctor Profiles", "Dashboard > Doctor Management > View");
        ConsoleManager.RenderNavBar();

        var doctors = await _doctorService.GetDoctorsAsync();
        if (!doctors.Any())
        {
            ConsoleManager.Info("No doctors found.");
            ConsoleManager.Pause();
            return;
        }

        ConsoleManager.PrintPagedTable(
            new[] { "S.No", "Code", "Doctor Name", "Department", "Email", "Contact", "Status" },
            doctors.Select((d, i) => new[]
            {
                (i + 1).ToString(),
                d.DoctorCode,
                d.DoctorName,
                d.DepartmentName,
                d.Email,
                d.Phone,
                d.IsActive ? "ACTIVE" : "INACTIVE"
            }).ToList(),
            10);

        var ix = InputHelper.ReadInt("View doctor serial number (0 to exit): ", 0, doctors.Count);
        if (ix == 0) return;

        var doctor = doctors[ix - 1];

        Console.WriteLine();
        Console.WriteLine("  Doctor Profile (Read-Only)");
        Console.WriteLine($"  Doctor Code    : {doctor.DoctorCode}");
        Console.WriteLine($"  Full Name      : {doctor.DoctorName}");
        Console.WriteLine($"  Department     : {doctor.DepartmentName}");
        Console.WriteLine($"  Qualification  : {doctor.Qualification}");
        Console.WriteLine($"  Experience     : {doctor.ExperienceYears} years");
        Console.WriteLine($"  Contact Number : {doctor.Phone}");
        Console.WriteLine($"  Email Address  : {doctor.Email}");
        Console.WriteLine($"  Account Status : {(doctor.IsActive ? "ACTIVE" : "INACTIVE")}");
        ConsoleManager.Pause();
    }

    private async Task ModifyDoctorProfileAsync()
    {
        while (true)
        {
            ConsoleManager.Clear();
            ConsoleManager.Header("Modify Doctor Profile", "Dashboard > Doctor Management > Modify");
            ConsoleManager.RenderNavBar();

            var doctors = await _doctorService.GetDoctorsAsync();
            if (!doctors.Any())
            {
                ConsoleManager.Info("No doctors found.");
                ConsoleManager.Pause();
                return;
            }

            ConsoleManager.PrintPagedTable(
                new[] { "S.No", "Code", "Doctor Name", "Department", "Email", "Contact", "Status" },
                doctors.Select((d, i) => new[]
                {
                    (i + 1).ToString(),
                    d.DoctorCode,
                    d.DoctorName,
                    d.DepartmentName,
                    d.Email,
                    d.Phone,
                    d.IsActive ? "ACTIVE" : "INACTIVE"
                }).ToList(),
                10);

            var ix = InputHelper.ReadInt("Choose doctor serial number (0 to exit): ", 0, doctors.Count);
            if (ix == 0) return;

            var doctor = doctors[ix - 1];
            var dId = doctor.DoctorId;

            while (true)
            {
                ConsoleManager.Clear();
                ConsoleManager.Header("Modify Doctor Profile", "Dashboard > Doctor Management > Modify");
                ConsoleManager.RenderNavBar();

                var current = await _doctorService.GetDoctorAsync(dId);
                if (current == null)
                {
                    ConsoleManager.Warning("We couldn't find that doctor.");
                    ConsoleManager.Pause();
                    break;
                }

                Console.WriteLine("  Current Profile");
                Console.WriteLine($"  1. Full Name      : {current.DoctorName}");
                Console.WriteLine($"  2. Department     : {current.DepartmentName}");
                Console.WriteLine($"  3. Contact Number : {current.Phone}");
                Console.WriteLine($"  4. Email Address  : {current.Email}");
                Console.WriteLine($"  5. Account Status : {(current.IsActive ? "ACTIVE" : "INACTIVE")}");
                Console.WriteLine("  6. Deactivate Doctor Profile");
                Console.WriteLine("  7. Back");

                var choice = InputHelper.ReadInt("Choose field/action: ", 0, 7);
                if (choice == 0 || choice == 7) break;

                switch (choice)
                {
                    case 1:
                    {
                        var name = InputHelper.ReadName("Full name: ");
                        if (InputHelper.ConfirmSelection("Update full name? (Y/N): "))
                        {
                            await _doctorService.UpdateDoctorNameAsync(dId, name);
                            ConsoleManager.Success("Full name updated.");
                        }
                        break;
                    }
                    case 2:
                    {
                        var depts = await _doctorService.GetDepartmentsAsync();
                        ConsoleManager.PrintTable(
                            new[] { "S.No", "Department ID", "Department Name" },
                            depts.Select((d, i) => new[] { (i + 1).ToString(), d.DepartmentId.ToString(), d.DepartmentName }));
                        var deptChoice = InputHelper.ReadInt("Choose department: ", 1, depts.Count);
                        if (InputHelper.ConfirmSelection("Update department? (Y/N): "))
                        {
                            await _doctorService.UpdateDoctorDepartmentAsync(dId, depts[deptChoice - 1].DepartmentId);
                            ConsoleManager.Success("Department updated.");
                        }
                        break;
                    }
                    case 3:
                    {
                        var phone = InputHelper.ReadPhone("Contact number: ");
                        if (InputHelper.ConfirmSelection("Update contact number? (Y/N): "))
                        {
                            await _doctorService.UpdateDoctorPhoneAsync(dId, phone);
                            ConsoleManager.Success("Contact number updated.");
                        }
                        break;
                    }
                    case 4:
                    {
                        var email = InputHelper.ReadEmail("Email address: ");
                        if (InputHelper.ConfirmSelection("Update email address? (Y/N): "))
                        {
                            await _doctorService.UpdateDoctorEmailAsync(dId, email);
                            ConsoleManager.Success("Email address updated.");
                        }
                        break;
                    }
                    case 5:
                    {
                        if (current.IsActive)
                        {
                            ConsoleManager.Warning("Set account to INACTIVE? The doctor will not be able to log in.");
                            if (InputHelper.ConfirmSelection("Deactivate account? (Y/N): "))
                            {
                                await _doctorService.UpdateDoctorStatusAsync(dId, false);
                                ConsoleManager.Success("Deactivated.");
                            }
                        }
                        else
                        {
                            if (InputHelper.ConfirmSelection("Reactivate account? (Y/N): "))
                            {
                                await _doctorService.UpdateDoctorStatusAsync(dId, true);
                                ConsoleManager.Success("Activated.");
                            }
                        }
                        break;
                    }
                    case 6:
                    {
                        ConsoleManager.Clear();
                        ConsoleManager.Header("Deactivate Doctor", "Dashboard > Doctor Management > Modify > Deactivate");
                        ConsoleManager.Warning("Inactive doctors cannot log in and will be hidden from patient booking.");
                        if (InputHelper.ConfirmSelection("Deactivate this doctor? (Y/N): "))
                        {
                            await _doctorService.DeactivateDoctorAsync(dId);
                            ConsoleManager.Success("Doctor account deactivated.");
                        }
                        ConsoleManager.Pause();
                        break;
                    }
                }

                if (choice is >= 1 and <= 5) ConsoleManager.Pause();
            }
        }
    }

    public record ScheduleInput(List<TimeSpan> SlotTimes, int DurationMinutes, TimeSpan B1Start, TimeSpan B1End, TimeSpan LunchStart, TimeSpan LunchEnd, TimeSpan B2Start, TimeSpan B2End);

    public static async Task<ScheduleInput?> GetScheduleInputAsync()
    {
        try
        {
        Console.WriteLine("  [ Break 1 - Short Break ]");
        var b1Start = InputHelper.ReadTime("    Start time: ");
        var b1End = InputHelper.ReadTime("    End time: ");
        while (b1End <= b1Start) { ConsoleManager.Warning("End must be after start."); b1End = InputHelper.ReadTime("    End time: "); }

        Console.WriteLine("  [ Lunch Break ]");
        var lunchStart = InputHelper.ReadTime("    Start time: ");
        var lunchEnd = InputHelper.ReadTime("    End time: ");
        while (lunchEnd <= lunchStart) { ConsoleManager.Warning("End must be after start."); lunchEnd = InputHelper.ReadTime("    End time: "); }
        while (!(lunchStart >= b1End || lunchEnd <= b1Start))
        {
            ConsoleManager.Warning("Lunch overlaps with Break 1. Choose times that don't conflict.");
            lunchStart = InputHelper.ReadTime("    Lunch start: ");
            lunchEnd = InputHelper.ReadTime("    Lunch end: ");
            while (lunchEnd <= lunchStart) { ConsoleManager.Warning("End must be after start."); lunchEnd = InputHelper.ReadTime("    Lunch end: "); }
        }

        Console.WriteLine("  [ Break 2 - Short Break ]");
        var b2Start = InputHelper.ReadTime("    Start time: ");
        var b2End = InputHelper.ReadTime("    End time: ");
        while (b2End <= b2Start) { ConsoleManager.Warning("End must be after start."); b2End = InputHelper.ReadTime("    End time: "); }
        while ((b2Start < lunchEnd && b2End > lunchStart) || (b2Start < b1End && b2End > b1Start))
        {
            ConsoleManager.Warning("Break 2 overlaps with another break or lunch. Choose non-conflicting times.");
            b2Start = InputHelper.ReadTime("    Break 2 start: ");
            b2End = InputHelper.ReadTime("    Break 2 end: ");
            while (b2End <= b2Start) { ConsoleManager.Warning("End must be after start."); b2End = InputHelper.ReadTime("    Break 2 end: "); }
        }

        ConsoleManager.Line();
        Console.WriteLine("  [ Slot Duration ]");
        var duration = InputHelper.ReadInt("    Each slot duration in minutes (15, 30, 45, or 60): ", 15, 60);
        while (duration is not (15 or 30 or 45 or 60))
        {
            ConsoleManager.Warning("Choose 15, 30, 45, or 60 minutes.");
            duration = InputHelper.ReadInt("    Each slot duration in minutes: ", 15, 60);
        }

        var breakRanges = new List<(TimeSpan start, TimeSpan end)> { (b1Start, b1End), (lunchStart, lunchEnd), (b2Start, b2End) };

        ConsoleManager.Line();
        Console.WriteLine("  [ Your 5 Available Slots ]");
        Console.WriteLine("  Enter start time for each slot. End time = start + duration.");
        ConsoleManager.Line();

        var slotTimes = new List<TimeSpan>();
        for (int i = 1; i <= 5; i++)
        {
            while (true)
            {
                var st = InputHelper.ReadTime($"    Slot {i} start time: ");
                var slotEnd = st.Add(TimeSpan.FromMinutes(duration));

                bool overlapsBreak = false;
                foreach (var (bs, be) in breakRanges)
                {
                    if (st < be && slotEnd > bs)
                    {
                        ConsoleManager.Warning($"Slot {i} ({FormatTime(st)}-{FormatTime(slotEnd)}) overlaps with a break/lunch period ({FormatTime(bs)}-{FormatTime(be)}).");
                        overlapsBreak = true;
                        break;
                    }
                }
                if (overlapsBreak) continue;

                bool overlapsSlot = false;
                foreach (var existing in slotTimes)
                {
                    var existingEnd = existing.Add(TimeSpan.FromMinutes(duration));
                    if (st < existingEnd && slotEnd > existing)
                    {
                        ConsoleManager.Warning($"Slot {i} ({FormatTime(st)}-{FormatTime(slotEnd)}) overlaps with Slot {slotTimes.IndexOf(existing) + 1} ({FormatTime(existing)}-{FormatTime(existingEnd)}).");
                        overlapsSlot = true;
                        break;
                    }
                }
                if (overlapsSlot) continue;

                slotTimes.Add(st);
                break;
            }
        }

        slotTimes = slotTimes.OrderBy(t => t).ToList();
        return new ScheduleInput(slotTimes, duration, b1Start, b1End, lunchStart, lunchEnd, b2Start, b2End);
        }
        catch (MenuBackException) { return null; }
    }

    public async Task ShowSetWeeklyAvailabilityAsync(int doctorId)
    {
        ConsoleManager.Clear();
        ConsoleManager.Header("Set Weekly Availability", "Dashboard > Set Weekly Availability");
        ConsoleManager.RenderNavBar();
        Console.WriteLine("  Define your unavailability (breaks/lunch), then set 5 available slots.");
        var fromDate = DateTime.Today.AddDays(1);
        var toDate = DateTime.Today.AddDays(7);
        Console.WriteLine($"  Slots will be generated from {fromDate:ddd dd-MMM-yyyy} to {toDate:ddd dd-MMM-yyyy}.");
        ConsoleManager.Line();

        var input = await GetScheduleInputAsync();
        if (input == null) return;

        ConsoleManager.Clear();
        ConsoleManager.Header("Preview Weekly Availability", "Dashboard > Set Weekly Availability > Preview");
        ConsoleManager.RenderNavBar();
        ConsoleManager.Line();

        var allPeriods = new List<(TimeSpan start, TimeSpan end, string label)>();
        foreach (var st in input.SlotTimes)
            allPeriods.Add((st, st.Add(TimeSpan.FromMinutes(input.DurationMinutes)), "SLOT"));
        allPeriods.Add((input.B1Start, input.B1End, "BREAK1"));
        allPeriods.Add((input.LunchStart, input.LunchEnd, "LUNCH"));
        allPeriods.Add((input.B2Start, input.B2End, "BREAK2"));
        allPeriods = allPeriods.OrderBy(p => p.start).ToList();

        Console.WriteLine("  Daily Schedule Preview:");
        ConsoleManager.Line();
        foreach (var (st, et, label) in allPeriods)
        {
            var color = label switch { "SLOT" => "green", "LUNCH" => "orange1", _ => "grey" };
            var marker = label switch { "SLOT" => "A", "LUNCH" => "L", _ => "B" };
            AnsiConsole.MarkupLine($"    [{color}]{marker}[/] {FormatTime(st)} - {FormatTime(et)}  [{color}]{label}[/]");
        }

        ConsoleManager.Line();
        AnsiConsole.MarkupLine($"  This pattern will be applied for: [bold white]{fromDate:dd-MMM-yyyy}[/] to [bold white]{toDate:dd-MMM-yyyy}[/]");
        ConsoleManager.Line();

        if (!InputHelper.ConfirmSelection("Save this weekly availability? (Y/N): ")) return;

        var total = await _slotService.SetWeeklyCustomSlotsAsync(doctorId, input.SlotTimes, input.DurationMinutes);
        ConsoleManager.Success("Weekly availability saved.");
        ConsoleManager.Line();
        AnsiConsole.MarkupLine("  [grey]Tip: Use arrow keys on the main screen to toggle individual slots.[/]");
        ConsoleManager.Pause();
    }

    public async Task ShowDoctorLeaveAsync(int doctorId)
    {
        while (true)
        {
            ConsoleManager.Clear();
            ConsoleManager.Header("Manage Leave Requests", "Dashboard > Leave Management");
            ConsoleManager.RenderNavBar();
            ConsoleManager.Line();

            var leaves = await _leaveService.GetByDoctorAsync(doctorId);
            if (!leaves.Any())
            {
                ConsoleManager.Info("No leave requests found.");
            }
            else
            {
                ConsoleManager.PrintPagedTable(
                    new[] { "S.No", "Leave ID", "Start Date", "End Date", "Status", "Reason" },
                    leaves.Select((l, i) => new[]
                    {
                        (i + 1).ToString(),
                        l.LeaveId.ToString(),
                        l.StartDate.ToString("dd-MMM-yyyy"),
                        l.EndDate.ToString("dd-MMM-yyyy"),
                        l.Status,
                        l.Reason
                    }).ToList(),
                    10);
            }

            Console.WriteLine();
            var leaveChoice = InputHelper.SelectFromMenu("Leave Management:",
                "File New Leave Request",
                "Back");
            if (leaveChoice == "Back") return;
            await ConsoleManager.RunActionAsync(async () =>
            {
                Console.WriteLine("  Date format: DD-MM-YYYY    Example: 25-06-2026");
                var start = InputHelper.ReadDate("Leave start date: ");
                var end = InputHelper.ReadDate("Leave end date: ");
                var reason = InputHelper.ReadRequired("Reason: ");
                if (end < start)
                {
                    ConsoleManager.Warning("End date cannot be earlier than start date.");
                    ConsoleManager.Pause();
                    return;
                }
                if (InputHelper.ConfirmSelection("Submit leave request? (Y/N): "))
                {
                    var leaveId = await _leaveService.ApplyAsync(doctorId, start, end, reason);
                    ConsoleManager.Success("Leave submitted.");
                    ConsoleManager.Pause();
                }
            });
        }
    }

    private async Task ShowAdminViewSlotsAsync()
    {
        ConsoleManager.Clear();
        ConsoleManager.Header("View Doctor Slots", "Dashboard > Doctor Management > View Slots");
        ConsoleManager.RenderNavBar();

        var activeDoctors = (await _doctorService.GetDoctorsAsync()).Where(d => d.IsActive).ToList();
        if (!activeDoctors.Any())
        {
            ConsoleManager.Warning("No active doctors are available.");
            ConsoleManager.Pause();
            return;
        }

        ConsoleManager.PrintPagedTable(
            new[] { "S.No", "Code", "Doctor Name", "Department", "Email", "Contact" },
            activeDoctors.Select((d, i) => new[] { (i + 1).ToString(), d.DoctorCode, d.DoctorName, d.DepartmentName, d.Email, d.Phone }).ToList(),
            10);

        var doctorChoice = InputHelper.ReadInt("Choose doctor (0 to exit): ", 0, activeDoctors.Count);
        if (doctorChoice == 0) return;
        var selectedDoctor = activeDoctors[doctorChoice - 1];

        // Show active shifts
        var shiftService = new ShiftService(new ShiftRepository(_factory));
        var shifts = await shiftService.GetByDoctorAsync(selectedDoctor.DoctorId);

        ConsoleManager.Clear();
        ConsoleManager.Header($"Slots & Shifts - {selectedDoctor.DoctorName}", "Dashboard > Doctor Management > View Slots > Details");
        ConsoleManager.RenderNavBar();
        ConsoleManager.Line();

        Console.WriteLine($"  Doctor : {selectedDoctor.DoctorCode} - {selectedDoctor.DoctorName}");
        Console.WriteLine($"  Dept   : {selectedDoctor.DepartmentName}");
        ConsoleManager.Line();

        if (shifts.Any())
        {
            Console.WriteLine("  [ Active Shifts - Read Only ]");
            foreach (var shift in shifts)
            {
                Console.WriteLine($"  {shift.ShiftName}: {FormatTime(shift.StartTime)} - {FormatTime(shift.EndTime)} | Duration: {shift.SlotDurationMinutes} min");
            }
            ConsoleManager.Line();
        }

        // Show slot matrix for next 7 days in doctor's dashboard format
        var slots = await _slotService.GetDoctorSlotsWithDetailsAsync(selectedDoctor.DoctorId, DateTime.Today, DateTime.Today.AddDays(6));
        Console.WriteLine("  [ Slot Matrix - Next 7 Days ]");
        ConsoleManager.Line();

        var days = Enumerable.Range(0, 7).Select(i => DateTime.Today.AddDays(i)).ToList();
        var maxSlots = slots
            .GroupBy(s => s.Slot.SlotDate.Date)
            .Select(g => g.Count())
            .DefaultIfEmpty(5)
            .Max();
        if (maxSlots > 5) maxSlots = 5;

        // Column headers
        var hdrFirst = new string(' ', DateColWidth) + "|";
        var hdrData = "";
        for (int s = 0; s < maxSlots; s++)
            hdrData += $"  Slot {s + 1}  ".PadRight(SlotColWidth) + "|";
        AnsiConsole.MarkupLine($"  [bold {ConsoleManager.Accent}]{Markup.Escape(hdrFirst + hdrData)}[/]");

        // Separator
        var sepFirst = new string('-', DateColWidth) + "+";
        var sepData = "";
        for (int s = 0; s < maxSlots; s++) sepData += new string('-', SlotColWidth) + "+";
        sepData = sepData.TrimEnd('+') + "-";
        AnsiConsole.MarkupLine($"  [grey]{Markup.Escape(sepFirst + sepData)}[/]");

        // Day rows
        foreach (var day in days)
        {
            var dayLabel = $"{day:ddd dd-MMM}";
            var rowFirst = dayLabel.PadRight(DateColWidth) + "|";
            var daySlots = slots.Where(s => s.Slot.SlotDate.Date == day.Date).OrderBy(s => s.Slot.StartTime).Take(maxSlots).ToList();

            var rowData = "";
            for (int s = 0; s < maxSlots; s++)
            {
                var cell = s < daySlots.Count ? daySlots[s] : ((SlotRow? Slot, bool HasActiveAppointment, bool HasCompletedAppointment)?)null;
                rowData += RenderAdminCell(cell) + "|";
            }
            AnsiConsole.MarkupLine($"  {rowFirst + rowData}");
        }

        ConsoleManager.Line();
        AnsiConsole.MarkupLine($"  [green](A)[/] Available  [red](R)[/] Blocked  [yellow](K)[/] Booked  [blue](C)[/] Completed  [grey](-)[/] No slot");
        ConsoleManager.Pause();
    }

    private static string RenderAdminCell((SlotRow Slot, bool HasActiveAppointment, bool HasCompletedAppointment)? cell)
    {
        string visible;
        string color;

        if (cell == null)
        {
            visible = "-";
            color = "grey";
        }
        else
        {
            var (slot, hasAppt, hasCompleted) = cell.Value;
            var timeStr = DateTime.Today.Add(slot.StartTime).ToString("hh:mm tt");

            if (hasCompleted) { visible = $"{timeStr}(C)"; color = "blue"; }
            else if (hasAppt) { visible = $"{timeStr}(K)"; color = "yellow"; }
            else if (slot.IsBooked) { visible = $"{timeStr}(R)"; color = "red"; }
            else { visible = $"{timeStr}(A)"; color = "green"; }
        }

        var padded = $" {visible} ".PadRight(SlotColWidth);
        return $"[{color}]{Markup.Escape(padded)}[/]";
    }

    private static string FormatTime(TimeSpan time) => DateTime.Today.Add(time).ToString("hh:mm tt");
}
