namespace HospitalManagementSystem.Shared.Utilities;

public static class DateTimeValidationHelper
{
    /// <returns>An empty string if valid, or an error message describing the problem.</returns>
    public static string ValidateAppointmentDate(DateTime date, TimeSpan time)
    {
        if (date.Date < DateTime.Today)
            return "Appointments cannot be booked in the past. Please select today or a future date.";

        if (date.Date == DateTime.Today && time <= DateTime.Now.TimeOfDay)
            return "For today's appointments, the time must be later than the current time.";

        return string.Empty;
    }

    /// <returns>An empty string if valid, or an error message describing the problem.</returns>
    public static string ValidateShiftTimes(TimeSpan start, TimeSpan end)
    {
        if (end <= start)
            return "Overnight shifts are not allowed. End time must be later than start time on the same day.";

        return string.Empty;
    }

    /// <returns>An empty string if valid, or an error message describing the problem.</returns>
    public static string ValidateBreakTimes(TimeSpan breakStart, TimeSpan breakEnd, TimeSpan shiftStart, TimeSpan shiftEnd)
    {
        if (breakEnd <= breakStart)
            return "Break end time must be later than break start time.";

        if (breakStart < shiftStart)
            return "Break start time cannot be earlier than shift start time.";

        if (breakEnd > shiftEnd)
            return "Break end time cannot be later than shift end time.";

        return string.Empty;
    }

    public static bool IsFutureDateTime(DateTime date, TimeSpan time) =>
        date.Date + time > DateTime.Now;

    public static bool IsTodayOrFuture(DateTime date) =>
        date.Date >= DateTime.Today;
}
