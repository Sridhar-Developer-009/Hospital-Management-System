using HospitalManagementSystem.AppointmentManagement.DTOs;
using HospitalManagementSystem.AppointmentManagement.Repositories;
using HospitalManagementSystem.AppointmentManagement.Services;
using HospitalManagementSystem.Database.Connection;
using HospitalManagementSystem.DoctorManagement.Menus;
using HospitalManagementSystem.DoctorManagement.Repositories;
using HospitalManagementSystem.DoctorManagement.Services;
using HospitalManagementSystem.NotificationManagement.Repositories;
using HospitalManagementSystem.PatientManagement.Repositories;
using HospitalManagementSystem.PatientManagement.Services;
using HospitalManagementSystem.Shared.Exceptions;
using HospitalManagementSystem.Shared.Models;
using HospitalManagementSystem.Shared.Utilities;
using HospitalManagementSystem.UserManagement.DTOs;
using Spectre.Console;

namespace HospitalManagementSystem.Dashboards;

public class DoctorDashboard
{
    private const int DateColWidth = 12;
    private const int SlotColWidth = 13;

    private readonly DbConnectionFactory _factory;
    private readonly LoginResponse _user;
    private readonly DashboardService _dashboardService;

    public DoctorDashboard(DbConnectionFactory factory, LoginResponse user)
    {
        _factory = factory;
        _user = user;
        _dashboardService = new DashboardService(factory);
    }

    public async Task ShowAsync()
    {
        if (_user.DoctorId == null)
        {
            ConsoleManager.Error("We couldn't find your doctor profile. Please contact the hospital team.");
            ConsoleManager.Pause();
            return;
        }

        var slotService = new SlotService(new SlotRepository(_factory));
        var apptService = new AppointmentService(new AppointmentRepository(_factory));
        int cursorDay = 0, cursorSlot = 0;

        while (true)
        {
            try
            {
                var m = await ConsoleManager.WithStatusAsync("Getting everything ready...", () => _dashboardService.GetDoctorMetricsAsync(_user.DoctorId.Value));
                var slotDetails = await ConsoleManager.WithStatusAsync("Loading your schedule...", () => slotService.GetDoctorSlotsWithDetailsAsync(_user.DoctorId.Value, DateTime.Today, DateTime.Today.AddDays(6)));

                RenderMainView(m, slotDetails, cursorDay, cursorSlot);

                var key = Console.ReadKey(true);

                switch (key.Key)
                {
                    case ConsoleKey.UpArrow:
                        if (cursorDay > 0) cursorDay--;
                        break;
                    case ConsoleKey.DownArrow:
                        if (cursorDay < 6) cursorDay++;
                        break;
                    case ConsoleKey.LeftArrow:
                        if (cursorSlot > 0) cursorSlot--;
                        break;
                    case ConsoleKey.RightArrow:
                        if (cursorSlot < 4) cursorSlot++;
                        break;
                    case ConsoleKey.Enter:
                        await HandleCellAction(slotService, apptService, slotDetails, cursorDay, cursorSlot);
                        break;
                    case ConsoleKey.D:
                        var daySlots = GetDisplaySlotsForDay(slotDetails, DateTime.Today.AddDays(cursorDay));
                        if (daySlots.Count > 0 && daySlots.All(s => s.Slot.SlotDate.Date < DateTime.Today ||
                            (s.Slot.SlotDate.Date == DateTime.Today && s.Slot.EndTime <= DateTime.Now.TimeOfDay)))
                        {
                            ConsoleManager.Warning("All slots for this day have already passed. Cannot configure.");
                            ConsoleManager.Pause();
                        }
                        else
                        {
                            await ConfigureDayAsync(slotService, cursorDay);
                        }
                        break;
                    case ConsoleKey.S:
                        await new DoctorMenu(_factory).ShowSetWeeklyAvailabilityAsync(_user.DoctorId.Value);
                        break;
                    case ConsoleKey.T:
                        await ShowTodayQueueAsync();
                        break;
                    case ConsoleKey.N:
                        await ShowMyNotificationsAsync();
                        break;
                    case ConsoleKey.P:
                        await ShowMyProfileAsync();
                        break;
                    case ConsoleKey.Q:
                        if (Logout()) return;
                        break;
                }
            }
            catch (MainMenuException)
            {
                // # Home - return to Doctor Dashboard
            }
        }
    }

