document.addEventListener('DOMContentLoaded', function () {

  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');
  var ham = document.getElementById('hamburger-btn');

  function toggle() {
    if (!sidebar) return;
    var o = sidebar.classList.toggle('open');
    localStorage.setItem('medtrackSidebarState', o ? 'open' : 'closed');
    if (window.innerWidth <= 1280 && overlay) overlay.classList.toggle('open', o);
  }
  function closeS() {
    if (sidebar) {
      sidebar.classList.remove('open');
      localStorage.setItem('medtrackSidebarState', 'closed');
    }
    if (overlay) overlay.classList.remove('open');
  }
  if (ham) ham.addEventListener('click', toggle);
  var sc = document.getElementById('sidebar-close');
  if (sc) sc.addEventListener('click', closeS);
  if (overlay) overlay.addEventListener('click', closeS);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeS(); });
  requestAnimationFrame(function() { if (sidebar) sidebar.classList.add('sidebar-animate'); });

  // ── Search Logic (Debounced) ──
  const searchInput = document.getElementById('patient-search-input');
  const searchDropdown = document.getElementById('search-results-dropdown');
  let searchTimeout = null;
  const mockDatabase = [
    { type: 'Doctor', name: 'Dr. Arvind Kumar', specialty: 'Cardiology' },
    { type: 'Doctor', name: 'Dr. Meena Iyer', specialty: 'General Medicine' },
    { type: 'Doctor', name: 'Dr. Rohit Sharma', specialty: 'Orthopedics' },
    { type: 'Department', name: 'Cardiology', specialty: 'Heart Health' },
    { type: 'Symptom', name: 'Chest Pain', specialty: 'Consult a Cardiologist' }
  ];
  if (searchInput && searchDropdown) {
    searchInput.addEventListener('input', function (e) {
      const query = e.target.value.toLowerCase().trim();
      clearTimeout(searchTimeout);
      if (query.length < 2) { searchDropdown.style.display = 'none'; return; }
      searchDropdown.style.display = 'block';
      searchDropdown.innerHTML = '<div class="p-3 text-center text-muted"><div class="spinner-border spinner-border-sm me-2" role="status"></div>Searching...</div>';
      searchTimeout = setTimeout(function () {
        var results = mockDatabase.filter(function (item) {
          return item.name.toLowerCase().includes(query) || item.specialty.toLowerCase().includes(query);
        });
        if (results.length === 0) {
          searchDropdown.innerHTML = '<div class="p-3 text-center text-muted">No results found for "' + query + '"</div>';
        } else {
          var html = '<div class="list-group list-group-flush">';
          results.forEach(function (res) {
            var icon = '';
            if (res.type === 'Doctor') icon = '<circle cx="12" cy="7" r="4"></circle><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>';
            else if (res.type === 'Department') icon = '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>';
            else icon = '<path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>';
            html += '<a href="book-appointment.html" class="list-group-item list-group-item-action p-3 d-flex align-items-center gap-3">' +
              '<div class="rounded-circle d-flex align-items-center justify-content-center" style="width:32px;height:32px;background:var(--primary-light);color:var(--primary-brand);">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + icon + '</svg></div>' +
              '<div><div class="fw-bold text-dark" style="font-size:0.85rem;">' + res.name + '</div>' +
              '<div class="text-muted" style="font-size:0.75rem;">' + res.type + ' &bull; ' + res.specialty + '</div></div></a>';
          });
          html += '</div>';
          searchDropdown.innerHTML = html;
        }
      }, 300);
    });
    document.addEventListener('click', function (e) {
      if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) searchDropdown.style.display = 'none';
    });
  }

  // ── Utility ──
  function getPatientId() { return sessionStorage.getItem('currentPatientId') || 'PAT-1001'; }
  function timeAgo(iso) {
    if (!iso) return '';
    var diff = Date.now() - new Date(iso).getTime();
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + ' min ago';
    var hours = Math.floor(mins / 60);
    if (hours < 24) return hours + 'h ago';
    var days = Math.floor(hours / 24);
    if (days < 7) return days + 'd ago';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // ── Greeting ──
  function updateGreeting() {
    var el = document.querySelector('.greeting-heading');
    if (!el) return;
    var hour = new Date().getHours();
    var g = 'Good Morning';
    if (hour >= 12 && hour < 17) g = 'Good Afternoon';
    else if (hour >= 17) g = 'Good Evening';
    var name = sessionStorage.getItem('patientName') || 'Patient';
    el.textContent = g + ', ' + name + ' \uD83D\uDC4B';
  }

  // ── KPI Counts ──
  function renderKPIs() {
    if (!window.StorageDB) return;
    var pid = getPatientId();
    var all = window.StorageDB.getAppointments().filter(function (a) { return a.patientId === pid; });
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var upcoming = all.filter(function (a) {
      if (a.status !== 'Booked') return false;
      var d = new Date(a.appointmentDate + 'T00:00:00');
      return d >= today;
    }).length;
    var completed = all.filter(function (a) { return a.status === 'Completed'; }).length;
    var rxCount = window.StorageDB.getPrescriptionsForPatient(pid).length;
    var recordCount = all.length;

    var counts = document.querySelectorAll('#kpiRow .kpi-count');
    if (counts[0]) counts[0].textContent = upcoming;
    if (counts[1]) counts[1].textContent = completed;
    if (counts[2]) counts[2].textContent = rxCount;
    if (counts[3]) counts[3].textContent = recordCount;
  }

  // ── Recent Appointments (last 4, all statuses) ──
  function renderRecentAppts() {
    var container = document.getElementById('recentApptsList');
    if (!container || !window.StorageDB) return;
    var pid = getPatientId();
    var appts = window.StorageDB.getAppointments().filter(function (a) { return a.patientId === pid; });
    appts.sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
    appts = appts.slice(0, 4);
    if (!appts.length) {
      container.innerHTML = '<div class="text-center text-muted py-3" style="font-size:0.85rem;">No appointments yet.</div>';
      return;
    }
    var html = '';
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    for (var i = 0; i < appts.length; i++) {
      var a = appts[i];
      var d = new Date(a.appointmentDate + 'T00:00:00');
      var day = d.getDate(), mon = months[d.getMonth()];
      var statusBadge = a.status === 'Completed' ? '<span class="badge" style="background:var(--primary-light);color:var(--primary-brand);font-weight:500;">Completed</span>'
        : a.status === 'Cancelled' || a.status === 'NoShow' ? '<span class="badge text-danger" style="background:#FEF2F2;font-weight:500;">' + a.status + '</span>'
        : '<span class="badge" style="background:#DBEAFE;color:#1D4ED8;font-weight:500;">' + a.status + '</span>';
      var border = i < appts.length - 1 ? ' border-bottom border-light' : '';
      html += '<div class="list-group-item bg-transparent px-0 py-2 d-flex align-items-center gap-3' + border + '">' +
        '<div class="text-center rounded-3 p-2" style="width:56px;background:var(--primary-light);color:var(--primary-brand) !important;">' +
        '<div class="fw-bold fs-5 lh-1 mb-1">' + day + '</div><div style="font-size:0.75rem;" class="fw-medium">' + mon + '</div></div>' +
        '<div class="flex-grow-1"><div class="fw-bold text-dark">' + (a.doctorName || 'Doctor') + '</div>' +
        '<div class="text-muted d-flex align-items-center gap-2" style="font-size:0.75rem;">' + (a.department || '') + '<br>' + a.startTime + '</div></div>' +
        '<div>' + statusBadge + '</div></div>';
    }
    container.innerHTML = html;
  }

  // ── Header Notification Dropdown ──
  function renderNotifDropdown() {
    var container = document.getElementById('notifDropdownList');
    if (!container) return;
    if (!window.StorageDB) {
      container.innerHTML = '<div class="p-3 text-center text-muted" style="font-size:0.8rem;">No notifications.</div>';
      return;
    }
    var notifs = window.StorageDB.getNotificationsForRecipient('patient', getPatientId()).slice(0, 5);
    if (!notifs.length) {
      container.innerHTML = '<div class="p-4 text-center"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--primary-brand);opacity:0.5;margin-bottom:8px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg><div class="fw-bold text-dark mb-1" style="font-size:0.85rem;">All caught up!</div><div class="text-muted" style="font-size:0.75rem;">You have no new notifications.</div></div>';
      return;
    }
    var html = '';
    for (var i = 0; i < notifs.length; i++) {
      var n = notifs[i];
      var icon = n.type === 'appointment' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
      html += '<a href="notifications.html" class="list-group-item list-group-item-action p-3 border-bottom-0" style="background:var(--bg-card);">' +
        '<div class="d-flex gap-3"><div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width:32px;height:32px;background:var(--primary-light);color:var(--primary-brand);">' + icon + '</div>' +
        '<div><p class="mb-1 fw-bold" style="color:var(--dark-text);font-size:0.8rem;line-height:1.3;">' + n.title + '</p>' +
        '<p class="mb-0 text-muted" style="font-size:0.7rem;">' + (n.message || '').substring(0, 60) + '</p></div></div></a>';
    }
    container.innerHTML = html;
  }

  // ── Notification Section Cards ──
  function renderNotifSection() {
    var container = document.getElementById('notifSectionCards');
    if (!container || !window.StorageDB) return;
    var notifs = window.StorageDB.getNotificationsForRecipient('patient', getPatientId()).slice(0, 3);
    if (!notifs.length) {
      container.innerHTML = '<div class="col-12 text-center text-muted py-3" style="font-size:0.85rem;">No notifications yet.</div>';
      return;
    }
    var html = '';
    var icons = {
      appointment: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
      warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>',
      success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
    };
    for (var i = 0; i < notifs.length; i++) {
      var n = notifs[i];
      var svg = icons[n.type] || icons.appointment;
      html += '<div class="col-md-4"><div class="d-flex gap-3 p-3 rounded-3 border h-100" style="background:var(--bg-neutral);border-color:var(--light-border);">' +
        '<div class="flex-shrink-0 mt-1"><div class="rounded-circle d-flex align-items-center justify-content-center" style="width:32px;height:32px;background:var(--primary-light);color:var(--primary-brand);">' + svg + '</div></div>' +
        '<div><div class="fw-bold text-dark" style="font-size:0.8rem;">' + n.title + '</div>' +
        '<div class="text-muted mt-1" style="font-size:0.75rem;line-height:1.3;">' + (n.message || '').substring(0, 70) + '</div>' +
        '<div class="text-muted mt-2" style="font-size:0.7rem;">' + timeAgo(n.createdAt) + '</div></div></div></div>';
    }
    container.innerHTML = html;
  }

  // ── Badge Sync ──
  function syncBadges() {
    if (!window.StorageDB) return;
    var count = window.StorageDB.getUnreadNotificationCount('patient', getPatientId());
    var iconBadge = document.querySelector('.icon-badge');
    var sidebarBadge = document.getElementById('sidebarNotifBadge');
    if (iconBadge) { iconBadge.textContent = count; iconBadge.style.display = count > 0 ? '' : 'none'; }
    if (sidebarBadge) { sidebarBadge.textContent = count; sidebarBadge.style.display = count > 0 ? 'inline' : 'none'; }
  }

  // ── Mark All Read ──
  var markReadBtn = document.querySelector('.mark-all-read-btn');
  if (markReadBtn) {
    markReadBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (!window.StorageDB) return;
      window.StorageDB.markAllNotificationsRead('patient', getPatientId());
      renderNotifDropdown();
      syncBadges();
    });
  }

  // ── Init ──
  updateGreeting();
  renderKPIs();
  renderRecentAppts();
  renderNotifDropdown();
  renderNotifSection();
  syncBadges();
});
