# CityCare Hospital — Complete UAT Report

**Date:** 2026-07-04  
**Tester:** Automated Code-Level UAT  
**Scope:** All 28 HTML pages, 9 JS modules, 6 CSS files, 3 portal scripts  
**Method:** Static analysis simulating real user walkthroughs across all 4 roles  

---

## Executive Summary

| Metric | Value |
|---|---|
| **Total Pages Tested** | 28 (3 public + 7 patient + 6 doctor + 9 admin + 3 shared) |
| **Total Issues Found** | 78 |
| **Critical** | 8 |
| **High** | 14 |
| **Medium** | 24 |
| **Low** | 32 |
| **Overall UAT Score** | **38 / 100** (FAIL — not ready for production) |

### Score Breakdown by Category
| Category | Score | Max | Notes |
|---|---|---|---|
| Functional Completeness | 6 / 25 | 25 | Registration non-functional, profiles don't save, many stubs |
| Security | 5 / 15 | 15 | XSS in 8+ pages, no auth guards, fallback to hardcoded IDs |
| UI/UX Consistency | 8 / 15 | 15 | Two design systems, dark mode broken, native alerts mixed |
| Content & Grammar | 6 / 10 | 10 | Chinese chars in medical history, hardcoded dates, stale counts |
| Business Logic | 6 / 15 | 15 | State machine gaps, decorative filters, static tabs |
| Accessibility | 4 / 10 | 10 | Missing aria-labels, no form labels on filters, no live regions |
| Performance & Code Quality | 3 / 10 | 10 | Duplicate scripts, dead dependencies, 90-line inline IIFE ×28 |

---

## CRITICAL Issues (8)

### CRIT-1: Patient Registration Does Not Save Data
- **Files:** `features/auth/register.html`
- **Impact:** New patients cannot register. Form validates → shows "success" → redirects to login, but NEVER calls `StorageDB` or persists the account. Login will always fail for "registered" patients.
- **Root Cause:** No `storage.js` loaded, no save call, password never hashed/stored.

### CRIT-2: No Auth/Session Guard on Any Portal Page
- **Files:** All 22 portal pages (7 patient, 6 doctor, 9 admin)
- **Impact:** Any page is accessible via direct URL without login. No `sessionStorage` check redirects unauthenticated users. Patient can access admin pages and vice versa.

### CRIT-3: XSS via Unescaped innerHTML in 8+ Pages
- **Files:** `patient-prescriptions.html`, `patient-notifications.html`, `admin-appointments.html`, `admin-appointment-flow.js`, `admin-doctors.html/doctor-flow.js`, `admin-patients.html/patient-flow.js`, `audit-logs.html`, `admin-notifications.html`
- **Impact:** Stored XSS — user-entered data (names, medical history, reason for visit) rendered via `innerHTML` without escaping. Only `content.html` uses the `esc()` helper correctly.
- **Note:** This was partially fixed in earlier sprint (SEC-2) for patient-appointments.html and medical-history.html, but was NOT applied to doctor/admin pages or prescriptions/notifications.

### CRIT-4: Profile Save Does Not Persist (Patient)
- **Files:** `features/profile/patient-profile.html`
- **Impact:** "Save Changes" button only shows a cosmetic toast — no `StorageDB` call. All form values are hardcoded HTML, not populated from session/storage. Profile is entirely non-functional.

### CRIT-5: Doctor Dashboard Falls Back to Hardcoded Doctor ID
- **Files:** `doctor-appointments.js:27`, `doctor-portal.js:75` (patient equivalent), `book-appointment.html`
- **Impact:** When no session exists, code defaults to `'DOC-1001'` or `'PAT-1001'` — unauthenticated users silently operate as a real seeded user, booking/viewing their appointments.

### CRIT-6: Admin Quick Actions Don't Persist Data
- **Files:** `shared/utils/admin-portal.js` (lines 900–928)
- **Impact:** "Add Doctor", "Add Patient", "Add Appointment" quick-action modals show success toast ("submitted successfully") but silently discard all form data. Only "Send Notification" actually saves to StorageDB.

### CRIT-7: Doctor Profile Page Missing storage.js
- **Files:** `features/profile/doctor-profile.html`
- **Impact:** Page loads `doctor-profile.js` but does NOT include `storage.js` — any call to `StorageDB` will throw `TypeError: Cannot read properties of undefined`. Profile data cannot be loaded or saved.

### CRIT-8: Settings Theme Dropdown Disconnected from Theme System
- **Files:** `features/settings/settings.html`
- **Impact:** Theme selector (Light/Dark/System) has NO event listener. Changing it does nothing. The actual theme mechanism (`localStorage.citycare_theme`) is unreachable — dark mode toggle button (`#darkModeToggle`) doesn't exist in any page's DOM.

---

## HIGH Issues (14)