    private void RenderMainView(DoctorDashboardMetrics m, List<(SlotRow Slot, bool HasActiveAppointment, bool HasCompletedAppointment)> slotDetails, int cursorDay, int cursorSlot)
    {
        ConsoleManager.Clear();
        AnsiConsole.MarkupLine($"  [bold {ConsoleManager.Accent}]{Markup.Escape(_user.DisplayName ?? "Doctor")}[/]  [grey]>[/] [white]{Markup.Escape(_user.DepartmentName ?? "")}[/]");
        AnsiConsole.MarkupLine($"  [bold white]My Weekly Availability[/]  [{ConsoleManager.Muted}]{DateTime.Now:dd-MMM-yyyy hh:mm tt}[/]");
        var weeklyFrom = DateTime.Today.AddDays(1);
        var weeklyTo = DateTime.Today.AddDays(7);
        AnsiConsole.MarkupLine($"  [grey]Weekly coverage:[/] [white]{weeklyFrom:ddd dd-MMM-yyyy}[/] [grey]to[/] [white]{weeklyTo:ddd dd-MMM-yyyy}[/]  [grey]| Press [bold](S)[/] to re-set[/]");
        ConsoleManager.Line();
        AnsiConsole.MarkupLine($"  Today: [bold yellow]{m.PendingConsultations} Booked[/]  |  [bold deepskyblue1]{m.CompletedTreatments} Completed[/]  |  [bold orange1]{m.UnresolvedNoShows} No-Show[/]");
        ConsoleManager.Line();

        // Build day-slot matrix
        (SlotRow? Slot, bool HasActiveAppointment, bool HasCompletedAppointment)[,] matrix = new (SlotRow?, bool, bool)[7, 5];
        for (int d = 0; d < 7; d++)
        {
            var date = DateTime.Today.AddDays(d);
            var dayData = GetDisplaySlotsForDay(slotDetails, date);

            for (int s = 0; s < 5; s++)
            {
                matrix[d, s] = s < dayData.Count
                    ? (dayData[s].Slot, dayData[s].HasActiveAppointment, dayData[s].HasCompletedAppointment)
                    : (null, false, false);
            }
        }

        // Column headers
        var hdrFirst = new string(' ', DateColWidth) + "|";
        var hdrData = "";
        for (int s = 0; s < 5; s++)
            hdrData += $"  Slot {s + 1}  ".PadRight(SlotColWidth) + "|";
        AnsiConsole.MarkupLine($"  [bold {ConsoleManager.Accent}]{Markup.Escape(hdrFirst + hdrData)}[/]");

        // Separator
        var sepFirst = new string('-', DateColWidth) + "+";
        var sepData = "";
        for (int s = 0; s < 5; s++) sepData += new string('-', SlotColWidth) + "+";
        sepData = sepData.TrimEnd('+') + "-";
        AnsiConsole.MarkupLine($"  [grey]{Markup.Escape(sepFirst + sepData)}[/]");

        // Day rows
        for (int d = 0; d < 7; d++)
        {
            var date = DateTime.Today.AddDays(d);
            var dayLabel = $"{date:ddd dd-MMM}";
            var rowFirst = dayLabel.PadRight(DateColWidth) + "|";

            var rowData = "";
            for (int s = 0; s < 5; s++)
            {
                var (slot, hasAppt, hasCompleted) = matrix[d, s];
                var isSelected = (d == cursorDay && s == cursorSlot);
                rowData += RenderCellContent(slot, hasAppt, hasCompleted, isSelected) + "|";
            }

            AnsiConsole.MarkupLine($"  {rowFirst + rowData}");
        }

        Console.WriteLine();

        // Legend
        AnsiConsole.MarkupLine($"  [green](A)[/] Available  [red](R)[/] Blocked  [yellow](K)[/] Booked  [blue](C)[/] Completed  [grey](-)[/] No slot");
        ConsoleManager.Line();

        // Action bar
        AnsiConsole.MarkupLine($"  [bold white]Arrow keys[/] Navigate  |  [bold white]Enter[/] Select  |  [bold white](D)[/] Configure Day  |  [bold white](S)[/] Weekly Schedule  |  [bold white](T)[/] Today's Queue  |  [bold white](N)[/] Notifications  |  [bold white](P)[/] Profile  |  [bold white](Q)[/] Quit");
    }

