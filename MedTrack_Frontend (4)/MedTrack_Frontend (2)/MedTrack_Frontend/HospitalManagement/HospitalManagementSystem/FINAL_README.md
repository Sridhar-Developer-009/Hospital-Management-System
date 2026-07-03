# Hospital Management System — Console Application (Final Build)

## Overview

Enterprise-grade Hospital Management System (HMS) console application built with **.NET 10 + Spectre.Console**.  
Connects to **SQL Server** via ADO.NET stored procedures. Three role-based dashboards: **Admin**, **Doctor**, **Patient**.

---

## Authentication Details (Demo Credentials)

| Role    | Username     | Password    | Dashboard |
|---------|-------------|-------------|-----------|
| Admin   | `admin_root`| `Admin@123` | System administration, doctor/patient management, reports, notifications |
| Doctor  | `dr_arvind` | `Doctor@123`| Weekly availability matrix, today's queue, clinical workflow |
| Patient | `sridhar_v` | `Patient@123`| Book/cancel/reschedule appointments, medical history, profile |

---

## Quick Start

### 1. Database Setup
Run the SQL package (`HMS_SQL_PACKAGE`) in **SSMS** first. This creates tables, views, and stored procedures.

### 2. Connection String
Set environment variable:
```
HMS_CONNECTION_STRING=Server=YOUR_SERVER;Database=HMS_DB;Trusted_Connection=True;TrustServerCertificate=True;
```
Or edit `Shared/Constants/ApplicationConstants.cs`.

### 3. Run
```bash
cd HospitalManagementSystem
dotnet restore
dotnet build
dotnet run
```

---

## Architecture

### Layers
```
┌─────────────────────────────────────────┐
│          Console UI (Spectre.Console)    │
│  Dashboards / Menus / Input Helpers     │
├─────────────────────────────────────────┤
│          Application Services           │
│  Authentication / Booking / Scheduling  │
├─────────────────────────────────────────┤
│          Repositories (ADO.NET)         │
│  Stored Procedure Calls / Data Access   │
├─────────────────────────────────────────┤
│          SQL Server Database            │
│  Tables / Views / Stored Procedures     │
└─────────────────────────────────────────┘
```

### Project Structure
```
HospitalManagementSystem/
├── Program.cs                          # Entry point
├── Shared/                             # Cross-cutting utilities
│   ├── Utilities/
│   │   ├── ConsoleManager.cs           # UI rendering (Header, NAV bar, tables, layout)
│   │   ├── InputHelper.cs              # Input validation, menu selection, navigation
│   │   ├── SecurePasswordReader.cs     # Masked password input
│   │   ├── ValidationRules.cs          # Regex/format rules
│   │   └── StartupAnimationService.cs  # Splash screen animation
│   ├── Exceptions/                     # MenuBackException, MainMenuException, etc.
│   ├── Constants/                      # ApplicationConstants, ValidationRules
│   ├── Models/                         # DataRows (SlotRow, AppointmentRow, etc.)
│   └── Services/                       # DashboardService, DemoPasswordSeeder
├── UserManagement/                     # Login, authentication
│   ├── Menus/LoginMenu.cs
│   ├── Services/AuthenticationService.cs
│   ├── Repositories/UserRepository.cs
│   └── DTOs/LoginResponse.cs
├── Dashboards/                         # Role-specific dashboards
│   ├── AdminDashboard.cs               # Metrics, doctor/patient/appointment management
│   ├── DoctorDashboard.cs              # Weekly matrix, today's queue, profile
│   └── PatientDashboard.cs             # Bookings, history, profile
├── DoctorManagement/                   # Doctor CRUD, schedules, leave
│   └── Menus/DoctorMenu.cs
├── PatientManagement/                  # Patient registration, directory
│   └── Menus/PatientMenu.cs
├── AppointmentManagement/              # Booking, slots, history, holidays
│   ├── Menus/AppointmentMenu.cs
│   ├── Services/ (SlotService, AppointmentService, etc.)
│   └── Repositories/ (SlotRepository, AppointmentRepository, etc.)
├── NotificationManagement/             # Notification logs
├── ReportManagement/                   # Operational reports (text/CSV export)
│   └── Menus/ReportMenu.cs
├── Database/                           # Connection factory, helpers
└── AuditManagement/                    # Audit logging
```

---

## Navigation System

| Key | Action |
|-----|--------|
| `0` | Back (one level up) |
| `#` | Home (current role dashboard) |
| `↑↓` | Move selection in menus and lists |
| `Enter` | Confirm selection |
| `Y` / `N` | Confirm / Decline prompts |

