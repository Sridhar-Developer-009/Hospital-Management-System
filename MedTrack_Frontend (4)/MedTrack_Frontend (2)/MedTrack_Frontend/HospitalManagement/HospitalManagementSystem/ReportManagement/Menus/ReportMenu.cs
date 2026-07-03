using System.Text;
using HospitalManagementSystem.Database.Connection;
using HospitalManagementSystem.Database.StoredProcedures;
using HospitalManagementSystem.ReportManagement.Services;
using HospitalManagementSystem.Shared.Utilities;
using Spectre.Console;

namespace HospitalManagementSystem.ReportManagement.Menus;

public class ReportMenu
{
    private readonly ReportService _service;
    public ReportMenu(DbConnectionFactory factory) => _service = new ReportService(factory);

    public async Task ShowAsync()
    {
        while (true)
        {
            ConsoleManager.Clear();
            ConsoleManager.Header("Operational Reports", "Dashboard > Reports");
            Console.WriteLine("  Historical dates are supported. Use any valid past or current date in DD-MM-YYYY format.");
            ConsoleManager.Line();
            Console.WriteLine();
            var choice = InputHelper.SelectFromMenu("Select Report:",
                "Appointment Summary Report",
                "Doctor Availability & Utilisation Report",
                "Patient No-Show Analytics Report",
                "Department-Wise Appointment Report",
                "Back");
            if (choice == "Back") return;

            await ConsoleManager.RunActionAsync(async () =>
            {
                var from = InputHelper.ReadDate("From date: ");
                var to = choice == "Appointment Summary Report" ? from : InputHelper.ReadDate("To date: ");
                if (to < from)
                {
                    ConsoleManager.Warning("To date cannot be earlier than from date.");
                    ConsoleManager.Pause();
                    return;
                }

                var (sp, prefix, title) = choice switch
                {
                    "Appointment Summary Report" => (StoredProcedureNames.DailyAppointmentReport, "DailyAppointments", "Appointment Summary Report"),
                    "Doctor Availability & Utilisation Report" => (StoredProcedureNames.DoctorWiseAppointmentReport, "DoctorUtilization", "Doctor Availability & Utilisation Report"),
                    "Patient No-Show Analytics Report" => (StoredProcedureNames.NoShowAppointmentReport, "NoShowAnalytics", "Patient No-Show Analytics Report"),
                    "Department-Wise Appointment Report" => (StoredProcedureNames.DepartmentWiseAppointmentReport, "DepartmentAppointments", "Department-Wise Appointment Report"),
                    _ => (StoredProcedureNames.DailyAppointmentReport, "Report", "Report")
                };

                var start = DateTime.Now;
                var result = await _service.ExecuteReportAsync(sp, from, to);

                // Filter to essential columns only
                var filtered = FilterColumns(result.Headers, result.Rows, choice);
                var headers = filtered.Headers;
                var rows = filtered.Rows;

                ConsoleManager.Clear();
                ConsoleManager.Header("Report Generated", "Dashboard > Reports > Result");
                ConsoleManager.RenderNavBar();
                ConsoleManager.Line();

                if (!rows.Any())
                {
                    ConsoleManager.Info("No data found for the selected date range.");
                    ConsoleManager.Pause();
                    return;
                }

                Console.WriteLine();
                var fmt = InputHelper.SelectFromMenu("Select export format:",
                    "Text  (.txt)  - aligned columns, human-readable",
                    "CSV   (.csv)  - comma-separated, opens in Excel",
                    "Both           - generate both files",
                    "Cancel export");
                if (fmt == "Cancel export")
                {
                    ConsoleManager.Info("Export cancelled.");
                    ConsoleManager.Pause();
                    return;
                }

                var stamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
                var baseName = $"{prefix}_{stamp}";
                var outDir = Path.GetFullPath(".");
                var written = new List<string>();
                var friendlyHeaders = headers.Select(MakeFriendly).ToArray();

                if (fmt == "Text  (.txt)  - aligned columns, human-readable" || fmt == "Both           - generate both files")
                {
                    var txtPath = Path.Combine(outDir, $"{baseName}.txt");
                    ExportTxt(txtPath, title, from, to, friendlyHeaders, rows);
                    written.Add(txtPath);
                }
                if (fmt == "CSV   (.csv)  - comma-separated, opens in Excel" || fmt == "Both           - generate both files")
                {
                    var csvPath = Path.Combine(outDir, $"{baseName}.csv");
                    ExportCsv(csvPath, title, from, to, friendlyHeaders, rows);
                    written.Add(csvPath);
                }

                var elapsed = DateTime.Now - start;

                var metaLines = new List<string>
                {
                    $"  [bold]Date Range[/]      : {from:dd-MMM-yyyy} to {to:dd-MMM-yyyy}",
                    $"  [bold]Items[/]           : {rows.Count:N0}",
                    $"  [bold]Prepared In[/]     : {elapsed.TotalSeconds:0.00}s",
                    $"  [bold]Saved To[/]        : [cyan]{Markup.Escape(outDir)}[/]"
                };
                foreach (var f in written)
                {
                    var fi = new FileInfo(f);
                    metaLines.Add($"    {Markup.Escape(Path.GetFileName(f)),-50} [green]{fi.Length,8:N0} bytes[/]");
                }

                AnsiConsole.Write(
                    new Panel(string.Join("\n", metaLines))
                        .Header($"[bold green] Report Exported ({written.Count} file(s)) [/]")
                        .Border(BoxBorder.Rounded)
                        .BorderColor(Color.Green)
                        .Padding(1, 1));

                Console.WriteLine();
                Console.WriteLine("  Preview");
                ConsoleManager.PrintPagedTable(friendlyHeaders, rows, 8);

                ConsoleManager.Prompt("Press O to open output folder, any other key to continue: ");
                var openIt = Console.ReadLine()?.Trim().ToUpperInvariant();
                if (openIt == "O")
                {
                    try
                    {
                        System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                        {
                            FileName = outDir,
                            UseShellExecute = true
                        });
                    }
                    catch
                    {
                        ConsoleManager.Warning("We couldn't open the folder automatically. Please open it from the project folder.");
                    }
                }
                ConsoleManager.Pause();
            });
        }
    }

    private static readonly Dictionary<string, HashSet<string>> EssentialColumns = new()
    {
        ["Appointment Summary Report"] = new(StringComparer.OrdinalIgnoreCase) { "DepartmentName", "DoctorName", "Status", "AppointmentCount" },
        ["Doctor Availability & Utilisation Report"] = new(StringComparer.OrdinalIgnoreCase) { "DoctorName", "DepartmentName", "Status", "AppointmentCount" },
        ["Patient No-Show Analytics Report"] = new(StringComparer.OrdinalIgnoreCase) { "AppointmentNumber", "AppointmentDate", "Status", "PatientName", "DoctorName", "DepartmentName", "ReasonForVisit", "StartTime" },
        ["Department-Wise Appointment Report"] = new(StringComparer.OrdinalIgnoreCase) { "DepartmentName", "Status", "AppointmentCount" },
    };

    private static (string[] Headers, List<string[]> Rows) FilterColumns(string[] headers, List<string[]> rows, string choice)
    {
        if (!EssentialColumns.TryGetValue(choice, out var keep)) return (headers, rows);
        var indices = headers.Select((h, i) => (h, i)).Where(x => keep.Contains(x.h)).Select(x => x.i).ToArray();
        if (indices.Length == 0) return (headers, rows);
        var filteredHeaders = indices.Select(i => headers[i]).ToArray();
        var filteredRows = rows.Select(r => indices.Select(i => r[i]).ToArray()).ToList();
        return (filteredHeaders, filteredRows);
    }

    private static string MakeFriendly(string header)
    {
        if (string.IsNullOrEmpty(header)) return header;
        var sb = new StringBuilder(header.Length + 4);
        sb.Append(header[0]);
        for (int i = 1; i < header.Length; i++)
        {
            if (char.IsUpper(header[i]) && !char.IsUpper(header[i - 1]) && header[i - 1] != ' ')
                sb.Append(' ');
            sb.Append(header[i]);
        }
        return sb.ToString().Replace("Id", "ID").Replace("Uh", "UH");
    }

    private static void ExportTxt(string path, string title, DateTime from, DateTime to,
        string[] friendlyHeaders, List<string[]> rows)
    {
        var colWidths = new int[friendlyHeaders.Length];
        for (int i = 0; i < friendlyHeaders.Length; i++)
            colWidths[i] = friendlyHeaders[i].Length;
        foreach (var row in rows)
            for (int i = 0; i < row.Length && i < colWidths.Length; i++)
                if (row[i].Length > colWidths[i])
                    colWidths[i] = row[i].Length;

        var sep = "  " + string.Join("-+-", colWidths.Select(w => new string('-', w)));
        var bar = new string('=', 78);
        var thin = new string('-', 78);

        var lines = new List<string>
        {
            bar,
            $"  {title}",
            bar,
            $"  Date Range      : {from:dd-MMM-yyyy} to {to:dd-MMM-yyyy}",
            $"  Generated At    : {DateTime.Now:dd-MMM-yyyy HH:mm:ss}",
            $"  Total Items     : {rows.Count:N0}",
            bar,
            "",
            "  " + string.Join(" | ", friendlyHeaders.Select((h, i) => h.PadRight(colWidths[i]))),
            sep,
        };

        foreach (var row in rows)
        {
            lines.Add("  " + string.Join(" | ", row.Select((cell, i) =>
                i < colWidths.Length ? cell.PadRight(colWidths[i]) : cell)));
        }

        lines.Add("");
        lines.Add(thin);
        lines.Add($"  {new string(' ', 56)}Total Items: {rows.Count:N0}");
        lines.Add(bar);

        File.WriteAllLines(path, lines, Encoding.UTF8);
    }

    private static void ExportCsv(string path, string title, DateTime from, DateTime to,
        string[] friendlyHeaders, List<string[]> rows)
    {
        var meta = new List<string>
        {
            $"# Report: {title}",
            $"# Date Range: {from:dd-MMM-yyyy} to {to:dd-MMM-yyyy}",
            $"# Generated: {DateTime.Now:dd-MMM-yyyy HH:mm:ss}",
            $"# Total Items: {rows.Count:N0}",
            "#",
        };

        var data = new List<string>
        {
            string.Join(",", friendlyHeaders.Select(CsvEscape))
        };
        data.AddRange(rows.Select(r => string.Join(",", r.Select(CsvEscape))));

        File.WriteAllLines(path, meta, Encoding.UTF8);
        File.AppendAllLines(path, data, Encoding.UTF8);
    }

    private static string CsvEscape(string value)
    {
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n') || value.Contains('\r'))
            return "\"" + value.Replace("\"", "\"\"") + "\"";
        return value;
    }
}