    private static string RenderCellContent(SlotRow? slot, bool hasActiveAppointment, bool hasCompletedAppointment, bool isSelected)
    {
        if (slot == null)
        {
            var dash = "    -    ".PadRight(SlotColWidth);
            if (isSelected) return $"[bold black on white]{Markup.Escape(dash)}[/]";
            return $"[grey]{Markup.Escape(dash)}[/]";
        }

        var timeStr = DateTime.Today.Add(slot.StartTime).ToString("hh:mm tt");
        var isPast = slot.SlotDate.Date < DateTime.Today ||
                     (slot.SlotDate.Date == DateTime.Today && slot.EndTime <= DateTime.Now.TimeOfDay);

        string status;
        string color;
        if (hasActiveAppointment)
        {
            status = "(K)"; color = "yellow";
        }
        else if (hasCompletedAppointment)
        {
            status = "(C)"; color = "blue";
        }
        else if (slot.IsBooked)
        {
            status = "(R)"; color = "red";
        }
        else
        {
            status = "(A)"; color = "green";
        }

        var raw = $" {timeStr}{status} ".PadRight(SlotColWidth);

        if (isSelected)
            return $"[bold black on white]{Markup.Escape(raw)}[/]";

        if (isPast && status != "(K)" && status != "(C)")
            return $"[dim {color}]{Markup.Escape(raw)}[/]";

        return $"[{color}]{Markup.Escape(raw)}[/]";
    }

    private static List<(SlotRow Slot, bool HasActiveAppointment, bool HasCompletedAppointment)> GetDisplaySlotsForDay(
        IEnumerable<(SlotRow Slot, bool HasActiveAppointment, bool HasCompletedAppointment)> slotDetails,
        DateTime date)
    {
        return slotDetails
            .Where(s => s.Slot.SlotDate.Date == date.Date)
            .OrderBy(s => s.Slot.StartTime)
            .ToList();
    }

