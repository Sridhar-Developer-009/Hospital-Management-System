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

  // ── Patient-Scoped Search ──
  const esc = window.StorageDB ? StorageDB.escapeHtml : function(s){return String(s||'').replace(/[&<>"']/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];});};
  const searchInput = document.getElementById('patient-search-input');
  const searchDropdown = document.getElementById('search-results-dropdown');
  let searchTimeout = null;
  if (searchInput && searchDropdown) {
    searchInput.addEventListener('input', function (e) {
      const query = e.target.value.toLowerCase().trim();
      clearTimeout(searchTimeout);
      if (query.length < 2) { searchDropdown.style.display = 'none'; return; }
      searchDropdown.style.display = 'block';
      searchDropdown.innerHTML = '<div class="p-3 text-center text-muted"><div class="spinner-border spinner-border-sm me-2" role="status"></div>Searching...</div>';
      searchTimeout = setTimeout(function () {
        if (!window.StorageDB) { searchDropdown.innerHTML = '<div class="p-3 text-center text-muted">Search unavailable</div>'; return; }
        var pid = sessionStorage.getItem('currentPatientId') || '';
        var results = [];
        // Search appointments
        var appts = window.StorageDB.getAppointments().filter(function(a) { return a.patientId === pid; });
        appts.forEach(function(a) {
          var searchable = (a.doctorName || '') + ' ' + (a.department || '') + ' ' + (a.appointmentDate || '') + ' ' + (a.reasonForVisit || '');
          if (searchable.toLowerCase().includes(query)) {
            results.push({ type: 'Appointment', title: a.doctorName + ' (' + a.department + ')', subtitle: a.appointmentDate + ' - ' + a.status, link: '../appointments/patient-appointments.html', icon: 'calendar' });
          }
        });
        // Search prescriptions
        var rxs = window.StorageDB.getPrescriptionsForPatient(pid);
        rxs.forEach(function(rx) {
          var searchable = (rx.doctorName || '') + ' ' + (rx.id || '') + ' ' + (rx.diagnosis || '');
          (rx.medicines || []).forEach(function(m) { searchable += ' ' + (m.name || ''); });
          if (searchable.toLowerCase().includes(query)) {
            results.push({ type: 'Prescription', title: 'Rx #' + rx.id + ' - ' + (rx.doctorName || ''), subtitle: (rx.diagnosis || 'Prescription'), link: '../prescriptions/patient-prescriptions.html', icon: 'prescription' });
          }
        });
        // Search medical records
        var records = window.StorageDB.getMedicalRecords(pid);
        records.forEach(function(r) {
          var searchable = (r.title || '') + ' ' + (r.doctorName || '') + ' ' + (r.diagnosis || '') + ' ' + (r.clinicalNotes || '');
          if (searchable.toLowerCase().includes(query)) {
            results.push({ type: 'Medical Record', title: r.title || 'Visit', subtitle: (r.doctorName || '') + ' - ' + (r.date || ''), link: '../medical-history/medical-history.html', icon: 'file' });
          }
        });
        if (results.length === 0) {
          searchDropdown.innerHTML = '<div class="p-3 text-center text-muted">No results found for "' + esc(query) + '"</div>';
        } else {
          var icons = {
            calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>',
            prescription: '<path d="M10 2v7.31"></path><path d="M14 9.3V1.99"></path><path d="M8.5 2h7"></path><path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path><path d="M5.52 16h12.96"></path>',
            file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line>'
          };
          var html = '<div class="list-group list-group-flush">';
          results.slice(0, 8).forEach(function(res) {
            var iconSvg = icons[res.icon] || icons.calendar;
            html += '<a href="' + res.link + '" class="list-group-item list-group-item-action p-3 d-flex align-items-center gap-3">' +
              '<div class="rounded-circle d-flex align-items-center justify-content-center" style="width:32px;height:32px;background:var(--primary-light);color:var(--primary-brand);">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + iconSvg + '</svg></div>' +
              '<div><div class="fw-bold text-dark" style="font-size:0.85rem;">' + esc(res.title) + '</div>' +
              '<div class="text-muted" style="font-size:0.75rem;">' + res.type + ' &bull; ' + esc(res.subtitle) + '</div></div></a>';
          });
          html += '</div>';
          if (results.length > 8) html += '<div class="p-2 text-center text-muted" style="font-size:0.75rem;">' + (results.length - 8) + ' more results. Refine your search.</div>';
          searchDropdown.innerHTML = html;
        }
      }, 300);
    });
    document.addEventListener('click', function (e) {
      if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) searchDropdown.style.display = 'none';
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && searchDropdown.style.display !== 'none') searchDropdown.style.display = 'none';
    });
  }

  // ── Utility ──
  function getPatientId() {
    var pid = sessionStorage.getItem('currentPatientId');
    if (!pid) { window.location.href = '../../features/auth/login.html?role=Patient'; return ''; }
    return pid;
  }
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
    var e = window.StorageDB.escapeHtml;
    for (var i = 0; i < appts.length; i++) {
      var a = appts[i];
      var d = new Date(a.appointmentDate + 'T00:00:00');
      var day = d.getDate(), mon = months[d.getMonth()];
      var statusBadge = a.status === 'Completed' ? '<span class="badge" style="background:var(--primary-light);color:var(--primary-brand);font-weight:500;">Completed</span>'
        : a.status === 'Cancelled' || a.status === 'NoShow' ? '<span class="badge text-danger" style="background:#FEF2F2;font-weight:500;">' + e(a.status) + '</span>'
        : '<span class="badge" style="background:var(--primary-light, #D1FAE5);color:var(--primary-brand, #047857);font-weight:500;">' + e(a.status) + '</span>';
      var border = i < appts.length - 1 ? ' border-bottom border-light' : '';
      html += '<div class="list-group-item bg-transparent px-0 py-2 d-flex align-items-center gap-3' + border + '">' +
        '<div class="text-center rounded-3 p-2" style="width:56px;background:var(--primary-light);color:var(--primary-brand) !important;">' +
        '<div class="fw-bold fs-5 lh-1 mb-1">' + day + '</div><div style="font-size:0.75rem;" class="fw-medium">' + mon + '</div></div>' +
        '<div class="flex-grow-1"><div class="fw-bold text-dark">' + e(a.doctorName || 'Doctor') + '</div>' +
        '<div class="text-muted d-flex align-items-center gap-2" style="font-size:0.75rem;">' + e(a.department || '') + '<br>' + e(a.startTime || '') + '</div></div>' +
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
    var e = window.StorageDB.escapeHtml;
    for (var i = 0; i < notifs.length; i++) {
      var n = notifs[i];
      var icon = n.type === 'appointment' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
      html += '<a href="notifications.html" class="list-group-item list-group-item-action p-3 border-bottom-0" style="background:var(--bg-card);">' +
        '<div class="d-flex gap-3"><div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width:32px;height:32px;background:var(--primary-light);color:var(--primary-brand);">' + icon + '</div>' +
        '<div><p class="mb-1 fw-bold" style="color:var(--dark-text);font-size:0.8rem;line-height:1.3;">' + e(n.title) + '</p>' +
        '<p class="mb-0 text-muted" style="font-size:0.7rem;">' + e((n.message || '').substring(0, 60)) + '</p></div></div></a>';
    }
    container.innerHTML = html;
  }

  // ── Toast Notification ──
  if (!document.getElementById('medtrack-toast-style')) {
    var ts = document.createElement('style');
    ts.id = 'medtrack-toast-style';
    ts.textContent = '@keyframes slideUp{from{transform:translateY(20px);opacity:0;}to{transform:translateY(0);opacity:1;}}';
    document.head.appendChild(ts);
  }
  function showToast(message, type) {
    type = type || 'success';
    var existing = document.querySelector('.medtrack-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'medtrack-toast';
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;padding:16px 24px;border-radius:12px;font-size:0.9rem;font-weight:500;box-shadow:0 8px 24px rgba(0,0,0,0.15);max-width:400px;animation:slideUp 0.3s ease;color:#fff;';
    if (type === 'success') toast.style.background = '#059669';
    else if (type === 'error') toast.style.background = '#DC2626';
    else toast.style.background = '#2563EB';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
    }, 4000);
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

  // ── Profile Avatar Sync ──
  function syncProfileAvatar() {
    var name = sessionStorage.getItem('patientName');
    var id = sessionStorage.getItem('currentPatientId');
    var nameEl = document.querySelector('.profile-name');
    var roleEl = document.querySelector('.profile-role');
    var avatarEl = document.querySelector('.profile-avatar');
    if (nameEl) nameEl.textContent = name || 'Patient';
    if (roleEl) roleEl.textContent = id || '-';
    if (avatarEl && name) {
      var initials = name.split(' ').map(function(s) { return s[0]; }).filter(function(s) { return s; }).join('').substring(0, 2).toUpperCase();
      avatarEl.textContent = initials || '?';
    }
  }

  // ── Logout handler ──
  document.querySelectorAll('a[href*="index.html"]').forEach(function(link) {
    if (link.textContent.trim().indexOf('Logout') !== -1 || link.classList.contains('logout-link')) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        if (window.StorageDB && window.StorageDB.addAuditLog) {
          window.StorageDB.addAuditLog(sessionStorage.getItem('patientName') || 'Patient', 'Logout', 'Session', 'User logged out');
        }
        sessionStorage.clear();
        window.location.href = link.getAttribute('href');
      });
    }
  });

  // ── Init ──
  syncProfileAvatar();
  updateGreeting();
  renderKPIs();
  renderRecentAppts();
  renderNotifDropdown();
  syncBadges();
});
