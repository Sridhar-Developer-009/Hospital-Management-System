using HospitalManagementSystem.Shared.Exceptions;
using Spectre.Console;
using Spectre.Console.Rendering;

namespace HospitalManagementSystem.Shared.Utilities;

public static class ConsoleManager
{
    public static int PageWidth
    {
        get
        {
            var width = AnsiConsole.Profile.Width;
            if (!Console.IsOutputRedirected)
            {
                width = Math.Min(width, Console.WindowWidth);
            }

            return Math.Max(width - 1, 72);
        }
    }
    private static int InnerWidth => PageWidth - 2;
    public const string Accent = "deepskyblue1";
    public const string Muted = "grey50";

    public static void Initialize()
    {
        Console.Title = "Hospital Management System";
        try
        {
            Console.OutputEncoding = System.Text.Encoding.UTF8;
            Console.BackgroundColor = ConsoleColor.Black;
            Console.ForegroundColor = ConsoleColor.Gray;

            if (!Console.IsOutputRedirected && OperatingSystem.IsWindows())
            {
                Console.BufferWidth = Math.Max(Console.BufferWidth, Console.WindowWidth);
                Console.BufferHeight = Math.Max(Console.BufferHeight, Console.WindowHeight + 300);
            }
        }
        catch { }
    }

    public static void Clear()
    {
        Console.BackgroundColor = ConsoleColor.Black;
        Console.ForegroundColor = ConsoleColor.Gray;
        try { AnsiConsole.Clear(); }
        catch { try { Console.Clear(); } catch { } }
    }

    public static void ShowSplash()
    {
        Clear();

        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine("============================================================");
        Console.WriteLine("                 HOSPITAL MANAGEMENT SYSTEM                 ");
        Console.WriteLine("============================================================");
        Console.ResetColor();
        Console.WriteLine();
        Console.WriteLine("Console Application");
        Console.WriteLine("Secure - Reliable - Efficient");
        Console.WriteLine();
        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine("Care team workspace ready");
        Console.WriteLine("Patient access ready");
        Console.WriteLine("Appointments ready");
        Console.WriteLine("Notifications ready");
        Console.ResetColor();
        Console.WriteLine();
        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.Write("Press Enter to continue...");
        Console.ResetColor();
        if (!Console.IsInputRedirected)
        {
            Console.ReadLine();
        }
    }

    public static T ShowSelectionPrompt<T>(string title, params T[] options) where T : notnull
    {
        Console.WriteLine();
        var result = AnsiConsole.Prompt(
            new SelectionPrompt<T>()
                .Title($"  [bold {Accent}]{Markup.Escape(title)}[/]")
                .PageSize(15)
                .HighlightStyle(new Style(Color.White, new Color(0, 100, 100), Decoration.Bold))
                .AddChoices(options));
        Console.WriteLine();
        return result;
    }

    public static void Header(string title, string? breadcrumb = null)
    {
        Panel panel;
        if (string.IsNullOrWhiteSpace(breadcrumb))
        {
            panel = new Panel(
                    new Markup($"[bold white]  {Markup.Escape(title.Trim())}[/]"))
                .Border(BoxBorder.Double)
                .BorderColor(Color.Cyan1)
                .Padding(1, 0);
        }
        else
        {
            panel = new Panel(new Rows(
                    new Markup($"  [bold cyan on black] {Markup.Escape(breadcrumb)} [/]"),
                    new Text(string.Empty),
                    new Markup($"[bold white]  {Markup.Escape(title.Trim())}[/]")))
                .Border(BoxBorder.Double)
                .BorderColor(Color.Cyan1)
                .Padding(1, 0);
        }
        panel.Width = PageWidth;
        AnsiConsole.Write(panel);
        Console.WriteLine();
    }

    // ============== FULL-SCREEN BORDER HELPERS ==============
    // Width is derived from terminal Profile.Width at runtime.
    private static int FullBorderWidth => PageWidth - 2;
    private const string FullBorderAccent = "deepskyblue1";

    public static void BeginScreen()
    {
        AnsiConsole.MarkupLine($"[{FullBorderAccent}]+{new string('-', FullBorderWidth)}+[/]");
    }

    public static void EndScreen()
    {
        AnsiConsole.MarkupLine($"[{FullBorderAccent}]+{new string('-', FullBorderWidth)}+[/]");
    }

    public static void ScreenDivider()
    {
        AnsiConsole.MarkupLine($"[{FullBorderAccent}]+{new string('-', FullBorderWidth)}+[/]");
    }

    public static void Line()
    {
        Console.WriteLine();
        AnsiConsole.MarkupLine($"  [{Muted}]{new string('-', InnerWidth)}[/]");
        Console.WriteLine();
    }

    public static void Pause(string message = "Press [Enter] to continue...")
    {
        Console.WriteLine();
        AnsiConsole.Markup($"[orange1]  {Markup.Escape(message)}[/]");
        Console.ReadLine();
    }

    public static void Success(string message)
    {
        WriteStatus("DONE", message, "green1");
    }