    private async Task HandleCellAction(SlotService slotService, AppointmentService apptService, List<(SlotRow Slot, bool HasActiveAppointment, bool HasCompletedAppointment)> slotDetails, int day, int slot)
    {
        var date = DateTime.Today.AddDays(day);
        var dayData = GetDisplaySlotsForDay(slotDetails, date);

        if (slot >= dayData.Count) return; // Empty cell

        var (slotRow, hasAppt, hasCompleted) = dayData[slot];
        var isPast = slotRow.SlotDate.Date < DateTime.Today ||
                     (slotRow.SlotDate.Date == DateTime.Today && slotRow.EndTime <= DateTime.Now.TimeOfDay);
        var canComplete = slotRow.SlotDate.Date < DateTime.Today ||
                          (slotRow.SlotDate.Date == DateTime.Today && slotRow.StartTime <= DateTime.Now.TimeOfDay);
        var canPreManage = slotRow.SlotDate.Date > DateTime.Today ||
                          (slotRow.SlotDate.Date == DateTime.Today && slotRow.StartTime > DateTime.Now.AddHours(2).TimeOfDay);

        if (hasAppt)
        {
            var appt = await apptService.GetAppointmentBySlotIdAsync(slotRow.SlotId);
            if (appt == null) return;

            if (!canComplete && canPreManage)
            {
                Console.WriteLine();
                AnsiConsole.MarkupLine($"  [bold]{"Time",-11}:[/] {FormatTime(slotRow.StartTime)} - {FormatTime(slotRow.EndTime)}");
                AnsiConsole.MarkupLine($"  [bold]{"Date",-11}:[/] {slotRow.SlotDate:ddd dd-MMM-yyyy}      [bold]Patient:[/] {appt.PatientName}");
                ConsoleManager.Line();
                Console.WriteLine("  1. Change time");
                Console.WriteLine("  2. Toggle status");
                Console.WriteLine("  0. Back");
                var pick = InputHelper.ReadInt("  Choose: ", 0, 2);
                if (pick == 0) return;

                if (pick == 1)
                {
                    var duration = (slotRow.EndTime - slotRow.StartTime).Minutes;
                    Console.WriteLine();
                    while (true)
                    {
                        try
                        {
                            var newStart = InputHelper.ReadTime("  New start time (HH:MM): ");
                            var newEnd = newStart.Add(TimeSpan.FromMinutes(duration));
                            var daySlots = await slotService.GetDaySlotsAsync(slotRow.DoctorId, slotRow.SlotDate, slotRow.SlotId);
                            bool overlaps = false;
                            foreach (var other in daySlots)
                            {
                                if (newStart < other.EndTime && newEnd > other.StartTime)
                                {
                                    ConsoleManager.Warning($"  Overlaps with {FormatTime(other.StartTime)}-{FormatTime(other.EndTime)}. Try again.");
                                    overlaps = true;
                                    break;
                                }
                            }
                            if (overlaps) continue;
                            var updated = await slotService.UpdateSlotTimeAsync(slotRow.SlotId, newStart, newEnd);
                            if (updated)
                            {
                                slotRow = slotRow with { StartTime = newStart, EndTime = newEnd };
                                ConsoleManager.Success("Slot time changed.");
                            }
                            else
                                ConsoleManager.Warning("  We couldn't update this time. It may no longer be available.");
                            ConsoleManager.Pause();
                            break;
                        }
                        catch (MenuBackException) { return; }
                    }
                }
                else if (pick == 2)
                {
                    if (InputHelper.ConfirmSelection("  Unblock this slot (cancel appointment)? (Y/N): "))
                    {
                        await apptService.CancelAsync(appt);
                        ConsoleManager.Success("Appointment cancelled, slot released.");
                    }
                    ConsoleManager.Pause();
                }
                return;
            }

            if (!canComplete)
            {
                ConsoleManager.Clear();
                ConsoleManager.Header("Slot Details", "Availability Matrix > Booked");
                ConsoleManager.RenderNavBar();
                Console.WriteLine($"  {"Slot",-11}: {FormatTime(slotRow.StartTime)} - {FormatTime(slotRow.EndTime)}");
                Console.WriteLine($"  {"Date",-11}: {slotRow.SlotDate:dd-MMM-yyyy}");
                Console.WriteLine($"  {"Patient",-11}: {appt.PatientName} ({appt.UHID})");
                Console.WriteLine($"  {"Reason",-11}: {appt.ReasonForVisit}");
                Console.WriteLine($"  {"Appt No",-11}: {appt.AppointmentNumber}");
                ConsoleManager.Line();
                ConsoleManager.Info("This booking hasn't started yet. Access it at or after the slot time.");
                ConsoleManager.Pause();
                return;
            }

            ConsoleManager.Clear();
            ConsoleManager.Header("Update Appointment Status", "Availability Matrix > Booked > Action");
            ConsoleManager.RenderNavBar();
            Console.WriteLine($"  {"Appointment",-11}: {appt.AppointmentNumber}");
            Console.WriteLine($"  {"Patient",-11}: {appt.PatientName} ({appt.UHID})");
            Console.WriteLine($"  {"Time",-11}: {FormatTime(slotRow.StartTime)} - {FormatTime(slotRow.EndTime)}");
            Console.WriteLine($"  {"Reason",-11}: {appt.ReasonForVisit}");
            ConsoleManager.Line();
            Console.WriteLine("  1. Mark as Completed");
            Console.WriteLine("  2. Mark as No-Show");
            Console.WriteLine("  0. Back");
            var choice = InputHelper.ReadInt("Choose: ", 0, 2);
            if (choice == 0) return;

            if (choice == 2)
            {
                if (!InputHelper.ConfirmSelection("Confirm No-Show? (Y/N): ")) return;
                await apptService.MarkNoShowAsync(appt);
                ConsoleManager.Success("Marked as No-Show.");
                ConsoleManager.Pause();
                return;
            }

            try
            {
                ConsoleManager.Clear();
                ConsoleManager.Header("Clinical Details", "Availability Matrix > Booked > Complete");
                ConsoleManager.RenderNavBar();
                Console.WriteLine($"  {"Patient",-11}: {appt.PatientName}");
                Console.WriteLine($"  {"Date",-11}: {slotRow.SlotDate:dd-MMM-yyyy}");
                ConsoleManager.Line();
                var diagnosis = InputHelper.ReadRequired("Primary diagnosis: ");
                var notes = InputHelper.ReadRequired("Treatment details: ");

                var prescriptions = new List<PrescriptionDto>();
                if (InputHelper.ConfirmSelection("Add prescriptions? (Y/N): "))
                {
                    while (true)
                    {
                        ConsoleManager.Line();
                        var medName = InputHelper.ReadRequired("  Medicine name: ");
                        var dosage = InputHelper.ReadRequired("  Dosage (e.g. 500mg): ");
                        var freq = InputHelper.ReadRequired("  Frequency (e.g. 3 times daily): ");
                        var days = InputHelper.ReadInt("  Duration (days): ", 1, 365);
                        var instr = InputHelper.ReadRequired("  Instructions (e.g. After food): ");
                        prescriptions.Add(new PrescriptionDto
                        {
                            MedicineName = medName,
                            Dosage = dosage,
                            Frequency = freq,
                            DurationDays = days,
                            Instructions = instr
                        });
                        if (!InputHelper.ConfirmSelection("Add another medicine? (Y/N): ")) break;
                    }
                }

                if (!InputHelper.ConfirmSelection("Save all? (Y/N): ")) return;

                try
                {
                    var historyId = prescriptions.Count > 0
                        ? await apptService.CompleteWithPrescriptionsAsync(appt, diagnosis, notes, prescriptions)
                        : await apptService.CompleteAsync(appt, diagnosis, notes);
                    ConsoleManager.Success("Appointment completed.");
                }
                catch (DataAccessException ex)
                {
                    Logger.Error("Appointment completion failed", ex);
                    ConsoleManager.Error("We couldn't complete this appointment. Please try again.");
                }
                ConsoleManager.Pause();
            }
            catch (MenuBackException) { }
            catch (MainMenuException) { }
            return;
        }

        if (hasCompleted)
        {
            ConsoleManager.Clear();
            ConsoleManager.Header("Completed Appointment", "Availability Matrix > Completed");
            ConsoleManager.RenderNavBar();
            Console.WriteLine($"  {"Slot",-11}: {FormatTime(slotRow.StartTime)} - {FormatTime(slotRow.EndTime)}");
            Console.WriteLine($"  {"Date",-11}: {slotRow.SlotDate:dd-MMM-yyyy}");
            ConsoleManager.Line();
            ConsoleManager.Info("This appointment has already been completed.");
            ConsoleManager.Pause();
            return;
        }

        // Non-booked slot - pick one action, then return to matrix
        if (!isPast)
        {
            Console.WriteLine();
            var statusLabel = slotRow.IsBooked ? "[red]Blocked (R)[/]" : "[green]Available (A)[/]";
            AnsiConsole.MarkupLine($"  [bold]{"Time",-11}:[/] {FormatTime(slotRow.StartTime)} - {FormatTime(slotRow.EndTime)}");
            AnsiConsole.MarkupLine($"  [bold]{"Date",-11}:[/] {slotRow.SlotDate:ddd dd-MMM-yyyy}      [bold]Status:[/] {statusLabel}");
            ConsoleManager.Line();
            Console.WriteLine("  1. Change time");
            Console.WriteLine("  2. Toggle status");
            Console.WriteLine("  0. Back");
            var pick = InputHelper.ReadInt("  Choose: ", 0, 2);
            if (pick == 0) return;

            if (pick == 1)
            {
                var duration = (slotRow.EndTime - slotRow.StartTime).Minutes;
                Console.WriteLine();
                while (true)
                {
                    try
                    {
                        var newStart = InputHelper.ReadTime("  New start time (HH:MM): ");
                        var newEnd = newStart.Add(TimeSpan.FromMinutes(duration));
                        var daySlots = await slotService.GetDaySlotsAsync(slotRow.DoctorId, slotRow.SlotDate, slotRow.SlotId);
                        bool overlaps = false;
                        foreach (var other in daySlots)
                        {
                            if (newStart < other.EndTime && newEnd > other.StartTime)
                            {
                                ConsoleManager.Warning($"  Overlaps with {FormatTime(other.StartTime)}-{FormatTime(other.EndTime)}. Try again.");
                                overlaps = true;
                                break;
                            }
                        }
                        if (overlaps) continue;
                        var updated = await slotService.UpdateSlotTimeAsync(slotRow.SlotId, newStart, newEnd);
                        if (updated)
                        {
                            slotRow = slotRow with { StartTime = newStart, EndTime = newEnd };
                            ConsoleManager.Success("Slot time changed.");
                        }
                        else
                            ConsoleManager.Warning("  We couldn't update this time. It may no longer be available.");
                        ConsoleManager.Pause();
                        break;
                    }
                    catch (MenuBackException) { return; }
                }
            }
            else if (pick == 2)
            {
                var newState = !slotRow.IsBooked;
                var action = newState ? "block" : "unblock";
                if (InputHelper.ConfirmSelection($"  {action} this slot? (Y/N): "))
                {
                    var ok = await slotService.ToggleSlotBlockAsync(slotRow.SlotId, newState);
                    if (ok)
                    {
                        slotRow = slotRow with { IsBooked = newState };
                        ConsoleManager.Success(newState ? "Slot blocked." : "Slot available.");
                    }
                    else
                        ConsoleManager.Warning("We couldn't update this time. It may no longer be available.");
                    ConsoleManager.Pause();
                }
            }
        }
    }

