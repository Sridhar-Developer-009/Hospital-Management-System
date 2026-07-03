# Test Execution Log

> **Tester**: [Your Name]  
> **Date**: 26-Jun-2026  
> **Environment**: Windows 10+ / .NET 10 / SQL Server (MSI\SQLEXPRESS) / HMS_DB

## Instructions

1. Run the app: `dotnet run --project HospitalManagementSystem`
2. For each test case below, execute the steps exactly as described
3. Record the console output observed (key screens/messages)
4. Write PASS if Actual Result matches Expected Result, otherwise FAIL
5. If FAIL, capture the exact console output and reference a Bug ID

---

## PHASE 1: LOGIN TESTING

| Timestamp | Test ID | Action | Console Input | Console Output | Expected | Actual | Result | Bug ID |
|---|---|---|---|---|---|---|---|---|
| | TC-LOGIN-001 | Select Admin, empty username | username: "" , password: "Admin@123" | | Validation: "Input cannot be blank" | | | |
| | TC-LOGIN-002 | Select Admin, empty password | username: "admin_root", password: "" | | Validation or "Invalid credentials." | | | |
| | TC-LOGIN-003 | Select Admin, both empty | username: "" , password: "" | | Validation: "Input cannot be blank" | | | |
| | TC-LOGIN-004 | Select Admin, invalid username | username: "nonexistent_user_xyz", password: "Admin@123" | | "Invalid credentials." | | | |
| | TC-LOGIN-005 | Select Admin, wrong password | username: "admin_root", password: "WrongPassword1!" | | "Invalid credentials." | | | |
| | TC-LOGIN-006 | Select Admin, wrong both | username: "fake_user", password: "FakePass1!" | | "Invalid credentials." | | | |
| | TC-LOGIN-007 | Select Admin, spaces in username | username: "  admin_root  ", password: "Admin@123" | | Login succeeds (trimmed) or validation | | | |
| | TC-LOGIN-008 | Select Admin, special chars | username: "admin@root!", password: "Admin@123" | | "Username must be 4-50 characters..." | | | |
| | TC-LOGIN-009 | Select Admin, 200-char input | username: "AAAA... (200x)", password: "Admin@123" | | Validation for length | | | |
| | TC-LOGIN-010 | Select Admin, SQL injection | username: "' OR 1=1 --", password: "Admin@123" | | NOT "Login successful." | | | |
| | TC-LOGIN-011 | Valid Admin login | username: "admin_root", password: "Admin@123" | | "Login successful." → Dashboard | | | |
| | TC-LOGIN-012 | Valid Doctor login | username: "dr_arvind", password: "Doctor@123" | | "Login successful." → Slot Matrix | | | |
| | TC-LOGIN-013 | Valid Patient login | username: "sridhar_v", password: "Patient@123" | | "Login successful." → Patient Dashboard | | | |
| | TC-LOGIN-014 | Role mismatch: Doctor tries Admin | Select Admin, dr_arvind / Doctor@123 | | "Invalid credentials." | | | |
| | TC-LOGIN-015 | Role mismatch: Patient tries Doctor | Select Doctor, sridhar_v / Patient@123 | | "Invalid credentials." | | | |
| | TC-LOGIN-016 | Username case sensitivity | username: "ADMIN_ROOT", password: "Admin@123" | | May succeed or fail depending on DB collation | | | |
| | TC-LOGIN-017 | Exit Application | Select "Exit Application" | | "Thank you for using Hospital Management System." | | | |

## PHASE 2: MENU NAVIGATION

