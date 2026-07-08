# Smoke Test Report

> **Date**: 26-Jun-2026  
> **Tester**: QA Automation  
> **Build**: `dotnet build HospitalManagementSystem.slnx` — **PASSED** (0 warnings, 0 errors)

## Smoke Test Results

| # | Check | Result | Notes |
|---|---|---|---|
| 1 | Build succeeds | ✓ PASS | 0 warnings, 0 errors |
| 2 | SQL Server HMS_DB accessible | ✓ PASS | 16 users found across 3 roles |
| 3 | Demo passwords auto-seeded | ✓ PASS | DemoPasswordSeeder runs at startup |
| 4 | Application starts without crash | ☐ NOT TESTED | Requires interactive console |
| 5 | Admin login via UI | ☐ NOT TESTED | Interactive test required |
| 6 | Doctor login via UI | ☐ NOT TESTED | Interactive test required |
| 7 | Patient login via UI | ☐ NOT TESTED | Interactive test required |
| 8 | Admin Dashboard renders | ☐ NOT TESTED | Interactive test required |
| 9 | Doctor Dashboard renders | ☐ NOT TESTED | Interactive test required |
| 10 | Patient Dashboard renders | ☐ NOT TESTED | Interactive test required |
| 11 | Doctor Management CRUD | ☐ NOT TESTED | Interactive test required |
| 12 | Patient Management CRUD | ☐ NOT TESTED | Interactive test required |
| 13 | Appointment Booking flow | ☐ NOT TESTED | Interactive test required |
| 14 | Appointment Cancellation | ☐ NOT TESTED | Interactive test required |
| 15 | Notification system | ☐ NOT TESTED | Interactive test required |
| 16 | Report generation | ☐ NOT TESTED | Interactive test required |
| 17 | Logout returns to login | ☐ NOT TESTED | Interactive test required |
| 18 | App exits cleanly | ☐ NOT TESTED | Interactive test required |

## Overall

| Category | Status |
|---|---|
| Build | ✅ PASS |
| Database | ✅ PASS |
| Interactive Features | ⏸️ PENDING — Requires manual UI testing |
| **Overall** | ⚠️ PARTIAL |

## Known Issues Before Testing

- Application uses **Spectre.Console** with `SelectionPrompt` (arrow-key menus) — cannot be automated via stdin piping
- All interactive tests must be performed in a real console window
- Test harness (ConPTY-based) is under development but not ready for automated execution