    private async Task ShowTodayQueueAsync()
    {
        var slotService = new SlotService(new SlotRepository(_factory));
        var apptService = new AppointmentService(new AppointmentRepository(_factory));

        while (true)
        {
            var todaySlots = await ConsoleManager.WithStatusAsync("Loading your schedule...", () => slotService.GetDoctorSlotsWithDetailsAsync(_user.DoctorId!.Value, DateTime.Today, DateTime.Today));
            var apps = (await ConsoleManager.WithStatusAsync("Loading today's appointments...", () => apptService.GetDoctorAppointmentsAsync(_user.DoctorId!.Value, DateTime.Today, DateTime.Today)))
                .Where(a => a.Status == "Booked")
                .ToList();

            ConsoleManager.Clear();
            ConsoleManager.Header("Today Queue", "Dashboard > Today Queue");
            ConsoleManager.RenderNavBar();
            ConsoleManager.Line();

            // --- Today's Matrix Row ---
            var dayData = GetDisplaySlotsForDay(todaySlots, DateTime.Today);
            if (dayData.Any())
            {
                var hdrFirst = "            ".PadRight(12) + "|";
                var hdrData = "";
                for (int s = 0; s < 5; s++) hdrData += $"  Slot {s + 1}  ".PadRight(13) + "|";
                AnsiConsole.MarkupLine($"  [bold {ConsoleManager.Accent}]{Markup.Escape(hdrFirst + hdrData)}[/]");

                var sepFirst = new string('-', 12) + "+";
                var sepData = "";
                for (int s = 0; s < 5; s++) sepData += new string('-', 13) + "+";
                sepData = sepData.TrimEnd('+') + "-";
                AnsiConsole.MarkupLine($"  [grey]{Markup.Escape(sepFirst + sepData)}[/]");

                var dayLabel = $"{DateTime.Today:ddd dd-MMM}";
                var rowFirst = $" {dayLabel.PadRight(10)} " + "|";
                var rowData = "";
                for (int s = 0; s < 5; s++)
                {
                    (SlotRow? Slot, bool HasActiveAppointment, bool HasCompletedAppointment) cell;
                    if (s < dayData.Count) cell = dayData[s];
                    else cell = (null, false, false);
                    rowData += RenderCellContent(cell.Slot, cell.HasActiveAppointment, cell.HasCompletedAppointment, false) + "|";
                }
                AnsiConsole.MarkupLine($"  {rowFirst + rowData}");
                ConsoleManager.Line();
            }

            // --- Appointments Table ---
            if (!apps.Any())
            {
                ConsoleManager.Info("No active appointments for today.");
                ConsoleManager.Pause();
                return;
            }

            ConsoleManager.PrintTable(
                new[] { "S.No", "Appt No", "Patient", "Time", "Status" },
                apps.Select((a, i) => new[]
                {
                    (i + 1).ToString(),
                    a.AppointmentNumber,
                    a.PatientName,
                    $"{FormatTime(a.StartTime)} - {FormatTime(a.EndTime)}",
                    a.Status
                }));

            var ix = InputHelper.ReadInt("Choose appointment (0 to back): ", 0, apps.Count);
            if (ix == 0) return;
            var selected = apps[ix - 1];

            // --- Actions for selected appointment ---
            while (true)
            {
                ConsoleManager.Clear();
                ConsoleManager.Header($"Appointment {selected.AppointmentNumber}", "Dashboard > Today Queue > Details");
                ConsoleManager.RenderNavBar();
                Console.WriteLine($"  {"Patient",-11}: {selected.PatientName} ({selected.UHID})");
                Console.WriteLine($"  {"Time",-11}: {FormatTime(selected.StartTime)} - {FormatTime(selected.EndTime)}");
                Console.WriteLine($"  {"Reason",-11}: {selected.ReasonForVisit}");
                ConsoleManager.Line();
                Console.WriteLine("  1. View Medical History");
                Console.WriteLine("  2. Mark Completed");
                Console.WriteLine("  3. Mark No-Show");
                Console.WriteLine("  0. Back");
                var action = InputHelper.ReadInt("Choose: ", 0, 3);

                if (action == 0) break;

                if (action == 1)
                {
                    await ShowPatientMedicalHistoryAsync(selected.PatientId, selected.PatientName);
                    continue;
                }

                if (action == 3)
                {
                    if (!InputHelper.ConfirmSelection("Confirm No-Show? (Y/N): ")) continue;
                    try
                    {
                        await apptService.MarkNoShowAsync(selected);
                        ConsoleManager.Success("Marked as No-Show.");
                    }
                    catch (DataAccessException ex)
                    {
                        Logger.Error("Mark no-show failed", ex);
                        ConsoleManager.Error("We couldn't update this appointment. Please try again.");
                    }
                    ConsoleManager.Pause();
                    return;
                }

                // Action 2 - Mark Completed
                try
                {
                    var canCompleteTq = selected.AppointmentDate.Date < DateTime.Today ||
                                        (selected.AppointmentDate.Date == DateTime.Today && selected.StartTime <= DateTime.Now.TimeOfDay);
                    if (!canCompleteTq)
                    {
                        ConsoleManager.Line();
                        ConsoleManager.Warning("This appointment hasn't started yet.");
                        if (!InputHelper.ConfirmSelection("Complete before start time? (Y/N): ")) continue;
                    }

                    ConsoleManager.Clear();
                    ConsoleManager.Header("Clinical Details", "Dashboard > Today Queue > Complete");
                    ConsoleManager.RenderNavBar();
                    Console.WriteLine($"  {"Patient",-11}: {selected.PatientName}");
                    Console.WriteLine($"  {"Date",-11}: {selected.AppointmentDate:dd-MMM-yyyy}");
                    ConsoleManager.Line();
                    var diagnosis = InputHelper.ReadRequired("Primary diagnosis: ");
                    var notes = InputHelper.ReadRequired("Treatment details: ");

                    var prescriptions = new List<PrescriptionDto>();
                    if (InputHelper.ConfirmSelection("Add prescriptions? (Y/N): "))
                    {
                        while (true)
                        {
                            ConsoleManager.Line();
                            var medName = InputHelper.ReadRequired("  Medicine name: ");
                            var dosage = InputHelper.ReadRequired("  Dosage (e.g. 500mg): ");
                            var freq = InputHelper.ReadRequired("  Frequency (e.g. 3 times daily): ");
                            var days = InputHelper.ReadInt("  Duration (days): ", 1, 365);
                            var instr = InputHelper.ReadRequired("  Instructions (e.g. After food): ");
                            prescriptions.Add(new PrescriptionDto
                            {
                                MedicineName = medName,
                                Dosage = dosage,
                                Frequency = freq,
                                DurationDays = days,
                                Instructions = instr
                            });
                            if (!InputHelper.ConfirmSelection("Add another medicine? (Y/N): ")) break;
                        }
                    }

                    if (!InputHelper.ConfirmSelection("Save all? (Y/N): ")) continue;

                    try
                    {
                        var historyId = prescriptions.Count > 0
                            ? await apptService.CompleteWithPrescriptionsAsync(selected, diagnosis, notes, prescriptions)
                            : await apptService.CompleteAsync(selected, diagnosis, notes);
                        ConsoleManager.Success("Appointment completed.");
                    }
                    catch (DataAccessException ex)
                    {
                        Logger.Error("Appointment completion failed", ex);
                        ConsoleManager.Error("We couldn't complete this appointment. Please try again.");
                    }
                    ConsoleManager.Pause();
                    return;
                }
                catch (MenuBackException) { continue; }
                catch (MainMenuException) { return; }
            }
        }
    }

