document.addEventListener('DOMContentLoaded', function () {

  // ── Sidebar Toggle ──
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');
  var ham = document.getElementById('hamburger-btn');
  if (window.innerWidth > 1280 && sidebar) sidebar.classList.add('open');
  requestAnimationFrame(function() {
    if (sidebar) sidebar.classList.add('sidebar-animate');
  });
  function toggle() {
    if (!sidebar) return;
    var o = sidebar.classList.toggle('open');
    if (window.innerWidth <= 1280 && overlay) overlay.classList.toggle('open', o);
  }
  function closeS() { sidebar && sidebar.classList.remove('open'); overlay && overlay.classList.remove('open'); }
  if (ham) ham.addEventListener('click', toggle);
  var sc = document.getElementById('sidebar-close');
  if (sc) sc.addEventListener('click', closeS);
  if (overlay) overlay.addEventListener('click', closeS);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeS(); });

  // ── Doctor Context ──
  var currentDoctorId = sessionStorage.getItem('currentDoctorId');
  if (!currentDoctorId) {
    window.location.href = '../../features/auth/login.html?role=Doctor';
    return;
  }
  var currentDoctor = window.StorageDB.getDoctorById(currentDoctorId);
  if (!currentDoctor) {
    var allDocs = window.StorageDB.getDoctors();
    currentDoctor = allDocs.length ? allDocs[0] : { name: 'Dr. Unknown', department: 'Unknown', id: 'DOC-0000', qualification: '', email: '', contact: '' };
    currentDoctorId = currentDoctor.id;
  }

  // ── Date Helpers ──
  var today = new Date();
  var todayStr = today.toISOString().split('T')[0];
  var todayDayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  var timeStr = today.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  // ── Greeting ──
  var hour = today.getHours();
  var greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  // ── Load Data ──
  var allAppointments = window.StorageDB.getAppointments();
  var todaysAppts = allAppointments.filter(function(a) {
    return a.doctorId === currentDoctorId && a.appointmentDate === todayStr;
  });
  var completedToday = todaysAppts.filter(function(a) { return a.status === 'Completed'; }).length;
  var noShowToday = todaysAppts.filter(function(a) { return a.status === 'NoShow'; }).length;
  var bookedCount = todaysAppts.filter(function(a) { return a.status === 'Booked'; }).length;
  var pendingCount = todaysAppts.filter(function(a) { return a.status === 'Pending' || a.status === 'Booked'; }).length;
  var waitingCount = bookedCount;

  var doctorSlots = window.StorageDB.getDoctorSlots(currentDoctorId);
  var todaySlots = doctorSlots ? (doctorSlots[todayDayName] || []) : [];
  var availableCount = todaySlots.filter(function(s) { return s === 'A'; }).length;
  var totalSlotCount = todaySlots.length;

  // ── Update Hero ──
  var heroHeading = document.getElementById('heroGreeting');
  if (heroHeading) heroHeading.textContent = greeting + ', ' + currentDoctor.name;
  var heroSub = document.getElementById('heroSub');
  if (heroSub) heroSub.textContent = currentDoctor.department + ' Department \u2022 Doctor ID: ' + currentDoctor.id;
  var heroCount = document.getElementById('heroApptCount');
  if (heroCount) heroCount.textContent = todaysAppts.length;

  // ── Update Compact Stats ──
  var statAppts = document.getElementById('statAppts');
  if (statAppts) statAppts.textContent = todaysAppts.length;
  var statSlots = document.getElementById('statSlots');
  if (statSlots) statSlots.textContent = availableCount + ' / ' + totalSlotCount;
  var statCompleted = document.getElementById('statCompleted');
  if (statCompleted) statCompleted.textContent = completedToday;
  var statNoShow = document.getElementById('statNoShow');
  if (statNoShow) statNoShow.textContent = noShowToday;

  // ── Render Today's Appointments Table ──
  var todayTableBody = document.getElementById('todayApptBody');
    if (todayTableBody) {
      if (todaysAppts.length === 0) {
        todayTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4" style="font-size:0.85rem;">No appointments scheduled for today.</td></tr>';
      } else {
        var sorted = todaysAppts.slice().sort(function(a, b) { return a.startTime.localeCompare(b.startTime); });
        var rows = '';
        var e = window.StorageDB.escapeHtml;
        for (var ti = 0; ti < sorted.length; ti++) {
          var a = sorted[ti];
          var statusClass = a.status === 'Booked' ? 'status-booked' : a.status === 'Completed' ? 'status-completed' : a.status === 'Cancelled' ? 'status-cancelled' : a.status === 'NoShow' ? 'status-cancelled' : 'status-pending';
          var statusLabel = a.status === 'NoShow' ? 'No-Show' : a.status;
          var timeDisplay = a.startTime ? (function(t) { var parts = t.split(':'); var h = parseInt(parts[0], 10); var ampm = h >= 12 ? 'PM' : 'AM'; if (h > 12) h -= 12; if (h === 0) h = 12; return h + ':' + parts[1] + ' ' + ampm; })(a.startTime) : '--:--';
          rows += '<tr><td class="text-muted">' + e(timeDisplay) + '</td><td class="fw-medium text-dark">' + e(a.patientName || 'Unknown') + '</td><td class="text-muted">' + e(a.reasonForVisit && a.reasonForVisit.length > 15 ? a.reasonForVisit.substring(0, 15) + '...' : a.reasonForVisit || 'Consultation') + '</td><td class="text-end"><span class="status-badge ' + e(statusClass) + '">' + e(statusLabel) + '</span></td></tr>';
        }
        todayTableBody.innerHTML = rows;
      }
    }

  // ── Sync Notification Badges from StorageDB ──
  var headerBadge = document.getElementById('headerNotifBadge');
  var sidebarBadge = document.getElementById('sidebarNotifBadge');
  var notifCount = 0;
  var recentNotifs = [];
  if (window.StorageDB) {
    window.StorageDB.migrateOldDoctorNotifications();
    notifCount = window.StorageDB.getUnreadNotificationCount('doctor', currentDoctorId);
    recentNotifs = window.StorageDB.getNotificationsForRecipient('doctor', currentDoctorId);
  }
  if (headerBadge) {
    headerBadge.textContent = notifCount;
    headerBadge.style.display = notifCount > 0 ? '' : 'none';
  }
  if (sidebarBadge) {
    sidebarBadge.textContent = notifCount;
    sidebarBadge.style.display = notifCount > 0 ? '' : 'none';
  }

  // ── Populate Notification Dropdown ──
  var notifDropdown = document.getElementById('notifDropdownContent');
  if (notifDropdown && recentNotifs.length > 0) {
    var preview = recentNotifs.slice(0, 5);
    var esc = window.StorageDB.escapeHtml;
    var html = '<div class="list-group list-group-flush" style="max-height:300px;overflow-y:auto;">';
    for (var ni = 0; ni < preview.length; ni++) {
      var n = preview[ni];
      var unreadDot = n.read ? '' : '<span style="width:6px;height:6px;border-radius:50%;background:#047857;flex-shrink:0;"></span>';
      html += '<a class="list-group-item list-group-item-action px-3 py-2 border-0" href="../notifications/doctor-notifications.html" style="font-size:0.8rem;">' +
        '<div class="d-flex align-items-start gap-2">' + unreadDot +
        '<div><div class="fw-medium text-dark" style="line-height:1.3;">' + esc(n.title) + '</div>' +
        '<div class="text-muted" style="font-size:0.72rem;">' + esc((n.message || '').substring(0, 60)) + '</div></div></div></a>';
    }
    html += '</div>';
    notifDropdown.innerHTML = html;
    notifDropdown.classList.remove('text-center', 'py-4', 'text-muted');
    notifDropdown.className = '';
  }

  // ── Realistic Search ──
  var searchInput = document.getElementById('globalSearchInput');
  var searchDropdown = document.getElementById('searchResultsDropdown');

  if (searchInput && searchDropdown) {
    var searchData = [];
    var allPatients = window.StorageDB.getPatients();
    for (var si = 0; si < allPatients.length; si++) {
      var p = allPatients[si];
      searchData.push({ id: p.id, type: 'patient', name: p.name, detail: p.department + ' | ' + p.contact, link: '../patient-records/patient-records.html' });
    }
    var recentApptsForSearch = allAppointments.filter(function(a) { return a.doctorId === currentDoctorId; });
    for (var si2 = 0; si2 < recentApptsForSearch.length; si2++) {
      var sa = recentApptsForSearch[si2];
      searchData.push({ id: sa.id, type: 'appointment', name: (sa.patientName || 'Patient') + ' (' + sa.id + ')', detail: sa.appointmentDate + ' ' + sa.startTime + ' - ' + (sa.reasonForVisit || 'Consultation'), link: '../appointments/doctor-appointments.html' });
    }

    var debounceTimer;
    var bsDropdown = new bootstrap.Dropdown(searchInput);

    var defaultStateHTML = '<li><h6 class="dropdown-header text-muted fw-bold">Quick Links</h6></li>' +
      '<li><a class="dropdown-item d-flex align-items-center gap-2 py-2" href="../appointments/doctor-appointments.html"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> View my appointments</a></li>' +
      '<li><a class="dropdown-item d-flex align-items-center gap-2 py-2" href="../patient-records/patient-records.html"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Search patient records</a></li>';

    var getIcon = function(type) {
      if (type === 'patient') return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>';
    };

    var performSearch = function(query) {
      var q = query.toLowerCase().trim();
      if (q.length < 2) {
        searchDropdown.innerHTML = defaultStateHTML;
        return;
      }
      searchDropdown.innerHTML = '<li><span class="dropdown-item text-muted py-2">Searching...</span></li>';
      setTimeout(function() {
        var results = searchData.filter(function(item) {
          return item.name.toLowerCase().includes(q) ||
                 item.detail.toLowerCase().includes(q) ||
                 item.id.toLowerCase().includes(q);
        });
        if (results.length === 0) {
          searchDropdown.innerHTML = '<li><span class="dropdown-item text-muted py-2">No results found for "<b>' + query + '</b>"</span></li>';
          return;
        }
        var html = '<li><h6 class="dropdown-header text-muted fw-bold">Search Results (' + results.length + ')</h6></li>';
        for (var ri2 = 0; ri2 < results.length; ri2++) {
          var res = results[ri2];
          html += '<li><a class="dropdown-item d-flex align-items-start gap-2 py-2" href="' + (res.link || '#') + '"><div class="mt-1 text-success">' + getIcon(res.type) + '</div><div><div class="fw-bold" style="font-size:0.85rem;">' + res.name + '</div><div class="text-muted" style="font-size:0.75rem;">' + res.detail + '</div></div></a></li>';
        }
        searchDropdown.innerHTML = html;
      }, 300);
    };

    searchInput.addEventListener('focus', function() {
      if (searchInput.value.trim().length < 2) searchDropdown.innerHTML = defaultStateHTML;
      bsDropdown.show();
    });
    searchInput.addEventListener('input', function(e) {
      bsDropdown.show();
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() { performSearch(e.target.value); }, 300);
    });
    document.addEventListener('click', function(e) {
      if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) bsDropdown.hide();
    });
  }

  // ── Profile Avatar Click ──
  var profileAvatar = document.querySelector('.profile-avatar');
  if (profileAvatar) {
    profileAvatar.style.cursor = 'pointer';
    profileAvatar.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      window.location.assign('../profile/doctor-profile.html');
    }, true);
  }

  // ── Logout handler ──
  document.querySelectorAll('a[href*="index.html"]').forEach(function(link) {
    if (link.textContent.trim().indexOf('Logout') !== -1 || link.classList.contains('logout-link')) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        if (window.StorageDB && window.StorageDB.addAuditLog) {
          window.StorageDB.addAuditLog(sessionStorage.getItem('doctorName') || 'Doctor', 'Logout', 'Session', 'User logged out');
        }
        sessionStorage.clear();
        window.location.href = link.getAttribute('href');
      });
    }
  });

});