---

## Admin Flow

1. Login as `admin_root` / `Admin@123`
2. Dashboard shows 7 metric cards (departments, doctors, patients, appointments)
3. Menu:
   - **Doctor Management** — Register, view, modify, deactivate doctors; view slots
   - **Patient Management** — View patient directory, search by UHID/phone
   - **Appointment Management** — View all, search by number, filter by date/status, declare holiday
   - **Notification Management** — View logs, send test/patient notifications
   - **Operational Reports** — Generate appointment/utilisation/no-show reports (text/CSV export)
4. Logout returns to role selection

---

## Doctor Flow

1. Login as `dr_arvind` / `Doctor@123`
2. Weekly availability matrix as primary view (arrow-key navigable)
3. Action bar shortcuts:
   - `S` — Set Weekly Availability (breaks + 5 slot times)
   - `D` — Configure Day
   - `T` — Today's Queue (view/manage appointments)
   - `N` — Notifications
   - `P` — Profile
   - `Q` — Logout
4. Cell interactions:
   - **Enter** on future Available/Blocked slots → toggle status
   - **Enter** on Booked slots → Complete / No-Show with diagnosis + prescriptions
5. Leave management via Doctor Menu sub-screen

---

## Patient Flow

1. **New user**: Register via "Register New Patient Account" (self-service)
2. **Returning**: Login as `sridhar_v` / `Patient@123`
3. Dashboard shows UHID, upcoming bookings, past visits
4. Menu:
   - **Book an Appointment** — Select department → doctor → date → slot → confirm
   - **Manage My Scheduled Appointments** — View active, reschedule, cancel
   - **View Medical History** — Past visits, diagnoses, prescriptions
   - **View My Notifications** — Notification log
   - **View My Patient Profile** — Personal details
5. Blocked slots (R) are hidden from booking; past slots are frozen

---

## Appointments — Status Lifecycle

```
Booked → Completed (diagnosis + prescriptions recorded)
       → Cancelled (slot released)
       → No-Show (marked absent)
```

- Reschedule is cancellation + fresh booking
- Holiday declaration auto-cancels all Booked appointments on that date

---

## UI Features

- **Spectre.Console** rendered panels, tables, metric cards, figlet splash screen
- **Full-width bordered headers** with breadcrumb navigation
- **NAV bar** as single source for navigation hints
- **Paged tables** with N/P/S/0 navigation
- **Input validation** with format rules and inline error messages
- **Status badges** color-coded (green=active, red=cancelled, yellow=booked, blue=completed)
- **Masked password** input via SecurePasswordReader

---

## Build & Verify

```bash
dotnet build
# Expected: Build succeeded. 0 errors.
```

If `bin` is locked by a running instance:
```bash
taskkill /f /im HospitalManagementSystem.exe
dotnet build
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `Program.cs` | Entry point, initializes DB and launches login menu |
| `Shared/Utilities/ConsoleManager.cs` | All UI rendering primitives |
| `Shared/Utilities/InputHelper.cs` | Input reading, validation, menu system |
| `UserManagement/Menus/LoginMenu.cs` | Role selection, authentication flow |
| `Dashboards/AdminDashboard.cs` | Admin main loop and sub-screens |
| `Dashboards/DoctorDashboard.cs` | Doctor matrix UI and clinical actions |
| `Dashboards/PatientDashboard.cs` | Patient dashboard and menu routing |
| `DoctorManagement/Menus/DoctorMenu.cs` | Doctor CRUD, schedule, leave |
| `AppointmentManagement/Menus/AppointmentMenu.cs` | Booking, oversight, history, holidays |
| `PatientManagement/Menus/PatientMenu.cs` | Registration, directory, profile |
| `ReportManagement/Menus/ReportMenu.cs` | Operational report generation |

---

## Exception Handling

All user input is guarded:
- `MenuBackException` (0) → silent return to previous screen
- `MainMenuException` (#) → return to role dashboard
- Invalid input → inline warning, re-prompt
- Database errors → friendly message + log file
- Authentication failures → "Invalid credentials" (no detail leakage)

---

## Future Scope (Not in Current Build)

- Receptionist role / walk-in booking
- Tele-consultation module
- Payment / revenue tracking
- Real email/SMS notification delivery
- OTP / forgot password flow
- Browser / mobile deployment
- Backup / recovery automation

---

*Built with .NET 10 · ADO.NET · SQL Server · Spectre.Console*