    private async Task ShowPatientMedicalHistoryAsync(int patientId, string patientName)
    {
        var historyService = new MedicalHistoryService(new MedicalHistoryRepository(_factory));
        var records = await historyService.GetPatientHistoryAsync(patientId);

        ConsoleManager.Clear();
        ConsoleManager.Header("Medical History", $"Today Queue > {patientName} > History");
        ConsoleManager.RenderNavBar();
        ConsoleManager.Line();

        if (!records.Any())
        {
            ConsoleManager.Info("No past medical history is available for this patient.");
            ConsoleManager.Pause();
            return;
        }

        var grouped = records.GroupBy(r => r.HistoryId).ToList();
        ConsoleManager.PrintPagedTable(
            new[] { "S.No", "Date", "Case ID", "Doctor", "Diagnosis" },
            grouped.Select((g, i) =>
            {
                var r = g.First();
                return new[] { (i + 1).ToString(), r.AppointmentDate.ToString("dd-MMM-yyyy"), $"HISTORY-{r.HistoryId:D4}", r.DoctorName, r.Diagnosis };
            }).ToList(),
            8);

        var c = InputHelper.ReadInt("Choose case to view (0 to back): ", 0, grouped.Count);
        if (c == 0) return;
        var group = grouped[c - 1].ToList();
        var item = group.First();

        ConsoleManager.Clear();
        ConsoleManager.Header("Clinical Visit Details", $"Today Queue > {patientName} > History > Details");
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
        if (!meds.Any())
            Console.WriteLine("  - No prescriptions added yet.");
        else
        {
            for (var i = 0; i < meds.Count; i++)
            {
                var p = meds[i];
                Console.WriteLine($"  {i + 1}. {p.MedicineName} {p.Dosage} - {p.Frequency} x {p.DurationDays} days. {p.Instructions}");
            }
        }
        ConsoleManager.Pause();
    }

