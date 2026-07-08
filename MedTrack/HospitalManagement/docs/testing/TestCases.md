# Test Cases

> **Test Environment**: .NET 10, SQL Server (MSI\SQLEXPRESS), HMS_DB  
> **App Version**: 1.0 (Enterprise Edition)  
> **Last Updated**: 26-Jun-2026

| Test ID | Phase | Feature | Preconditions | Steps | Test Data | Expected Result |
|---|---|---|---|---|---|---|
| **PHASE 1 — LOGIN TESTING** |
| TC-LOGIN-001 | 1 | Login - Empty Username | App started, Admin role selected | 1. Select System Administrator 2. Leave username blank 3. Enter any password 4. Press Enter | username: "" password: "Admin@123" | Validation: "Input cannot be blank. Please enter a valid option." |
| TC-LOGIN-002 | 1 | Login - Empty Password | App started, Admin role selected | 1. Select System Administrator 2. Enter "admin_root" 3. Leave password blank 4. Press Enter | username: "admin_root" password: "" | Validation: Input cannot be blank, or "Invalid credentials." |
| TC-LOGIN-003 | 1 | Login - Both Empty | App started, Admin role selected | 1. Select System Administrator 2. Leave username blank 3. Leave password blank 4. Press Enter | username: "" password: "" | Validation: "Input cannot be blank" |
| TC-LOGIN-004 | 1 | Login - Invalid Username | App started, Admin role selected | 1. Select System Administrator 2. Enter nonexistent username 3. Enter any password | username: "nonexistent_user_xyz" password: "Admin@123" | "Invalid credentials." |
| TC-LOGIN-005 | 1 | Login - Invalid Password | App started, Admin role selected | 1. Select System Administrator 2. Enter "admin_root" 3. Enter wrong password | username: "admin_root" password: "WrongPassword1!" | "Invalid credentials." |
| TC-LOGIN-006 | 1 | Login - Wrong Both | App started, Admin role selected | 1. Select System Administrator 2. Enter wrong username 3. Enter wrong password | username: "fake_user" password: "FakePass1!" | "Invalid credentials." |
| TC-LOGIN-007 | 1 | Login - Leading/Trailing Spaces | App started, Admin role selected | 1. Select System Administrator 2. Enter "  admin_root  " (with spaces) 3. Enter correct password | username: "  admin_root  " password: "Admin@123" | Either trimmed login succeeds, or validation rejects spaces in username |
| TC-LOGIN-008 | 1 | Login - Special Chars in Username | App started, Admin role selected | 1. Select System Administrator 2. Enter "admin@root!" 3. Enter password | username: "admin@root!" password: "Admin@123" | "Username must be 4-50 characters and may contain letters, numbers, and underscore only." |
| TC-LOGIN-009 | 1 | Login - Extremely Long Input | App started, Admin role selected | 1. Select System Administrator 2. Enter 200-char string 3. Enter password | username: "A"*200 password: "Admin@123" | Validation: Username must be 4-50 chars (truncation or rejection) |
| TC-LOGIN-010 | 1 | Login - SQL Injection | App started, Admin role selected | 1. Select System Administrator 2. Enter "' OR 1=1 --" 3. Enter password | username: "' OR 1=1 --" password: "Admin@123" | Rejected: "Invalid credentials." or validation message. NOT "Login successful." |
| TC-LOGIN-011 | 1 | Login - Valid Admin | DB seeded, build succeeded | 1. Select System Administrator 2. Enter "admin_root" 3. Enter "Admin@123" | username: "admin_root" password: "Admin@123" | "Login successful." → Admin Dashboard with metrics |
| TC-LOGIN-012 | 1 | Login - Valid Doctor | DB seeded, build succeeded | 1. Select Doctor 2. Enter "dr_arvind" 3. Enter "Doctor@123" | username: "dr_arvind" password: "Doctor@123" | "Login successful." → Doctor Dashboard with slot matrix |
| TC-LOGIN-013 | 1 | Login - Valid Patient | DB seeded, build succeeded | 1. Select Patient 2. Select "Login to Existing Patient Account" 3. Enter "sridhar_v" 4. Enter "Patient@123" | username: "sridhar_v" password: "Patient@123" | "Login successful." → Patient Dashboard |
| TC-LOGIN-014 | 1 | Login - Role Mismatch (Doctor tries Admin) | Doctor exists | 1. Select System Administrator 2. Enter doctor username "dr_arvind" 3. Enter doctor password "Doctor@123" | Doctor credentials in Admin role | "Invalid credentials." (role mismatch) |
| TC-LOGIN-015 | 1 | Login - Patient tries Doctor role | Patient exists | 1. Select Doctor 2. Enter "sridhar_v" 3. Enter "Patient@123" | Patient credentials in Doctor role | "Invalid credentials." (role mismatch) |
| TC-LOGIN-016 | 1 | Login - Case Sensitivity | Valid users exist | 1. Select System Administrator 2. Enter "ADMIN_ROOT" or "Admin_Root" 3. Enter password | username: "ADMIN_ROOT" password: "Admin@123" | Username validation: Regex `^[A-Za-z0-9_]{4,50}$` allows uppercase → may authenticate or reject depending on DB |
| TC-LOGIN-017 | 1 | Login - Exit Application | App started | 1. Select "Exit Application" | N/A | App exits cleanly. "Thank you for using Hospital Management System." |
| **PHASE 2 — MENU NAVIGATION** |
| TC-NAV-001 | 2 | Admin - Visit All Top Menus | Admin logged in | 1. Select each top menu option 2. Observe submenu 3. Use 0 to go back 4. Repeat for all 5 menus | N/A | Each menu opens without crash; submenu displays correct options; "0" returns to main menu |
| TC-NAV-002 | 2 | Admin - Doctor Management Submenus | Admin logged in | 1. Doctor Mgmt → Register New Doctor 2. Back 3. View Doctor Profiles 4. Back 5. Modify Doctor Profile 6. Back 7. View Slots & Shifts 8. Back | N/A | All submenus navigate without crash |
| TC-NAV-003 | 2 | Admin - Patient Management Submenus | Admin logged in | 1. Patient Mgmt → View Patient Directory 2. Back 3. Search Patient Profiles 4. Back | N/A | All submenus navigate without crash |
| TC-NAV-004 | 2 | Admin - Appointment Mgmt Submenus | Admin logged in | 1. Appointment Mgmt → View All Appointments 2. Back 3. Search by Number 4. Back 5. View by Date 6. Back 7. View by Status 8. Back 9. Declare Holiday 10. Back | N/A | All submenus navigate without crash |
| TC-NAV-005 | 2 | Admin - Notification Mgmt Submenus | Admin logged in | 1. Notification Mgmt → View Logs 2. Back 3. Send Test Notification 4. Back 5. Send to Patient 6. Back | N/A | All submenus navigate without crash |
| TC-NAV-006 | 2 | Admin - Report Submenus | Admin logged in | 1. Reports → Appointment Summary 2. Back 3. Doctor Utilization 4. Back 5. No-Show Analytics 6. Back 7. Dept-Wise Report 8. Back | N/A | All report menus navigate without crash |
| TC-NAV-007 | 2 | Admin - Logout | Admin logged in | Select Logout → Confirm "Yes" | N/A | "Administrator session closed." Returns to role selection screen |
| TC-NAV-008 | 2 | Doctor - Visit All Dashboard Features | Doctor logged in | 1. Press T (Today's Queue) 2. Back 3. Press N (Notifications) 4. Back 5. Press P (Profile) 6. Back 7. Press Q (Logout) | N/A | All features accessible; no crash |
| TC-NAV-009 | 2 | Doctor - Slot Matrix Navigation | Doctor logged in | Use arrow keys to navigate slot matrix cells across days and slots | N/A | Cursor moves; selected cell highlighted |
| TC-NAV-010 | 2 | Patient - Visit All Menus | Patient logged in | 1. Book Appointment 2. Back 3. Manage Appointments 4. Back 5. View Medical History 6. Back 7. View Notifications 8. Back 9. View Profile 10. Back | N/A | All menus navigable without crash |
| TC-NAV-011 | 2 | Patient - Logout | Patient logged in | Select Logout → Confirm "Yes" | N/A | "Patient session closed." Returns to portal |
| TC-NAV-012 | 2 | Navigation - Home (#) Shortcut | Any screen with input | Type "#" at any input prompt | "#" | Returns to role dashboard (home) immediately |
| TC-NAV-013 | 2 | Navigation - Back (0) Shortcut | Any input prompt | Type "0" at any input prompt | "0" | Returns to previous menu level |
| **PHASE 3 — FEATURE TESTING** |
| **Admin Features** |
| TC-FEAT-001 | 3 | Admin - Register New Doctor | Admin logged in | 1. Doctor Mgmt → Register New Doctor 2. Enter name, dept, phone, email, qual, exp 3. Enter username, password 4. Confirm | name: "Dr. Test A", dept: Cardiology, phone: "9876543210", email: "test@hms.com", qual: "MBBS", exp: 5, username: "dr_test_a", password: "Test@123" | "Doctor saved." Details displayed with generated Doctor Code |
| TC-FEAT-002 | 3 | Admin - Register Doctor - Duplicate Username | Admin logged in | Same as FEAT-001 but use existing username "dr_arvind" | username: "dr_arvind" | "Duplicate record found. Please use a different value." or similar error |
| TC-FEAT-003 | 3 | Admin - Register Doctor - Invalid Name | Admin logged in | Enter name with digits/special chars | name: "Dr123!!" | "Name should contain only alphabets, spaces, and dots." |
| TC-FEAT-004 | 3 | Admin - Register Doctor - Invalid Phone | Admin logged in | Enter phone starting with 0-5 | phone: "1234567890" | "Phone must be exactly 10 digits and start with 6, 7, 8, or 9." |
| TC-FEAT-005 | 3 | Admin - Register Doctor - Weak Password | Admin logged in | Enter password without uppercase/special | password: "weakpass" | "Password must contain uppercase, lowercase, digit, special character, and at least 8 characters." |
| TC-FEAT-006 | 3 | Admin - View Doctor Profiles | Admin logged in | Doctor Mgmt → View Doctor Profiles | N/A | Paged table of doctors displays. N/P/S navigation works. |
| TC-FEAT-007 | 3 | Admin - Modify Doctor Name | Admin logged in | Modify Doctor → select doctor → change name | new name: "Dr. Updated Name" | "Full name updated." |
| TC-FEAT-008 | 3 | Admin - Modify Doctor Department | Admin logged in | Modify Doctor → select doctor → change dept | New dept from list | "Department updated." |
| TC-FEAT-009 | 3 | Admin - Modify Doctor Contact | Admin logged in | Modify Doctor → select doctor → change phone | phone: "9988776655" | "Contact number updated." |
| TC-FEAT-010 | 3 | Admin - Deactivate Doctor | Admin logged in | Modify Doctor → select doctor → Deactivate | N/A | "Doctor account deactivated." Doctor cannot login afterwards |
| TC-FEAT-011 | 3 | Admin - View Doctor Slots & Shifts | Admin logged in | Doctor Mgmt → View Slots & Shifts → select doctor | N/A | Shifts + 7-day slot matrix displayed without crash |
| TC-FEAT-012 | 3 | Admin - View Patient Directory | Admin logged in | Patient Mgmt → View Active Patient Directory | N/A | Paged table of patients with N/P/S navigation |
| TC-FEAT-013 | 3 | Admin - Search Patient by UHID | Admin logged in | Patient Mgmt → Search → select UHID search | UHID: "87452136" | Patient profile displayed with all details |
| TC-FEAT-014 | 3 | Admin - Search Patient by Phone | Admin logged in | Patient Mgmt → Search → select Phone search | Known patient phone | Patient profile displayed |
| TC-FEAT-015 | 3 | Admin - Search Patient - Not Found | Admin logged in | Search by invalid UHID | UHID: "00000000" | "Patient not found." |
| TC-FEAT-016 | 3 | Admin - View All Appointments | Admin logged in | Appointment Mgmt → View All Appointments | N/A | Paged list of appointments |
| TC-FEAT-017 | 3 | Admin - Search Appointment by Number | Admin logged in | Appointment Mgmt → Search Appointment by Number | Valid appointment num | Appointment details displayed |
| TC-FEAT-018 | 3 | Admin - View Appointments by Date | Admin logged in | Appointment Mgmt → View by Date | Today's date | Appointments for that date |
| TC-FEAT-019 | 3 | Admin - View Appointments by Status | Admin logged in | Appointment Mgmt → View by Status → "Booked" | Status: "Booked" | Filtered appointment list |
| TC-FEAT-020 | 3 | Admin - Declare Hospital Holiday | Admin logged in | Appointment Mgmt → Declare Holiday → future date | Future date, name, reason | Holiday declared; cascade count shown |
| TC-FEAT-021 | 3 | Admin - View Notification Logs | Admin logged in | Notification Mgmt → View Logs | N/A | Paged logs table; selecting ID shows details |
| TC-FEAT-022 | 3 | Admin - Send Test Notification | Admin logged in | Notification Mgmt → Send Test → enter recipient email/phone, message | Valid recipient info | "Test notification log saved." |
| TC-FEAT-023 | 3 | Admin - Send Notification to Patient | Admin logged in | Notification Mgmt → Send to Patient → enter UHID | Valid patient UHID | "Notification sent to patient." |
| TC-FEAT-024 | 3 | Admin - Appointment Summary Report | Admin logged in | Reports → Appointment Summary → enter date | Today's date | Report displayed; export options work |
| TC-FEAT-025 | 3 | Admin - Doctor Utilization Report | Admin logged in | Reports → Doctor Utilization → enter date range | Last 30 days | Report with doctor-wise counts |
| TC-FEAT-026 | 3 | Admin - No-Show Report | Admin logged in | Reports → No-Show → enter date range | Last 30 days | No-show analytics |
| TC-FEAT-027 | 3 | Admin - Department Report | Admin logged in | Reports → Dept Report → enter date range | Last 30 days | Dept-wise breakdown |
| TC-FEAT-028 | 3 | Admin - Report Export (TXT) | Admin logged in | Generate report → Export → choose TXT | N/A | TXT file created with formatted output |
| TC-FEAT-029 | 3 | Admin - Report Export (CSV) | Admin logged in | Generate report → Export → choose CSV | N/A | CSV file created, Excel-compatible |
| TC-FEAT-030 | 3 | Admin - Report - Empty Data | Admin logged in | Generate report for future date range | Far future date | "No data found for the selected date range." |
| **Doctor Features** |
| TC-FEAT-031 | 3 | Doctor - View Today's Queue | Doctor logged in, has bookings | Press T → Today's Queue | N/A | Today's appointments listed |
| TC-FEAT-032 | 3 | Doctor - Configure Day (D) | Doctor logged in | Press D → set breaks + 5 slots for today | Standard schedule | "Day saved for {date}." |
| TC-FEAT-033 | 3 | Doctor - Set Weekly Availability (S) | Doctor logged in | Press S → configure 7-day schedule | 7-day schedule | "Weekly availability saved." |
| TC-FEAT-034 | 3 | Doctor - Block/Unblock Slot | Doctor logged in, slot matrix visible | Navigate to Available slot → Enter → Toggle block | N/A | "Slot blocked." or "Slot available." |
| TC-FEAT-035 | 3 | Doctor - Change Slot Time | Doctor logged in | Navigate to slot → Enter → Change time | New time | "Slot time changed." |
| TC-FEAT-036 | 3 | Doctor - Mark Appointment Complete | Doctor logged in, has booked appointment | Enter on Booked slot → Mark Complete → enter diagnosis, treatment, prescriptions | Sample diagnosis | "Appointment completed." Notification sent |
| TC-FEAT-037 | 3 | Doctor - Mark No-Show | Doctor logged in, has booked appointment | Enter on Booked slot → Mark No-Show | N/A | "Marked as No-Show." |
| TC-FEAT-038 | 3 | Doctor - Cancel Appointment | Doctor logged in, has booking >2hrs away | Enter on Booked slot → Toggle status → Cancel | N/A | "Appointment cancelled, slot released." |
| TC-FEAT-039 | 3 | Doctor - View Notifications | Doctor logged in | Press N | N/A | Notification table displayed (or "No notifications.") |
| TC-FEAT-040 | 3 | Doctor - View Profile | Doctor logged in | Press P | N/A | Doctor profile details displayed |
| TC-FEAT-041 | 3 | Doctor - View Patient Medical History | Doctor logged in, Today's Queue | T → select patient → View Medical History | N/A | Past medical records displayed |
| TC-FEAT-042 | 3 | Doctor - File Leave Request | Doctor logged in | In DoctorMenu → File New Leave → enter dates, reason | Future dates | Leave filed; status Pending |
| **Patient Features** |
| TC-FEAT-043 | 3 | Patient - Register New Account | App started | Patient Portal → Register New Patient → fill all fields | Valid test data | Account created. UHID displayed. |
| TC-FEAT-044 | 3 | Patient - Register - Duplicate Username | App started | Register with existing username "sridhar_v" | username: "sridhar_v" | "Duplicate record found. Please use a different value." |
| TC-FEAT-045 | 3 | Patient - Register - Invalid Fields | App started | Enter invalid name, phone, email, etc. | Various invalid inputs | Appropriate validation messages for each field |
| TC-FEAT-046 | 3 | Patient - Book Appointment | Patient logged in | Book → select dept → select doctor → enter date → select slot → enter reason → confirm | Future date, reason | "Appointment booked." Appointment number displayed |
| TC-FEAT-047 | 3 | Patient - Book - Past Date | Patient logged in | Book → enter past date | Past date | "Appointments cannot be booked in the past." |
| TC-FEAT-048 | 3 | Patient - Book - Duplicate Same Doctor/Day | Patient logged in | Book a second appt with same doctor on same day | Same doctor, same date | "You already have a booked appointment with this doctor on this date." |
| TC-FEAT-049 | 3 | Patient - View Active Bookings | Patient logged in | Manage Appointments → View Active Bookings | N/A | List of booked/pending appointments |
| TC-FEAT-050 | 3 | Patient - Cancel Appointment | Patient logged in | Manage Appointments → Cancel → select appt → confirm | Appt >2hrs away | "Appointment cancelled." |
| TC-FEAT-051 | 3 | Patient - Cancel Within 2-Hour Window | Patient logged in | Cancel appt scheduled within 2 hours | Recent appt | "Appointments cannot be cancelled within 2 hours of the scheduled time." |
| TC-FEAT-052 | 3 | Patient - Reschedule Appointment | Patient logged in | Manage Appointments → Reschedule → select appt → confirm → book new slot | New date/slot | "Rescheduled. Old appointment cancelled, new appointment booked." |
| TC-FEAT-053 | 3 | Patient - View Medical History | Patient logged in, has completed visits | View Medical History | N/A | History groups displayed; selecting shows full details |
| TC-FEAT-054 | 3 | Patient - View Medical History - Empty | New patient w/o visits | View Medical History | N/A | "No records found" or empty list |
| TC-FEAT-055 | 3 | Patient - View Notifications | Patient logged in | View My Notifications | N/A | Notifications list (or "No notifications found.") |
| TC-FEAT-056 | 3 | Patient - View Profile | Patient logged in | View My Patient Profile | N/A | Full profile with UHID, name, DOB, contact, blood group, emergency contact |
| **PHASE 4 — ROBUSTNESS** |
| TC-ROB-001 | 4 | Robustness - Unexpected Input | Any menu | Enter non-menu characters, random keys at prompts | "xyz", "!@#$", numbers out of range | Graceful handling: warning shown, no crash |
| TC-ROB-002 | 4 | Robustness - Rapid Enter Presses | Any screen | Press Enter rapidly multiple times | Rapid Enter | No crash; validation messages as expected |
| TC-ROB-003 | 4 | Robustness - Back/Home at Every Prompt | Every screen | Enter 0 or # at every prompt | "0", "#" | Back/home works; no crash or infinite loop |
| TC-ROB-004 | 4 | Robustness - Login → Logout → Re-login Cycle | Valid users exist | Login → Logout → Login again (same/different role) | Various | Re-login succeeds; session resets cleanly |
| TC-ROB-005 | 4 | Robustness - Return to Menu Repeatedly | Any feature | Enter a feature, back out, re-enter multiple times | N/A | Feature works consistently; no state leakage |
| TC-ROB-006 | 4 | Robustness - Very Long Text in All Fields | Every text input | Enter 500+ chars in text fields | Long text | Validation truncates or rejects; no buffer overflow/crash |
| TC-ROB-007 | 4 | Robustness - Special Characters in All Fields | Every text input | Enter special chars: <script>, SQL injection patterns, Unicode | "<script>alert('xss')</script>", "'; DROP TABLE Users; --" | Rejected or sanitized; no SQL injection |
| TC-ROB-008 | 4 | Robustness - Cancel Mid-Workflow | Multi-step feature | Start flow, enter 0 or # mid-way | "0" at any step | Returns to previous level; no partial state corruption |
| TC-ROB-009 | 4 | Robustness - App Restart | App running | Exit app via Exit Application → Restart | N/A | App restarts cleanly; DB state preserved |
| TC-ROB-010 | 4 | Robustness - DB Disconnect During Session | App running | Disconnect network/stop SQL Server → try operations | N/A | "Database connection failed." or friendly error; no crash |

> **Note**: "Expected Result" is the designed/intended behavior. Actual Result may differ if bugs exist.