### HIGH-1: Dark Mode Toggle UI Element Missing Globally
- **Files:** All 28 pages
- **Desc:** Every page includes ~90 lines of inline theme-toggle JS referencing `#darkModeToggle` and `#darkModeIcon`, but NO page renders these elements. Dark mode can only be activated via browser DevTools.

### HIGH-2: Medical History Uses 100% Hardcoded Data
- **Files:** `features/medical-history/medical-history.html`
- **Desc:** `historyData` array is static — every patient sees identical fake history regardless of who's logged in. Not connected to StorageDB.

### HIGH-3: Patient Dashboard Greeting Stuck on "Loading..."
- **Files:** `features/dashboard/patient-dashboard.html:211`
- **Desc:** Text says "Loading..." with no JS that ever replaces it. KPI cards (Upcoming/Completed/Prescriptions/Records) show `-` permanently — zero JS binding.

### HIGH-4: Doctor Dashboard Greeting Hardcoded
- **Files:** `features/dashboard/doctor-dashboard.html:209-210`
- **Desc:** Shows "Good Morning, Dr. Arvind Kumar" and "Cardiology Department • Doctor ID: DOC-1001" as static HTML. Not personalized from session.

### HIGH-5: Past/Cancelled Appointment Tabs Are Static HTML
- **Files:** `features/appointments/patient-appointments.html`
- **Desc:** Upcoming tab is dynamic via `renderUpcomingAppointments()`, but Past and Cancelled tabs are fully hardcoded static markup — not data-driven. "Upcoming (2)" tab count also hardcoded.

### HIGH-6: Admin Notifications Filters Are Decorative
- **Files:** `features/notifications/admin-notifications.html`
- **Desc:** Type/Status filter dropdowns and Search input have no IDs, no event handlers — completely inert despite appearing functional.

### HIGH-7: Patient Status Toggle Missing States
- **Files:** `features/patients/patient-flow.js`
- **Desc:** Status toggle only supports ACTIVE↔DISCHARGED. No way to set INPATIENT or FOLLOWUP via UI, despite those statuses being rendered and recognized elsewhere.

### HIGH-8: Broken Link in Patient Dashboard Modal
- **Files:** `features/dashboard/patient-dashboard.html:468`
- **Desc:** Appointment detail modal sets `link.href = 'appointments.html'` — wrong relative path. Should be `../appointments/patient-appointments.html`.

### HIGH-9: Button ID Mismatch Breaks Double-Submit Prevention
- **Files:** `features/appointments/book-appointment.html`
- **Desc:** JS references `confirmBookingBtn` but HTML button ID is `confirmAppointmentBtn`. The disable-on-submit logic silently never executes.

### HIGH-10: Content Management bgImage Field Not Saved
- **Files:** `features/content/content.html`
- **Desc:** "Background Image Path" field is editable but `collectForm()` never reads it back — edits are silently discarded on Save Draft/Publish.

### HIGH-11: Admin Sidebar Missing Audit Logs Link
- **Files:** `features/appointments/admin-appointments.html`
- **Desc:** This page's sidebar omits the "Audit Logs" nav item present on every other admin page — admins cannot navigate to Audit Logs from here.

### HIGH-12: Patient Registration Enforces Undisclosed Required Fields
- **Files:** `features/patients/patient-flow.js`
- **Desc:** JS validation requires Gender and Department, but HTML form doesn't mark them as `required` and labels show no asterisk — confusing UX mismatch.

### HIGH-13: Hardcoded Department List in Patient Modify
- **Files:** `features/patients/patient-flow.js`
- **Desc:** Field editor uses hardcoded `['Cardiology', 'Dermatology', ...]` instead of `StorageDB.getDepartments()`. Will drift out of sync if departments change.

### HIGH-14: doctor-portal.js Has No StorageDB Guard
- **Files:** `shared/utils/doctor-portal.js:25`
- **Desc:** Calls `window.StorageDB.getDoctorById()` without checking if `StorageDB` exists. Throws hard `TypeError` if `storage.js` fails to load.

---

## MEDIUM Issues (24)