    private async Task ShowMyNotificationsAsync()
    {
        var repo = new NotificationRepository(_factory);
        var notifications = await repo.GetByDoctorIdAsync(_user.DoctorId!.Value);
        ConsoleManager.Clear();
        ConsoleManager.Header("Notifications", "Dashboard > Notifications");
        ConsoleManager.RenderNavBar();
        ConsoleManager.Line();
        if (!notifications.Any())
        {
            ConsoleManager.Info("You don't have any notifications yet.");
            ConsoleManager.Pause();
            return;
        }

        ConsoleManager.PrintPagedTable(
            new[] { "S.No", "Date/Time", "Source", "Patient UHID", "Category", "Details" },
            notifications.Select((n, i) =>
            {
                var timeStr = n.StartTime.HasValue ? DateTime.Today.Add(n.StartTime.Value).ToString("hh:mm tt") : "-";
                var details = $"{n.Message} | {n.AppointmentDate:dd-MMM-yyyy} at {timeStr}";
                return new[]
                {
                    (i + 1).ToString(),
                    n.SentDate?.ToString("dd-MMM-yyyy hh:mm tt") ?? "-",
                    n.NotificationType,
                    n.UHID,
                    n.Status,
                    details
                };
            }).ToList());

        if (notifications.Count <= 10)
            ConsoleManager.Pause();
    }