    public static void Error(string message)
    {
        WriteStatus("ERROR", message, "red1");
    }

    public static void Warning(string message)
    {
        WriteStatus("NOTICE", message, "yellow1");
    }

    public static void Info(string message)
    {
        WriteStatus("INFO", message, Accent);
    }

    public static void Prompt(string prompt)
    {
        Console.WriteLine();
        AnsiConsole.Markup($"[bold {Accent}]  > [/][white]{Markup.Escape(prompt.TrimStart())}[/]");
    }

    public static void InputGuide(string rules)
    {
        Console.WriteLine();
        AnsiConsole.MarkupLine($"  [black on {Accent} bold] RULES [/]   [{Muted}]{Markup.Escape(rules)}[/]");
    }

    private static void WriteStatus(string label, string message, string color)
    {
        AnsiConsole.MarkupLine($"  [black on {color} bold] {label.PadRight(9)} [/] [white]{Markup.Escape(message)}[/]");
    }

    public static void RenderNavBar(string? extraHelp = null)
    {
        Console.WriteLine();
        var help = extraHelp != null ? $" | {extraHelp}" : "";
        AnsiConsole.MarkupLine($"  [black on orange1 bold] NAV [/] [{Muted}]Press[/] [bold white]0[/] [{Muted}]Back |[/] [bold white]#[/] [{Muted}]Home | Use arrow keys to navigate{help}[/]");
    }

    public static async Task RunActionAsync(Func<Task> action)
    {
        try
        {
            await action();
        }
        catch (MenuBackException)
        {
            // Back navigation requested by user. Return to caller menu silently.
        }
        catch (MainMenuException)
        {
            throw;
        }
        catch (Exception ex)
        {
            Error(GetFriendlyErrorMessage(ex));
            Pause();
        }
    }

    public static void PrintTable(string[] headers, IEnumerable<string[]> rows)
    {
        var table = new Table()
            .Border(TableBorder.Square)
            .BorderColor(Color.Grey50)
            .Width(PageWidth);

        foreach (var header in headers)
        {
            var col = new TableColumn($"[bold {Accent}]{Markup.Escape(header)}[/]");
            var h = header.Trim().ToUpperInvariant();
            if (h is "S.NO" or "S.No" or "#")
                col.Width(5);
            else if (h is "DATE/TIME" or "DATETIME")
                col.Width(20);
            else if (h is "FROM" or "TO" or "UHID")
                col.Width(12);
            else if (h is "STATUS" or "STATE" or "RESULT" or "ACCOUNT STATUS" or "CURRENT STATUS")
                col.Width(12);
            table.AddColumn(col);
        }

        var rowIndex = 0;
        foreach (var row in rows)
        {
            var style = rowIndex++ % 2 == 0 ? "white" : "grey85";
            table.AddRow(row.Select((cell, idx) =>
            {
                var escaped = Markup.Escape(cell ?? string.Empty);
                if (idx < headers.Length && IsStatusHeader(headers[idx]))
                {
                    return Align.Center(new Markup(FormatStatusBadge(escaped)));
                }
                return (IRenderable)new Markup($"[{style}]{escaped}[/]");
            }).ToArray());
        }

        AnsiConsole.Write(table);
    }

    private static bool IsStatusHeader(string header)
    {
        var h = header.Trim().ToUpperInvariant();
        return h is "STATUS" or "STATE" or "RESULT" or "ACCOUNT STATUS" or "CURRENT STATUS";
    }

    public static string FormatStatusBadge(string value)
    {
        var v = value.Trim().ToUpperInvariant();
        return v switch
        {
            "RECEIVED" or "READ"
                => "[black on green1 bold] RECEIVED [/]",
            "SENT"
                => "[black on green1 bold] SENT [/]",
            "AVAILABLE" or "ACTIVE" or "PASS" or "SUCCESS" or "OK"
                => "[black on green1 bold] AVAILABLE [/]",
            "BOOKED" or "SCHEDULED" or "PENDING" or "PENDING_APPROVAL" or "PENDING APPROVAL" or "READY"
                => "[black on cyan1 bold] BOOKED [/]",
            "COMPLETED" or "DONE"
                => "[black on deepskyblue1 bold] COMPLETED [/]",
            "CANCELLED" or "CANCELED" or "FAILED" or "REJECTED"
                => "[black on red1 bold] CANCELLED [/]",
            "NOSHOW" or "NO-SHOW" or "NO SHOW" or "INACTIVE"
                => "[black on yellow1 bold] NOSHOW [/]",
            _ => $"[bold white]{value}[/]"
        };
    }