| ID | Issue | File(s) |
|---|---|---|
| MED-1 | Chinese characters "继续保持" in clinical notes | medical-history.html:374 |
| MED-2 | Hardcoded notification badges ("3"/"4"/"5") across pages vs dynamic on dashboards | 15+ pages |
| MED-3 | Static placeholder notification dropdown (Dr. Arvind Kumar, 12 Jun 2026) on 5 patient pages | book-appointment, patient-appointments, etc. |
| MED-4 | Calendar modal hardcoded to "June 2026" | doctor-appointments.html:545 |
| MED-5 | Date filter hardcoded to "Wed, 10 June 2026" | doctor-appointments.html:205 |
| MED-6 | Doctor numbering artifacts in button labels ("6. Deactivate", "7. Back") | admin-doctors.html |
| MED-7 | `book-appointment.html` does NOT load `patient-portal.js` — sidebar/search behaviors missing | book-appointment.html |
| MED-8 | Booking summary shows hardcoded date "12 Jun 2026, Thursday" instead of selected date | book-appointment.html:515 |
| MED-9 | "Backup & Restore" and "System Settings" both link to same `settings.html` | All admin pages |
| MED-10 | Native `alert()`/`confirm()` used inconsistently alongside styled modals | admin-appointment-flow.js, admin-doctors.html, admin-patients.html |
| MED-11 | Login with uppercase role param (`?role=DOCTOR`) silently does nothing on submit | login.js:172 |
| MED-12 | `index.html` stats say "5 Departments" but seed data has 6 | index.html |
| MED-13 | `index.html` JS tries to populate `#portals` section but no such ID exists in body | index.html / app.js |
| MED-14 | Audit log KPIs show fake static numbers (12,847 / 247 / 18 / 3) if StorageDB unavailable | audit-logs.html |
| MED-15 | Settings i18n only affects Settings page, not app-wide | settings.html |
| MED-16 | Admin messages panel uses hardcoded mock data, notifications panel uses real data | admin-portal.js:92-97 |
| MED-17 | Audit logs quick-action modal uses hardcoded static rows, not StorageDB data | admin-portal.js:745-767 |
| MED-18 | `app.js` navbar-header null-check missing — throws on scroll if element absent | app.js:26-29 |
| MED-19 | Patient sidebar starts closed on desktop; doctor/admin start open — inconsistent | patient-portal.js vs doctor/admin-portal.js |
| MED-20 | Hardcoded success placeholder "DOC-1003" visible if JS fails before overwriting | admin-doctors.html |
| MED-21 | `storage.js` loaded twice in patient-prescriptions.html (head + body) | patient-prescriptions.html |
| MED-22 | Two design systems: landing (cool gray/white) vs dashboards (warm beige) share only green | global.css vs layout.css |
| MED-23 | Chart.js CDN loaded on pages with zero canvas elements (dead dependency) | reports.html, admin-doctors.html, admin-patients.html |
| MED-24 | `Playfair Display` font referenced in global.css but never loaded via Google Fonts link | global.css / index.html |

---

## LOW Issues (32)

| ID | Issue | File(s) |
|---|---|---|
| LOW-1 | Dark mode theme-init IIFE (~90 lines) copy-pasted inline in every page | All 28 pages |
| LOW-2 | Hardcoded avatar "SK" in patient portal header — never personalized | 7 patient pages |
| LOW-3 | Non-functional filter dropdowns (Availability/Gender/Sort/Date Range) | book-appointment, patient-appointments, medical-history, prescriptions |
| LOW-4 | `alert()` stub handlers: Contact Support, Download All, Discharge Summary, Print, Download | patient-dashboard, medical-history, prescriptions |
| LOW-5 | "Book Again" button has no onclick handler | patient-appointments.html:360 |
| LOW-6 | Avatar edit camera button has no handler | patient-profile.html:249 |
| LOW-7 | Missing `aria-label` on sidebar close button | 6 of 7 patient pages, doctor-appointments.html |
| LOW-8 | Form `<select>` filter elements lack associated `<label>` elements | Multiple pages |
| LOW-9 | Decorative SVGs missing `aria-hidden="true"` | Multiple pages |
| LOW-10 | `html { background: #02140C }` hardcoded in global.css — ignores theme | global.css:68 |
| LOW-11 | `.login-hero-panel` SVG pattern uses hardcoded green hex, not CSS var | login.css:22-24 |
| LOW-12 | `.upcoming-appt-card` background hardcoded `#ffffff` — breaks dark mode | patient-theme.css:32 |
| LOW-13 | No `admin-theme.css` exists — layout.css silently doubles as admin theme | shared/components/ |
| LOW-14 | `login.css` has zero CSS var fallback values (unlike layout.css which has many) | login.css |
| LOW-15 | `backdrop-filter: blur()` needs `-webkit-` prefix for older Safari | global.css, login.css |
| LOW-16 | Sidebar state localStorage write is dead code (never read back) | patient-portal.js:10,16 |
| LOW-17 | Patient portal search uses hardcoded mock doctors, not StorageDB | patient-portal.js:31-37 |
| LOW-18 | `doctor-portal.js` doesn't guard `new bootstrap.Dropdown()` | doctor-portal.js:121 |
| LOW-19 | `app.js` hero slider interval runs on NaN if no slides exist | app.js:72 |
| LOW-20 | Register form: no password strength meter while typing | register.html |
| LOW-21 | Settings page "Save All" toast animation may lack CSS class | settings.html |
| LOW-22 | Footer version "2.4.0" hardcoded across all pages | All portal pages |
| LOW-23 | Copyright "© 2026" hardcoded (should be dynamic) | All pages |
| LOW-24 | `login_selection.html` dark mode script references missing button | login_selection.html |
| LOW-25 | Doctor appointments: header search input has no handler | doctor-appointments.html:149 |
| LOW-26 | Doctor appointments: second icon button (calendar) has no handler | doctor-appointments.html:160-163 |
| LOW-27 | Doctor settings dropdown link points to `#` (dead link) | doctor-dashboard.html:183 |
| LOW-28 | `scroll-snap-type` in global.css has cross-browser inconsistencies | global.css:67 |
| LOW-29 | Admin-portal.js: Chart.js retry loop fails silently after 10s | admin-portal.js:546-554 |
| LOW-30 | `openApptFieldEditor` only escapes double quotes, not `<`/`>` | admin-appointment-flow.js |
| LOW-31 | `handleModifyDeactivate()` appears to be orphaned dead code | doctor-flow.js |
| LOW-32 | Two parallel success-feedback mechanisms on doctor registration | admin-doctors.html |