    private async Task ShowMyProfileAsync()
    {
        var svc = new DoctorService(new DoctorRepository(_factory));
        var doctor = await svc.GetDoctorAsync(_user.DoctorId!.Value);
        if (doctor == null)
        {
            ConsoleManager.Error("We couldn't find your profile.");
            ConsoleManager.Pause();
            return;
        }
        ConsoleManager.Clear();
        ConsoleManager.Header("My Profile", $"{_user.DisplayName} > Profile");
        ConsoleManager.RenderNavBar();
        ConsoleManager.Line();
        ConsoleManager.PrintMetricCards(
            ("Doctor Code", doctor.DoctorCode),
            ("Full Name", doctor.DoctorName),
            ("Department", doctor.DepartmentName),
            ("Qualification", doctor.Qualification),
            ("Experience", $"{doctor.ExperienceYears} years"),
            ("Email", doctor.Email),
            ("Phone", doctor.Phone),
            ("Profile Status", doctor.IsActive ? "ACTIVE" : "INACTIVE"));
        ConsoleManager.Pause();
    }

    private async Task ConfigureDayAsync(SlotService slotService, int cursorDay)
    {
        var date = DateTime.Today.AddDays(cursorDay);
        if (date.Date < DateTime.Today)
        {
            ConsoleManager.Warning("Cannot configure past days.");
            ConsoleManager.Pause();
            return;
        }

        ConsoleManager.Clear();
        ConsoleManager.Header($"Configure Day - {date:ddd dd-MMM-yyyy}", "Dashboard > Configure Day");
        ConsoleManager.RenderNavBar();
        Console.WriteLine("  Define breaks, lunch, duration, and 5 slots for this day.");
        ConsoleManager.Line();

        var input = await DoctorMenu.GetScheduleInputAsync();
        if (input == null) return;

        ConsoleManager.Clear();
        ConsoleManager.Header($"Preview - {date:ddd dd-MMM-yyyy}", "Dashboard > Configure Day > Preview");
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
        AnsiConsole.MarkupLine($"  This pattern will be applied for: [bold white]{date:dd-MMM-yyyy}[/]");
        ConsoleManager.Line();

        if (!InputHelper.ConfirmSelection("Save this day's availability? (Y/N): ")) return;

        var total = await slotService.SetDayCustomSlotsAsync(_user.DoctorId!.Value, date, input.SlotTimes, input.DurationMinutes);
        ConsoleManager.Success($"Day saved for {date:dd-MMM-yyyy}.");
        ConsoleManager.Line();
        AnsiConsole.MarkupLine("  [grey]Tip: Use arrow keys to navigate and Enter to toggle individual slots.[/]");
        ConsoleManager.Pause();
    }

    private bool Logout()
    {
        if (!InputHelper.ConfirmSelection(" Logout?")) return false;
        ConsoleManager.Clear();
        ConsoleManager.Header("Logged Out", "Dashboard > Logout");
        ConsoleManager.Info("You have been signed out. Returning to the main menu.");
        ConsoleManager.Pause();
        return true;
    }

    private static string FormatTime(TimeSpan time) => DateTime.Today.Add(time).ToString("hh:mm tt");
}