    public static void PrintPagedTable(string[] headers, IReadOnlyList<string[]> rows, int pageSize = 10)
    {
        if (rows.Count == 0)
        {
            Warning("No information is available for this view.");
            return;
        }

        var totalPages = (int)Math.Ceiling(rows.Count / (double)pageSize);

        if (totalPages <= 1)
        {
            PrintTable(headers, rows);
            AnsiConsole.MarkupLine($"  [{Muted}]Showing {rows.Count} item(s)[/]");
            return;
        }

        var page = 0;
        while (true)
        {
            var pageRows = rows.Skip(page * pageSize).Take(pageSize).ToList();
            AnsiConsole.Clear();
            PrintTable(headers, pageRows);
            AnsiConsole.MarkupLine($"  [{Muted}]Page[/] [bold white]{page + 1}[/][{Muted}] of[/] [bold white]{totalPages}[/] [{Muted}]| Showing {page * pageSize + 1}-{page * pageSize + pageRows.Count} of {rows.Count}[/]");

            var navParts = new List<string>();
            if (page < totalPages - 1) navParts.Add("N next");
            if (page > 0) navParts.Add("P previous");
            var nav = navParts.Count > 0 ? string.Join(", ", navParts) + ", " : "";
            AnsiConsole.Markup($"  [black on {Accent} bold] PAGE [/] [{Muted}]{nav}S search, 0 back:[/] ");

            var input = Console.ReadLine()?.Trim().ToUpperInvariant();

            if (string.IsNullOrWhiteSpace(input))
            {
                Warning("Input cannot be blank. Please enter a valid option.");
                continue;
            }

            if (input == "0") return;

            if (input == "N")
            {
                if (page < totalPages - 1) { page++; continue; }
                Warning("Already on the last page.");
                continue;
            }

            if (input == "P")
            {
                if (page > 0) { page--; continue; }
                Warning("Already on the first page.");
                continue;
            }

            if (input == "S")
            {
                Info("Search is available from the parent menu for this listing.");
                continue;
            }

            Warning("Invalid page command. Use N, P, S, or 0.");
        }
    }

    public static void PrintMetricCards(params (string Label, string Value)[] metrics)
    {
        if (metrics.Length == 0)
        {
            return;
        }

        var columnCount = PageWidth switch
        {
            >= 140 => 4,
            >= 105 => 3,
            >= 82 => 2,
            _ => 1
        };

        var table = new Table()
            .Border(TableBorder.None)
            .HideHeaders()
            .Width(PageWidth)
            .Expand();

        for (var i = 0; i < columnCount; i++)
        {
            table.AddColumn(new TableColumn(string.Empty).PadRight(1));
        }

        var palette = new[]
        {
            Color.DeepSkyBlue1,
            Color.Green1,
            Color.Yellow1,
            Color.Orange1,
            Color.MediumPurple1,
            Color.Cyan1,
            Color.Red1,
            Color.Grey70
        };

        var panels = metrics.Select((metric, index) =>
        {
            var label = CompactMetricLabel(metric.Label);
            return new Panel(
                    Align.Center(
                        new Rows(
                            new Markup($"[bold white]{Markup.Escape(metric.Value)}[/]"),
                            new Markup($"[{Muted}]{Markup.Escape(label)}[/]"))))
                .Border(BoxBorder.Rounded)
                .BorderColor(palette[index % palette.Length])
                .Padding(1, 0);
        }).ToList();

        for (var i = 0; i < panels.Count; i += columnCount)
        {
            var cells = Enumerable.Range(0, columnCount)
                .Select(offset => i + offset < panels.Count ? (IRenderable)panels[i + offset] : new Text(string.Empty))
                .ToArray();
            table.AddRow(cells);
        }

        AnsiConsole.Write(table);
    }

    private static string CompactMetricLabel(string label)
    {
        return label
            .Replace("Appointments", "Appts", StringComparison.OrdinalIgnoreCase)
            .Replace("Registered", "Reg.", StringComparison.OrdinalIgnoreCase)
            .Replace("Total Active", "Active", StringComparison.OrdinalIgnoreCase);
    }

    public static async Task<T> WithStatusAsync<T>(string message, Func<Task<T>> operation)
    {
        return await AnsiConsole.Status()
            .Spinner(Spinner.Known.Dots)
            .SpinnerStyle(Style.Parse(Accent))
            .StartAsync(message, _ => operation());
    }

    public static async Task WithStatusAsync(string message, Func<Task> operation)
    {
        await AnsiConsole.Status()
            .Spinner(Spinner.Known.Dots)
            .SpinnerStyle(Style.Parse(Accent))
            .StartAsync(message, async _ => await operation());
    }

    private static string GetFriendlyErrorMessage(Exception ex)
    {
        var message = ex.GetBaseException().Message;
        if (message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase) ||
            message.Contains("duplicate", StringComparison.OrdinalIgnoreCase))
        {
            return "This information already exists. Please use a different value.";
        }

        if (message.Contains("connection", StringComparison.OrdinalIgnoreCase) ||
            message.Contains("network", StringComparison.OrdinalIgnoreCase))
        {
            return "Unable to connect right now. Please try again later.";
        }

        Logger.Error("Unhandled operation error", ex);
        return "We couldn't complete your request. Please check your information and try again.";
    }

    private static string Center(string value, int width)
    {
        if (value.Length >= width) return value[..width];
        var left = (width - value.Length) / 2;
        var right = width - value.Length - left;
        return new string(' ', left) + value + new string(' ', right);
    }
}