---

## Role-by-Role UAT Verdict

### 🔴 New Patient (Registration Flow)
**BLOCKED — Cannot complete registration**
- Register form → validates → redirects → login fails (account never created)
- Score: **10 / 100**

### 🟡 Existing Patient (Pre-seeded Login)
**PARTIALLY FUNCTIONAL**
- Login works (with pre-seeded credentials)
- Dashboard greeting broken ("Loading...")
- Booking wizard works (core flow functional, but date display hardcoded)
- Appointments: Upcoming tab works; Past/Cancelled static
- Medical History: Shows same fake data for every patient
- Prescriptions: Functional but XSS-vulnerable
- Profile: Cannot save changes (cosmetic-only)
- Notifications: Best-implemented page (dynamic, real data)
- Score: **42 / 100**

### 🟡 Doctor (Pre-seeded Login)
**PARTIALLY FUNCTIONAL**
- Login works
- Dashboard: Greeting hardcoded to "Dr. Arvind Kumar", stats are dynamic
- Appointments: Full consultation wizard is impressive (5-step flow with timer)
- Filters/calendar are decorative (hardcoded dates)
- Profile: May crash — missing `storage.js` include
- Patient Records: Functional
- Score: **45 / 100**

### 🟡 Administrator (Pre-seeded Login)
**PARTIALLY FUNCTIONAL**
- Login works (via admin credentials)
- Dashboard: KPIs and charts load dynamically (most complete page)
- Doctor/Patient/Appointment management: View/Search work; Register works but some XSS; Quick Actions fake
- Reports: Only 2 static report types
- Audit Logs: Functional with filters/search
- Content: Well-built CMS editor (only page with proper `esc()`)
- Settings: Theme/i18n decorative only
- Score: **50 / 100**

---

## Systemic Patterns Requiring Architectural Fix

1. **Auth Guard System** — Need a shared `auth-guard.js` that checks `sessionStorage` role/ID on every portal page and redirects to login if missing.

2. **XSS Escaping** — The `esc()` helper exists in `content.html` and some patient pages. Need to extract to `shared/utils/escape.js` and apply globally to ALL `innerHTML` assignments.

3. **Dark Mode** — Theme toggle button needs to be added to the portal sidebar/header (it already works via `localStorage` + CSS vars — just needs the UI trigger).

4. **Theme Init Script** — 90 lines copy-pasted into every page. Extract to `shared/utils/theme-init.js` loaded once.

5. **Registration Flow** — `register.html` needs to: load `storage.js`, hash password via `StorageDB.hashPassword()`, check duplicate username/email, call `StorageDB.savePatient()`, then redirect.

6. **Profile Persistence** — Both patient and doctor profiles need actual StorageDB integration for load/save.

---

## Comparison: Before vs After Critical Fixes (Sprint 1)

| Metric | Before Sprint 1 | After Sprint 1 | Current UAT |
|---|---|---|---|
| Plaintext passwords in storage | Yes | Fixed (hashed) | ✅ |
| XSS in patient pages | Yes | Partially fixed | ⚠️ 8+ pages still vulnerable |
| Logout clears session | No | Fixed | ✅ |
| Double-submit prevention | No | Partially fixed | ⚠️ Button ID mismatch |
| Slot conflict checking | No | Fixed | ✅ |
| Status transition validation | No | Fixed | ✅ |
| Auth guards | None | Still none | ❌ |
| Registration saves data | Never worked | Still broken | ❌ |
| Profile saves data | Never worked | Still broken | ❌ |

---

*Report generated by automated UAT scan. All findings are from static code analysis — no runtime browser testing performed. Some issues may behave differently in actual browser execution due to script load order or CDN availability.*
