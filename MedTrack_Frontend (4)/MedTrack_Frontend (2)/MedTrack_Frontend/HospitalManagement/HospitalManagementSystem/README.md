# Hospital Management System Console Application

## What is fixed in this version
- Root navigation loops correctly.
- Admin, Doctor and Patient dashboards are DB-driven.
- Login uses `usp_Login` and BCrypt verification.
- Demo placeholder hashes are automatically replaced on startup for demo users.
- Repositories call stored procedures/views from the SQL package.
- Patient registration, doctor management, slot generation, booking, cancellation, doctor queue completion, patient history and reports are wired.

## Demo credentials
- Admin: `admin_root` / `Admin@123`
- Doctor: `dr_arvind` / `Doctor@123`
- Patient: `sridhar_v` / `Patient@123`

## Connection string
Set environment variable `HMS_CONNECTION_STRING`, or edit `Shared/Constants/ApplicationConstants.cs`.

Example:
`Server=YOUR_SERVER;Database=HMS_DB;Trusted_Connection=True;TrustServerCertificate=True;`

## Run
```bash
dotnet restore
dotnet build
dotnet run
```

## Important
Run the SQL package first in SSMS. This console project expects the tables, views and stored procedures from `HMS_SQL_PACKAGE`.
