# Regression Checklist

> **Last Updated**: 26-Jun-2026  
> Use this checklist after each bug fix to verify existing features still work.

## Build & Startup

| Check | Status | Notes |
|---|---|---|
| `dotnet build HospitalManagementSystem.slnx` succeeds | ☐ | 0 warnings, 0 errors |
| Application starts without crash | ☐ | |
| Splash screen displays correctly | ☐ | |
| Database connection established | ☐ | |
| Demo passwords seeded (first run) | ☐ | |

## Role Selection & Login

| Check | Status | Notes |
|---|---|---|
| Role selection menu shows 4 options | ☐ | Admin, Doctor, Patient, Exit |
| Patient Portal submenu shows 2 options | ☐ | Login, Register |
| Empty username validation | ☐ | |
| Empty password validation | ☐ | |
| Invalid username rejected | ☐ | |
| Invalid password rejected | ☐ | |
| Valid Admin login → Admin Dashboard | ☐ | |
| Valid Doctor login → Doctor Dashboard | ☐ | |
| Valid Patient login → Patient Dashboard | ☐ | |
| Role mismatch rejected | ☐ | |
| Exit Application → clean exit | ☐ | |
| Back (0) at login returns to role selection | ☐ | |
| Home (#) at login returns to role selection | ☐ | |

## Admin Dashboard

| Check | Status | Notes |
|---|---|---|
| Dashboard metrics display (departments, doctors, patients, appointments) | ☐ | |
| Doctor Management → Register, View, Modify, Slots | ☐ | |
| Patient Management → View, Search by UHID/phone | ☐ | |
| Appointment Management → View, Search, Date, Status, Holiday | ☐ | |
| Notification Management → View logs, Send test, Send to patient | ☐ | |
| Operational Reports → 4 report types + export | ☐ | |
| Logout returns to role selection | ☐ | |

## Doctor Dashboard

| Check | Status | Notes |
|---|---|---|
| Slot matrix (7 days × 5 slots) renders | ☐ | |
| Arrow key navigation works | ☐ | |
| Enter on slot shows correct action menu | ☐ | |
| D (Configure Day) works | ☐ | |
| S (Set Weekly Availability) works | ☐ | |
| T (Today's Queue) works | ☐ | |
| N (Notifications) works | ☐ | |
| P (Profile) works | ☐ | |
| Q (Logout) works | ☐ | |
| Block/Unblock slot | ☐ | |
| Change slot time | ☐ | |
| Cancel appointment | ☐ | |
| Mark appointment complete | ☐ | |
| Mark appointment No-Show | ☐ | |

## Patient Dashboard

| Check | Status | Notes |
|---|---|---|
| Book Appointment → dept → doctor → date → slot → confirm | ☐ | |
| Past date booking rejected | ☐ | |
| Duplicate doctor/date booking rejected | ☐ | |
| Manage Appointments → View, Cancel, Reschedule | ☐ | |
| 2-hour cancellation cutoff enforced | ☐ | |
| View Medical History | ☐ | |
| View Notifications | ☐ | |
| View Profile | ☐ | |

## Cross-Cutting Concerns

| Check | Status | Notes |
|---|---|---|
| All menus respect 0 (Back) and # (Home) | ☐ | |
| No unhandled exceptions in any flow | ☐ | |
| Paging works (N/P navigation) in all tables | ☐ | |
| Validation error messages displayed for invalid input | ☐ | |
| Database operations don't leave partial state | ☐ | |
| Logout clears session properly | ☐ | |
| Re-login after logout works with different user | ☐ | |

## Post-Fix Verification

| Bug ID | Feature Changed | Test Cases to Re-run | Status |
|---|---|---|---|
| | | | ☐ |
| | | | ☐ |
| | | | ☐ |