| Timestamp | Test ID | Action | Console Input | Console Output | Expected | Actual | Result | Bug ID |
|---|---|---|---|---|---|---|---|---|
| | TC-NAV-001 | Admin - Visit all 5 top menus | Navigate each menu option | | Each opens without crash | | | |
| | TC-NAV-002 | Admin - Doctor Mgmt submenus | Navigate all 4 sub-items | | All accessible | | | |
| | TC-NAV-003 | Admin - Patient Mgmt submenus | Navigate both sub-items | | All accessible | | | |
| | TC-NAV-004 | Admin - Appointment Mgmt submenus | Navigate all 5 sub-items | | All accessible | | | |
| | TC-NAV-005 | Admin - Notification Mgmt submenus | Navigate all 3 sub-items | | All accessible | | | |
| | TC-NAV-006 | Admin - Report submenus | Navigate all 4 report types | | All accessible | | | |
| | TC-NAV-007 | Admin - Logout | Logout → Yes | | "Administrator session closed." | | | |
| | TC-NAV-008 | Doctor - Dashboard features | T, N, P, Q | | All work without crash | | | |
| | TC-NAV-009 | Doctor - Slot matrix arrows | Arrow keys in matrix | | Cursor navigates cells | | | |
| | TC-NAV-010 | Patient - All menus | Visit all 6 menu options | | All work without crash | | | |
| | TC-NAV-011 | Patient - Logout | Logout → Yes | | "Patient session closed." | | | |
| | TC-NAV-012 | Home (#) from input prompt | Type "#" | | Returns to dashboard | | | |
| | TC-NAV-013 | Back (0) from input prompt | Type "0" | | Returns to previous menu | | | |

## PHASE 3: FEATURE TESTING

| Timestamp | Test ID | Action | Console Input | Console Output | Expected | Actual | Result | Bug ID |
|---|---|---|---|---|---|---|---|---|
| | TC-FEAT-001 | Register New Doctor | Valid fields | | "Doctor saved." with code | | | |
| | TC-FEAT-002 | Register Doctor - duplicate username | Existing username | | Duplicate error | | | |
| | TC-FEAT-003 | Register Doctor - invalid name | "Dr123!!" | | Name validation error | | | |
| | TC-FEAT-004 | Register Doctor - invalid phone | "1234567890" | | Phone validation error | | | |
| | TC-FEAT-005 | Register Doctor - weak password | "weakpass" | | Password validation error | | | |
| | TC-FEAT-006 | View Doctor Profiles | N/A | | Paged table displayed | | | |
| | TC-FEAT-007 | Modify Doctor Name | New name | | "Full name updated." | | | |
| | TC-FEAT-008 | Modify Doctor Department | New dept | | "Department updated." | | | |
| | TC-FEAT-009 | Modify Doctor Contact | New phone | | "Contact number updated." | | | |
| | TC-FEAT-010 | Deactivate Doctor | Confirm | | "Doctor account deactivated." | | | |
| | TC-FEAT-011 | View Doctor Slots & Shifts | Select doctor | | Matrix displayed | | | |
| | TC-FEAT-012 | View Patient Directory | N/A | | Paged table displayed | | | |
| | TC-FEAT-013 | Search Patient by UHID | "87452136" | | Profile displayed | | | |
| | TC-FEAT-014 | Search Patient by Phone | Valid phone | | Profile displayed | | | |
| | TC-FEAT-015 | Search Patient - not found | "00000000" | | "Patient not found." | | | |
| | TC-FEAT-016 | View All Appointments | N/A | | Appointment list | | | |
| | TC-FEAT-017 | Search Appointment by Number | Valid appt # | | Appointment details | | | |
| | TC-FEAT-018 | View Appointments by Date | Today | | Filtered list | | | |
| | TC-FEAT-019 | View Appointments by Status | "Booked" | | Filtered list | | | |
| | TC-FEAT-020 | Declare Hospital Holiday | Future date | | Holiday declared | | | |
| | TC-FEAT-021 | View Notification Logs | N/A | | Paged logs | | | |
| | TC-FEAT-022 | Send Test Notification | Valid recipient | | "Test notification log saved." | | | |
| | TC-FEAT-023 | Send Notification to Patient | Valid UHID | | "Notification sent to patient." | | | |
| | TC-FEAT-024 | Appointment Summary Report | Today | | Report with data | | | |
| | TC-FEAT-025 | Doctor Utilization Report | Date range | | Report with data | | | |
| | TC-FEAT-026 | No-Show Report | Date range | | Report with data | | | |
| | TC-FEAT-027 | Department Report | Date range | | Report with data | | | |
| | TC-FEAT-028 | Report Export TXT | TXT | | File created | | | |
| | TC-FEAT-029 | Report Export CSV | CSV | | File created | | | |
| | TC-FEAT-030 | Report - Empty data | Future dates | | "No data found." | | | |
| | TC-FEAT-031 | Doctor - Today's Queue | Press T | | Queue displayed | | | |
| | TC-FEAT-032 | Doctor - Configure Day | Press D | | "Day saved." | | | |
| | TC-FEAT-033 | Doctor - Weekly Availability | Press S | | "Weekly availability saved." | | | |
| | TC-FEAT-034 | Doctor - Block/Unblock Slot | Enter on slot → Toggle | | "Slot blocked." / "Slot available." | | | |
| | TC-FEAT-035 | Doctor - Change Slot Time | Enter → Change time | | "Slot time changed." | | | |
| | TC-FEAT-036 | Doctor - Mark Complete | Enter → Complete → enter details | | "Appointment completed." | | | |
| | TC-FEAT-037 | Doctor - Mark No-Show | Enter → Mark No-Show | | "Marked as No-Show." | | | |
| | TC-FEAT-038 | Doctor - Cancel Appointment | Enter → Toggle → Cancel | | "Appointment cancelled." | | | |
| | TC-FEAT-039 | Doctor - View Notifications | Press N | | Notifications displayed | | | |
| | TC-FEAT-040 | Doctor - View Profile | Press P | | Profile displayed | | | |
| | TC-FEAT-041 | Doctor - View Medical History | Select patient in queue | | History displayed | | | |
| | TC-FEAT-042 | Doctor - File Leave | Enter dates/reason | | Leave filed | | | |
| | TC-FEAT-043 | Patient - Register New Account | Fill all fields | | Account created with UHID | | | |
| | TC-FEAT-044 | Patient - Register duplicate username | "sridhar_v" | | Duplicate error | | | |
| | TC-FEAT-045 | Patient - Register invalid fields | Bad data | | Validation errors | | | |
| | TC-FEAT-046 | Patient - Book Appointment | Select dept, doctor, date, slot | | "Appointment booked." | | | |
| | TC-FEAT-047 | Patient - Book past date | Past date | | "Cannot book in the past." | | | |
| | TC-FEAT-048 | Patient - Book duplicate | Same doctor/date | | "Already have a booking." | | | |
| | TC-FEAT-049 | Patient - View Active Bookings | N/A | | List displayed | | | |
| | TC-FEAT-050 | Patient - Cancel Appointment | Select → confirm | | "Appointment cancelled." | | | |
| | TC-FEAT-051 | Patient - Cancel within 2hrs | Recent appt | | Cutoff error | | | |
| | TC-FEAT-052 | Patient - Reschedule | Select → new slot | | "Rescheduled." | | | |
| | TC-FEAT-053 | Patient - View Medical History | N/A | | History displayed | | | |
| | TC-FEAT-054 | Patient - View Medical History (empty) | N/A | | "No records found." | | | |
| | TC-FEAT-055 | Patient - View Notifications | N/A | | Notifications list | | | |
| | TC-FEAT-056 | Patient - View Profile | N/A | | Full profile displayed | | | |

## PHASE 4: ROBUSTNESS

| Timestamp | Test ID | Action | Console Input | Console Output | Expected | Actual | Result | Bug ID |
|---|---|---|---|---|---|---|---|---|
| | TC-ROB-001 | Unexpected input | "xyz", "!@#$", random | | Warning; no crash | | | |
| | TC-ROB-002 | Rapid Enter presses | Rapid Enter | | No crash | | | |
| | TC-ROB-003 | Back/Home everywhere | "0", "#" at each prompt | | Graceful navigation | | | |
| | TC-ROB-004 | Login → Logout → Re-login | Cycle 3x | | Clean session each time | | | |
| | TC-ROB-005 | Enter/exit feature repeatedly | 5+ cycles | | Consistent behavior | | | |
| | TC-ROB-006 | Very long text | 500+ chars | | Validation/truncation | | | |
| | TC-ROB-007 | Special chars / XSS / SQLi | "<script>", DROP TABLE | | Rejected/sanitized | | | |
| | TC-ROB-008 | Cancel mid-workflow | "0" mid-flow | | Returns to previous level | | | |
| | TC-ROB-009 | App restart | Exit → restart | | Clean restart | | | |
| | TC-ROB-010 | DB disconnect | Stop SQL → try op | | Friendly error | | | |

## Summary

| Metric | Count |
|---|---|
| **Total Test Cases** | |
| **Passed** | |
| **Failed** | |
| **Blocked / Pending** | |
| **Bugs Found** | |
| **Bugs Fixed** | |
