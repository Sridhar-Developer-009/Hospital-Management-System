/* CityCare Admin Dashboard */

document.addEventListener('DOMContentLoaded', () => {

  // ── 0. Auth Guard ─────────────────────────────────────────────────────
  if (!sessionStorage.getItem('currentAdminId')) {
    window.location.href = '../../features/auth/login.html?role=Admin';
    return;
  }

  // ── 1. Sidebar Toggle ────────────────────────────────────────────────
  const sidebar          = document.getElementById('sidebar');
  const sidebarOverlay   = document.getElementById('sidebar-overlay');
  const hamburgerBtn     = document.getElementById('hamburger-btn');
  const sidebarCloseBtn  = document.getElementById('sidebar-close');

  // Open sidebar by default on desktop
  if (window.innerWidth > 1280) {
    sidebar.classList.add('open');
  }
  requestAnimationFrame(function() {
    if (sidebar) sidebar.classList.add('sidebar-animate');
  });

  function toggleSidebar() {
    const isOpen = sidebar.classList.toggle('open');
    if (window.innerWidth <= 1280) {
      sidebarOverlay.classList.toggle('open', isOpen);
    }
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    if (window.innerWidth <= 1280) {
      sidebarOverlay.classList.remove('open');
    }
  }

  if (hamburgerBtn)     hamburgerBtn.addEventListener('click', toggleSidebar);
  if (sidebarCloseBtn)  sidebarCloseBtn.addEventListener('click', closeSidebar);
  if (sidebarOverlay)   sidebarOverlay.addEventListener('click', closeSidebar);

  // Close sidebar on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });

  // Re-check on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth > 1280 && !sidebar.classList.contains('open')) {
        // Don't auto-open, let user control
      }
      if (window.innerWidth <= 1280) {
        sidebarOverlay.classList.remove('open');
      }
    }, 200);
  });

  // ── 2. Live Clock ────────────────────────────────────────────────────
  function updateTime() {
    const el = document.getElementById('system-time');
    if (!el) return;
    const now = new Date();
    const opts = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
    el.textContent = now.toLocaleDateString('en-GB', opts).replace(',', '');
  }
  setInterval(updateTime, 1000);
  updateTime();

  // ── 3. Dynamic breadcrumbs ──────────────────────────────────────────
  function updateBreadcrumb() {
    const currentEl = document.querySelector('.breadcrumb-current');
    if (!currentEl) return;
    // If there's a URL hash (e.g., #appointments), show it in breadcrumb
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const name = hash.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      document.querySelector('.breadcrumb-sep:last-of-type')?.remove();
      currentEl.insertAdjacentHTML('beforebegin', `
        <svg class="breadcrumb-sep" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        <a href="#" class="breadcrumb-link">${name}</a>
      `);
    }
  }
  updateBreadcrumb();

  // ── 4. Notification & Message Dropdowns ─────────────────────────────
  const notifBtn = document.getElementById('notif-btn');
  const notifDropdown = document.getElementById('notif-dropdown');
  const notifBody = document.getElementById('notif-dropdown-body');
  const msgBtn = document.getElementById('msg-btn');
  const msgDropdown = document.getElementById('msg-dropdown');
  const msgBody = document.getElementById('msg-dropdown-body');

  const msgData = [
    { from: 'Dr. Sarah Chen',   subject: 'Reschedule Request #APT-1024', preview: 'Requesting to move appointment to 2:00 PM slot.', time: '5 min ago', avatar: 'SC', color: '#047857', unread: true },
    { from: 'System Alert',     subject: 'EMR Backup Completed',        preview: 'Nightly backup finished successfully — 1.2 GB.',   time: '1 hour ago', avatar: 'SA', color: '#2563EB', unread: true },
    { from: 'Dr. Mark Thompson',subject: 'Availability Update',         preview: 'Updated weekly schedule. New slots open Mon-Wed.', time: '3 hours ago', avatar: 'MT', color: '#EA580C', unread: false },
    { from: 'HR Department',    subject: 'Staff Onboarding Reminder',   preview: 'Dr. Lisa Wang onboarding scheduled for tomorrow.',  time: '1 day ago',  avatar: 'HR', color: '#7C3AED', unread: false },
  ];

  const dropdownIconMap = {
    green:  { bg: '#ECFDF5', color: '#059669', svg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>' },
    blue:   { bg: '#EFF6FF', color: '#2563EB', svg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>' },
    orange: { bg: '#FFF7ED', color: '#EA580C', svg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>' },
    red:    { bg: '#FEF2F2', color: '#DC2626', svg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>' },
  };

  function closeAllDropdowns() {
    notifDropdown?.classList.remove('open');
    msgDropdown?.classList.remove('open');
  }

  function populateDropdown(bodyEl, items, iconMap, iconKey) {
    if (!bodyEl) return;
    var e = window.StorageDB ? window.StorageDB.escapeHtml : function(s) { return s || ''; };
    bodyEl.innerHTML = items.map(item => `
      <div class="dropdown-item${item.unread ? ' unread' : ''}">
        <div class="dropdown-item-icon" style="background:${iconMap[item.icon].bg};color:${iconMap[item.icon].color}">${iconMap[item.icon].svg}</div>
        <div class="dropdown-item-body">
          <div class="dropdown-item-text">${e(item.text)}</div>
          <div class="dropdown-item-time">${e(item.time)}</div>
        </div>
      </div>
    `).join('');
  }

  // Populate notifications from StorageDB always
  if (window.StorageDB && notifBody) {
    var dbNotifs = window.StorageDB.getNotificationsForRecipient('admin', null).slice(0, 5);
    if (dbNotifs.length) {
      var mappedNotifs = dbNotifs.map(function(n) {
        var timeAgo = (function(iso) {
          if (!iso) return '';
          var diff = Date.now() - new Date(iso).getTime();
          var mins = Math.floor(diff / 60000);
          if (mins < 1) return 'Just now';
          if (mins < 60) return mins + ' min ago';
          var hours = Math.floor(mins / 60);
          if (hours < 24) return hours + 'h ago';
          return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        })(n.createdAt);
        var icon = n.type === 'warning' || n.type === 'system' ? 'orange' :
                   n.type === 'appointment' || n.type === 'info' ? 'blue' :
                   n.type === 'success' ? 'green' : 'red';
        return { text: n.title, time: timeAgo, icon: icon, unread: !n.read };
      });
      populateDropdown(notifBody, mappedNotifs, dropdownIconMap, 'icon');
    } else {
      notifBody.innerHTML = '<div class="p-3 text-center text-muted" style="font-size:0.8rem;">No notifications yet.</div>';
    }
  }

  // Populate messages (rich sender avatars)
  if (msgBody) {
    var e = window.StorageDB ? window.StorageDB.escapeHtml : function(s) { return s || ''; };
    msgBody.innerHTML = msgData.map((m, i) => `
      <div class="dropdown-item${m.unread ? ' unread' : ''}" data-msg-index="${i}">
        <div class="dropdown-item-avatar" style="background:${m.color};color:#fff">
          ${m.avatar}
        </div>
        <div class="dropdown-item-body">
          <div class="d-flex justify-content-between align-items-start">
            <strong style="font-size:0.82rem;color:#2D2A24">${e(m.from)}</strong>
            ${m.unread ? '<span class="badge bg-danger rounded-pill" style="font-size:0.6rem">NEW</span>' : ''}
          </div>
          <div style="font-size:0.78rem;font-weight:600;color:#2D2A24;margin-top:1px">${e(m.subject)}</div>
          <div style="font-size:0.76rem;color:#7A7268;margin-top:2px">${e(m.preview)}</div>
          <div class="dropdown-item-time">${e(m.time)}</div>
        </div>
      </div>
    `).join('');

    // Mark as read on click
    msgBody.querySelectorAll('.dropdown-item').forEach(el => {
      el.addEventListener('click', function() {
        this.classList.remove('unread');
        const badge = this.querySelector('.badge');
        if (badge) badge.remove();
        const idx = this.dataset.msgIndex;
        if (msgData[idx]) msgData[idx].unread = false;
        updateMsgBadge();
      });
    });
  }

  function updateMsgBadge() {
    const unread = msgData.filter(m => m.unread).length;
    const badge = document.querySelector('#msg-btn .icon-badge');
    if (badge) {
      badge.textContent = unread;
      if (unread === 0) badge.style.display = 'none';
      else badge.style.display = '';
    }
    const countEl = document.querySelector('#msg-dropdown .dropdown-count');
    if (countEl) countEl.textContent = `${unread} unread`;
  }

  function syncNotifBadge() {
    if (!window.StorageDB) return;
    var count = window.StorageDB.getUnreadNotificationCount('admin', null);
    var badge = document.getElementById('notif-btn')?.querySelector('.icon-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count === 0 ? 'none' : '';
    }
    var sidebarBadge = document.getElementById('sidebarNotifBadge');
    if (sidebarBadge) sidebarBadge.textContent = count;
    var notifDropdownCount = document.getElementById('notifDropdownCount');
    if (notifDropdownCount) notifDropdownCount.textContent = count + ' new';
  }
  syncNotifBadge();

  // Toggle notifications
  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      msgDropdown?.classList.remove('open');
      notifDropdown.classList.toggle('open');
    });
  }

  // Toggle messages
  if (msgBtn && msgDropdown) {
    msgBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown?.classList.remove('open');
      msgDropdown.classList.toggle('open');
    });
  }

  // Close on click outside
  document.addEventListener('click', (e) => {
    const isNotif = notifBtn?.parentElement.contains(e.target);
    const isMsg = msgBtn?.parentElement.contains(e.target);
    if (!isNotif && !isMsg) closeAllDropdowns();
  });

  // ── 5. Greeting Based on Time of Day ─────────────────────────────────
  const heroTitle = document.querySelector('.hero-banner-title');
  if (heroTitle) {
    const hour = new Date().getHours();
    let greeting = 'Good Morning';
    if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
    else if (hour >= 17) greeting = 'Good Evening';
    heroTitle.textContent = `${greeting}, Admin!`;
  }

  // ── Global Search (doctors + patients) ──────────────────────────────
  (function setupGlobalSearch() {
    const searchBox = document.querySelector('.header-search');
    const searchInput = searchBox ? searchBox.querySelector('input') : null;
    if (!searchBox || !searchInput) return;

    searchBox.style.position = 'relative';

    const resultsEl = document.createElement('div');
    resultsEl.className = 'header-dropdown';
    resultsEl.id = 'global-search-dropdown';
    resultsEl.style.left = '0';
    resultsEl.style.right = 'auto';
    resultsEl.style.width = '360px';
    resultsEl.innerHTML = `
      <div class="dropdown-header">
        <span class="dropdown-title">Search Results</span>
        <span class="dropdown-count" id="global-search-count">0</span>
      </div>
      <div class="dropdown-body" id="global-search-body"></div>
    `;
    searchBox.appendChild(resultsEl);
    const bodyEl = resultsEl.querySelector('#global-search-body');
    const countEl = resultsEl.querySelector('#global-search-count');

    function esc(s) {
      return window.StorageDB && StorageDB.escapeHtml ? StorageDB.escapeHtml(String(s == null ? '' : s)) : String(s == null ? '' : s);
    }

    function matches(fields, q) {
      return fields.some(f => f != null && String(f).toLowerCase().includes(q));
    }

    function renderResults(query) {
      const q = query.trim().toLowerCase();
      if (!q) {
        resultsEl.classList.remove('open');
        bodyEl.innerHTML = '';
        return;
      }

      const doctors = (window.StorageDB ? StorageDB.getDoctors() || [] : []).filter(d =>
        matches([d.id, d.name, d.email, d.contact, d.department, d.qualification, d.username], q)
      ).map(d => ({ type: 'Doctor', id: d.id, name: d.name, sub: `${d.department || ''} · ${d.email || ''}` }));

      const patients = (window.StorageDB ? StorageDB.getPatients() || [] : []).filter(p =>
        matches([p.id, p.name, p.email, p.contact, p.department, p.username], q)
      ).map(p => ({ type: 'Patient', id: p.id, name: p.name, sub: `${p.department || ''} · ${p.email || ''}` }));

      const results = doctors.concat(patients).slice(0, 12);
      countEl.textContent = results.length;

      if (!results.length) {
        bodyEl.innerHTML = `<div class="dropdown-item"><div class="dropdown-item-body"><div class="dropdown-item-text text-muted">No matches found.</div></div></div>`;
      } else {
        bodyEl.innerHTML = results.map(r => `
          <div class="dropdown-item" data-type="${r.type}" data-id="${esc(r.id)}">
            <div class="dropdown-item-avatar" style="background:${r.type === 'Doctor' ? 'var(--primary-brand,#047857)' : '#2563EB'};color:#fff;">${esc((r.name || '?').charAt(0))}</div>
            <div class="dropdown-item-body">
              <div class="dropdown-item-text"><strong>${esc(r.name)}</strong> &middot; ${r.type}</div>
              <div class="dropdown-item-time">${esc(r.id)} &middot; ${esc(r.sub)}</div>
            </div>
          </div>
        `).join('');
      }
      resultsEl.classList.add('open');
    }

    searchInput.addEventListener('input', () => renderResults(searchInput.value));
    searchInput.addEventListener('focus', () => { if (searchInput.value.trim()) resultsEl.classList.add('open'); });

    bodyEl.addEventListener('click', (e) => {
      const item = e.target.closest('.dropdown-item[data-id]');
      if (!item) return;
      const type = item.getAttribute('data-type');
      const id = item.getAttribute('data-id');
      sessionStorage.setItem('medtrack_search_nav', JSON.stringify({ type, id }));
      resultsEl.classList.remove('open');
      const targetPage = type === 'Doctor' ? '../doctors/admin-doctors.html' : '../patients/admin-patients.html';
      if (window.location.pathname.endsWith(targetPage.replace('../', ''))) {
        window.dispatchEvent(new CustomEvent('medtrack-search-nav'));
      } else {
        window.location.href = targetPage;
      }
    });

    document.addEventListener('click', (e) => {
      if (!searchBox.contains(e.target)) resultsEl.classList.remove('open');
    });
  })();

  // ── Utility: get patients list ────────────────────────────────────────
  function getAllPatients() {
    if (window.StorageDB) return window.StorageDB.getPatients() || [];
    return [];
  }
  function getAllDoctors() {
    if (window.StorageDB) return window.StorageDB.getDoctors() || [];
    return [];
  }
  function getAllAppointments() {
    if (window.StorageDB) return window.StorageDB.getAppointments() || [];
    return [];
  }
  function getTimeAgo(iso) {
    if (!iso) return '';
    var diff = Date.now() - new Date(iso).getTime();
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + ' min ago';
    var hours = Math.floor(mins / 60);
    if (hours < 24) return hours + 'h ago';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  function getTodayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  function getWeekStart() {
    var d = new Date();
    var day = d.getDay();
    var diff = d.getDate() - day + (day === 0 ? -6 : 1);
    var start = new Date(d.setDate(diff));
    return start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2,'0') + '-' + String(start.getDate()).padStart(2,'0');
  }

  // ── KPI updater ──────────────────────────────────────────────────────
  function updateKPIs() {
    if (!window.StorageDB) return;
    var appts = getAllAppointments();
    var patients = getAllPatients();
    var doctors = getAllDoctors();
    var today = getTodayStr();
    var weekStart = getWeekStart();

    var todayAppts = appts.filter(function(a) { return a.appointmentDate === today; }).length;
    var activeDoctors = doctors.filter(function(d) { return (d.status || '').toUpperCase() === 'ACTIVE' || !d.status; }).length;
    var pendingAppts = appts.filter(function(a) { var s = (a.status || '').toUpperCase(); return s === 'PENDING' || s === 'BOOKED'; }).length;
    var newPatientsThisWeek = patients.filter(function(p) {
      var regDate = p.registeredAt ? p.registeredAt.substring(0,10) : '';
      return regDate >= weekStart;
    }).length;
    var totalPatients = patients.length;
    var totalDoctors = doctors.length;

    var kpiMap = {
      todayAppts: { val: todayAppts, trend: todayAppts + ' scheduled' },
      doctorsAvail: { val: activeDoctors, trend: activeDoctors + ' on duty' },
      pendingApprovals: { val: pendingAppts, trend: pendingAppts > 0 ? pendingAppts + ' pending' : 'All clear' },
      newPatients: { val: newPatientsThisWeek, trend: 'This week' },
      totalPatients: { val: totalPatients, trend: totalPatients + ' active records' },
      totalDoctors: { val: totalDoctors, trend: 'All operational' },
    };

    document.querySelectorAll('.kpi-card[data-kpi]').forEach(function(card) {
      var key = card.dataset.kpi;
      var info = kpiMap[key];
      if (!info) return;
      var valEl = card.querySelector('.kpi-value');
      var trendEl = card.querySelector('[data-trend="' + key + '"]');
      if (valEl) valEl.textContent = info.val;
      if (trendEl) trendEl.textContent = info.trend;
    });
  }
  updateKPIs();

  // ── Appointments Table ───────────────────────────────────────────────
  var statusClassMap = {
    'Confirmed':  'status-badge--confirmed',
    'Pending':    'status-badge--pending',
    'Booked':     'status-badge--pending',
    'Cancelled':  'status-badge--cancelled',
    'Completed':  'status-badge--completed',
  };

  function renderApptsTable() {
    if (!window.StorageDB) return;
    var appts = getAllAppointments();
    var tbody = document.getElementById('appointments-tbody');
    if (!tbody) return;
    var rows = appts.slice(-6).reverse().map(function(a) {
      var status = a.status || 'Booked';
      var cls = statusClassMap[status] || 'status-badge--pending';
      var time = a.startTime ? a.startTime.substring(0,5) : '';
      var date = a.appointmentDate || '';
      var e = window.StorageDB.escapeHtml;
      return '<tr>' +
        '<td>' + e(a.id || '#N/A') + '</td>' +
        '<td>' + e(a.patientName || 'N/A') + '</td>' +
        '<td>' + e(a.doctorName || 'N/A') + '</td>' +
        '<td>' + e(a.department || 'N/A') + '</td>' +
        '<td>' + e(date) + ' ' + e(time) + '</td>' +
        '<td><span class="status-badge ' + cls + '">' + e(status) + '</span></td>' +
        '</tr>';
    }).join('');
    tbody.innerHTML = rows || '<tr><td colspan="6" class="text-center text-muted">No appointments yet.</td></tr>';
  }
  renderApptsTable();

  // ── Timeline (Today's Appointments) ──────────────────────────────────
  function renderTimeline() {
    if (!window.StorageDB) return;
    var appts = getAllAppointments();
    var today = getTodayStr();
    var todayAppts = appts.filter(function(a) { return a.appointmentDate === today; });
    todayAppts.sort(function(a, b) { return (a.startTime || '').localeCompare(b.startTime || ''); });
    var colors = ['green', 'blue', 'orange', 'purple', 'green'];
    var container = document.getElementById('timeline-container');
    if (!container) return;
    var e = window.StorageDB.escapeHtml;
    container.innerHTML = todayAppts.slice(0, 5).map(function(a, i) {
      var c = colors[i % colors.length];
      var time = a.startTime ? a.startTime.substring(0,5) : '';
      var patient = e(a.patientName || 'N/A');
      var status = e(a.status || 'Booked');
      return '<div class="timeline-item">' +
        '<div class="timeline-dot timeline-dot--' + c + '"></div>' +
        '<div class="timeline-content">' +
        '<div class="timeline-title">' + patient + '</div>' +
        '<div class="timeline-desc">' + status + ' · ' + e(a.doctorName || '') + '</div>' +
        '</div>' +
        '<span class="timeline-time">' + e(time) + '</span>' +
        '</div>';
    }).join('') || '<div class="p-3 text-center text-muted" style="font-size:0.82rem">No appointments scheduled today.</div>';
  }
  renderTimeline();

  // ── Notifications Panel ──────────────────────────────────────────────
  function renderNotifPanel() {
    if (!window.StorageDB) return;
    var notifs = window.StorageDB.getNotificationsForRecipient('admin', null);
    var container = document.getElementById('notifications-container');
    if (!container) return;
    var iconMap = {
      green:  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>',
      blue:   '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
      orange: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>',
      red:    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
    };
    var e = window.StorageDB.escapeHtml;
    container.innerHTML = notifs.slice(0, 5).map(function(n) {
      var icon = n.type === 'warning' || n.type === 'system' ? 'orange' :
                 n.type === 'appointment' || n.type === 'info' ? 'blue' :
                 n.type === 'success' ? 'green' : 'red';
      return '<div class="notification-item">' +
        '<div class="notification-icon notification-icon--' + icon + '">' + (iconMap[icon] || '') + '</div>' +
        '<div class="notification-body">' +
        '<div class="notification-text">' + e(n.title) + '</div>' +
        '<div class="notification-time">' + e(getTimeAgo(n.createdAt)) + '</div>' +
        '</div>' +
        '</div>';
    }).join('') || '<div class="p-3 text-center text-muted" style="font-size:0.82rem">No notifications yet.</div>';
  }
  renderNotifPanel();

  // ── Charts (Chart.js) — from real StorageDB data ────────────────────
  function initCharts() {
    if (!window.StorageDB) return;
    var appts = getAllAppointments();
    var today = new Date();
    var dayLabels = [];
    var bookedData = [];
    var completedData = [];
    var cancelledData = [];
    // Build last 7 days
    for (var i = 6; i >= 0; i--) {
      var d = new Date(today);
      d.setDate(d.getDate() - i);
      var ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
      dayLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
      var dayAppts = appts.filter(function(a) { return a.appointmentDate === ds; });
      bookedData.push(dayAppts.length);
      completedData.push(dayAppts.filter(function(a) { return a.status === 'Completed'; }).length);
      cancelledData.push(dayAppts.filter(function(a) { return a.status === 'Cancelled'; }).length);
    }
    var totalBooked = bookedData.reduce(function(a,b){return a+b},0);
    var totalCompleted = completedData.reduce(function(a,b){return a+b},0);
    var totalCancelled = cancelledData.reduce(function(a,b){return a+b},0);

    // ── Line Chart ──
    var lineCtx = document.getElementById('line-chart');
    if (lineCtx && typeof Chart !== 'undefined') {
      new Chart(lineCtx, {
        type: 'line',
        data: {
          labels: dayLabels,
          datasets: [
            { label: 'Booked', data: bookedData, borderColor: '#047857', backgroundColor: 'rgba(4,120,87,0.06)', fill: false, tension: 0.35, pointBackgroundColor: '#047857', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2.5 },
            { label: 'Completed', data: completedData, borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.06)', fill: false, tension: 0.35, pointBackgroundColor: '#10B981', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2, borderDash: [5,3] },
            { label: 'Cancelled', data: cancelledData, borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.04)', fill: false, tension: 0.35, pointBackgroundColor: '#EF4444', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 3, pointHoverRadius: 5, borderWidth: 1.5, borderDash: [3,3] },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          animation: { duration: 1400, easing: 'easeOutQuart' },
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { position: 'top', labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, color: '#2D2A24', font: { size: 11, family: 'Inter' } } },
            tooltip: {
              backgroundColor: '#fff', titleColor: '#2D2A24', bodyColor: '#2D2A24', borderColor: '#E5DDD5', borderWidth: 1, cornerRadius: 8, padding: 12,
              callbacks: {
                afterBody: function(items) {
                  var b = items.find(function(i){return i.dataset.label==='Booked'})?.parsed.y || 0;
                  var c = items.find(function(i){return i.dataset.label==='Completed'})?.parsed.y || 0;
                  var cx = items.find(function(i){return i.dataset.label==='Cancelled'})?.parsed.y || 0;
                  return '\nCompletion: ' + (b > 0 ? Math.round(c/b*100) : 0) + '%\nNo-show: ' + Math.max(0,b-c-cx);
                },
              },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#7A7268', font: { size: 11 } } },
            y: { stacked: false, grid: { color: '#F0ECE6' }, ticks: { color: '#7A7268', font: { size: 11 }, stepSize: Math.max(1,Math.ceil(Math.max.apply(null,bookedData)/5)) }, beginAtZero: true },
          },
        },
      });
    }

    // ── Donut Chart: Department Utilization ──
    var donutCtx = document.getElementById('donut-chart');
    if (donutCtx && typeof Chart !== 'undefined') {
      var deptNames = ['Cardiology','Pediatrics','Neurology','Orthopedics','General'];
      var deptUsed = deptNames.map(function(dept) {
        return appts.filter(function(a) { return a.department === dept && (a.status === 'Completed' || a.status === 'Confirmed' || a.status === 'Booked'); }).length;
      });
      var deptAvail = deptNames.map(function(dept) {
        var total = appts.filter(function(a) { return a.department === dept; }).length;
        var used = appts.filter(function(a) { return a.department === dept && (a.status === 'Completed' || a.status === 'Confirmed' || a.status === 'Booked'); }).length;
        return Math.max(total, used) - used + 2;
      });

      new Chart(donutCtx, {
        type: 'doughnut',
        data: {
          labels: deptNames,
          datasets: [
            { label: 'Used', data: deptUsed, backgroundColor: ['#047857','#10B981','#3B82F6','#F59E0B','#8B5CF6'], borderWidth: 3, borderColor: '#fff' },
            { label: 'Available', data: deptAvail, backgroundColor: ['#D1FAE5','#D1FAE5','#DBEAFE','#FEF3C7','#EDE9FE'], borderWidth: 3, borderColor: '#fff' },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          animation: { animateRotate: true, duration: 1200, easing: 'easeOutQuart' },
          cutout: '68%',
          plugins: {
            legend: { position: 'bottom', labels: { padding: 14, usePointStyle: true, pointStyle: 'circle', color: '#2D2A24', font: { size: 11, family: 'Inter' } } },
            tooltip: {
              backgroundColor: '#fff', titleColor: '#2D2A24', bodyColor: '#2D2A24', borderColor: '#E5DDD5', borderWidth: 1, cornerRadius: 8, padding: 12,
              callbacks: {
                label: function(ctx) {
                  var used = ctx.dataset.data[ctx.dataIndex];
                  var total = ctx.dataset.label === 'Used'
                    ? used + ctx.chart.data.datasets[1].data[ctx.dataIndex]
                    : used + ctx.chart.data.datasets[0].data[ctx.dataIndex];
                  var pct = total > 0 ? Math.round(used/total*100) : 0;
                  return ' ' + ctx.chart.data.labels[ctx.dataIndex] + ': ' + used + '/' + total + ' (' + pct + '% utilized)';
                },
              },
            },
          },
        },
        plugins: [{
          id: 'centerText',
          beforeDraw: function(chart) {
            var w = chart.width, h = chart.height, ctx = chart.ctx;
            ctx.save();
            var totalUsed = chart.data.datasets[0].data.reduce(function(a,b){return a+b},0);
            var totalAvail = chart.data.datasets[1].data.reduce(function(a,b){return a+b},0);
            var pct = totalUsed + totalAvail > 0 ? Math.round(totalUsed/(totalUsed+totalAvail)*100) : 0;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = "bold 22px 'Outfit', sans-serif";
            ctx.fillStyle = '#2D2A24';
            ctx.fillText(pct + '%', w/2, h/2 - 8);
            ctx.font = "11px 'Inter', sans-serif";
            ctx.fillStyle = '#7A7268';
            ctx.fillText('Utilized', w/2, h/2 + 20);
            ctx.restore();
          },
        }],
      });
    }

    // ── Summary row ──
    var completionPct = totalBooked > 0 ? Math.round(totalCompleted/totalBooked*100) : 0;
    var cancellationPct = totalBooked > 0 ? Math.round(totalCancelled/totalBooked*100) : 0;
    var summaryBar = document.createElement('div');
    summaryBar.className = 'chart-footer-summary';
    summaryBar.innerHTML = '<span><strong>Total Booked:</strong> ' + totalBooked + '</span>' +
      '<span><strong>Completed:</strong> ' + totalCompleted + ' <span style="color:#059669">(' + completionPct + '%)</span></span>' +
      '<span><strong>Cancelled:</strong> ' + totalCancelled + ' <span style="color:#DC2626">(' + cancellationPct + '%)</span></span>' +
      '<span><strong>No-Show Rate:</strong> <span style="color:#EA580C">' + (totalBooked > 0 ? Math.round((totalBooked-totalCompleted-totalCancelled)/totalBooked*100) : 0) + '%</span></span>';
    document.querySelector('.charts-row')?.after(summaryBar);
  }

  // Wait for Chart.js CDN to load
  if (typeof Chart !== 'undefined') {
    initCharts();
  } else {
    var retries = 0;
    var interval = setInterval(function() {
      retries++;
      if (typeof Chart !== 'undefined') { initCharts(); clearInterval(interval); }
      if (retries > 20) clearInterval(interval);
    }, 500);
  }

  // ── 8. Quick Actions → Bootstrap Modal ──────────────────────────────
  const actionModalEl = document.getElementById('actionModal');
  const actionModal = (actionModalEl && typeof bootstrap !== 'undefined') ? new bootstrap.Modal(actionModalEl) : null;
  const actionModalLabel = document.getElementById('actionModalLabel');
  const actionModalBody = document.getElementById('actionModalBody');
  const actionModalSubmit = document.getElementById('actionModalSubmit');

  const actionForms = {
    'send-notification': {
      title: 'Send Notification',
      body: `
        <div class="mb-3">
          <label class="form-label fw-semibold">Send To</label>
          <select class="form-select" id="notifSendTo">
            <option value="all_doctors">All Doctors</option>
            <option value="all_patients">All Patients</option>
            <option value="all_staff">All Staff</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label fw-semibold">Subject</label>
          <input type="text" class="form-control" id="notifSubject" placeholder="Notification subject">
        </div>
        <div class="mb-3">
          <label class="form-label fw-semibold">Message</label>
          <textarea class="form-control" id="notifMessage" rows="4" placeholder="Type your message..."></textarea>
        </div>`,
      submitText: 'Send Notification',
    },
  };

  document.querySelectorAll('.quick-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;

      // ── Export handlers (no modal needed) ──
      if (action === 'export-noshow') { exportNoShowReport(btn); return; }
      if (action === 'export-apptsummary') { exportApptSummaryReport(btn); return; }

      const form = actionForms[action];
      if (!form) return;

      document.querySelectorAll('.quick-action-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');

      if (!actionModal) return;

      actionModalLabel.textContent = form.title;
      actionModalBody.innerHTML = form.body;
      actionModalSubmit.textContent = form.submitText || 'Confirm';

      btn.style.transform = 'scale(0.95)';
      setTimeout(() => { btn.style.transform = ''; }, 150);

      actionModal.show();
    });
  });

  // ── CSV Export Helpers ──────────────────────────────────────────────
  function downloadCSV(filename, headers, rows) {
    var csv = headers.join(',') + '\n';
    rows.forEach(function(r) {
      var escaped = r.map(function(cell) {
        var s = String(cell);
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
      });
      csv += escaped.join(',') + '\n';
    });
    var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  function exportNoShowReport(btn) {
    if (!window.StorageDB) { showToast('Storage not ready', 'warning'); return; }
    var appts = window.StorageDB.getAppointments();
    var noshows = appts.filter(function(a) { return a.status === 'NoShow'; });
    if (!noshows.length) { showToast('No no-show appointments found', 'warning'); return; }
    var headers = ['Patient Name', 'Doctor', 'Department', 'Date', 'Time', 'Notes'];
    var rows = noshows.map(function(a) {
      return [a.patientName || '', a.doctorName || '', a.department || '', a.appointmentDate || '', a.startTime || '', a.notes || ''];
    });
    downloadCSV('Patient_NoShow_Report.csv', headers, rows);
    var now = new Date();
    var gen = document.getElementById('noshow-last-gen');
    if (gen) gen.textContent = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    showToast(noshows.length + ' no-show records exported', 'success');
  }

  function exportApptSummaryReport(btn) {
    if (!window.StorageDB) { showToast('Storage not ready', 'warning'); return; }
    var appts = window.StorageDB.getAppointments();
    if (!appts.length) { showToast('No appointment data found', 'warning'); return; }

    var total = appts.length;
    var statusCounts = {};
    var deptCounts = {};
    appts.forEach(function(a) {
      var s = a.status || 'Unknown';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
      var d = a.department || 'Unknown';
      deptCounts[d] = (deptCounts[d] || 0) + 1;
    });

    var headers = ['Metric', 'Value'];
    var rows = [
      ['Total Appointments', total],
      ['Generated', new Date().toISOString().split('T')[0]]
    ];
    Object.keys(statusCounts).sort().forEach(function(k) {
      rows.push(['Status: ' + k, statusCounts[k]]);
    });
    rows.push(['--- Departments ---', '---']);
    Object.keys(deptCounts).sort().forEach(function(k) {
      rows.push([k, deptCounts[k]]);
    });

    downloadCSV('Appointment_Summary_Report.csv', headers, rows);
    var now = new Date();
    var gen = document.getElementById('apptsummary-last-gen');
    if (gen) gen.textContent = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    showToast('Appointment summary exported (' + total + ' records)', 'success');
  }

  // Handle modal submit
  actionModalSubmit?.addEventListener('click', () => {
    if (!actionModal) return;
    const title = actionModalLabel.textContent;
    const actionKey = document.querySelector('.quick-action-btn.active')?.dataset.action;
    actionModal.hide();

    if (!window.StorageDB) { showToast('Storage not ready', 'warning'); return; }

    // Send Notification — persist to StorageDB
    if (actionKey === 'send-notification') {
      var sendTo = document.getElementById('notifSendTo')?.value;
      var subject = document.getElementById('notifSubject')?.value.trim();
      var message = document.getElementById('notifMessage')?.value.trim();
      if (!subject || !message) {
        showToast('Please enter both subject and message', 'warning');
        return;
      }
      var recipientType = 'doctor';
      if (sendTo === 'all_patients') recipientType = 'patient';
      else if (sendTo === 'all_staff') recipientType = 'admin';
      window.StorageDB.saveNotification({
        type: 'info',
        title: subject,
        message: message,
        recipientType: recipientType,
        recipientId: null,
        read: false,
        senderId: 'ADMIN-001'
      });
      syncNotifBadge();
      if (window.StorageDB.addAuditLog) {
        window.StorageDB.addAuditLog('Admin', 'Create', 'Notification', 'Sent notification: ' + subject);
      }
      showToast('Notification sent to ' + document.getElementById('notifSendTo')?.selectedOptions[0]?.text, 'success');
      return;
    }

    // Generic fallback toast
    showToast(`${title} submitted successfully`, 'success');
  });

  function showToast(msg, type) {
    var existing = document.querySelector('.custom-toast-msg');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'custom-toast-msg position-fixed top-0 start-50 translate-middle-x mt-4 px-4 py-2 rounded-pill shadow z-3';
    toast.style.background = type === 'warning' ? '#F59E0B' : '#059669';
    toast.style.color = '#fff';
    toast.style.animation = 'fadeInOut 2.5s ease forwards';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function() { if (toast.parentNode) toast.remove(); }, 2600);
  }

  // Add toast animation
  const style = document.createElement('style');
  style.textContent = `@keyframes fadeInOut { 0% { opacity: 0; transform: translateY(-20px); } 15% { opacity: 1; transform: translateY(0); } 85% { opacity: 1; } 100% { opacity: 0; } }`;
  document.head.appendChild(style);

  // ── 9. View All → Modal ──────────────────────────────────────────────
  const modalOverlay = document.getElementById('modal-overlay');
  const modalTitle   = document.getElementById('modal-title');
  const modalBody    = document.getElementById('modal-body');

  function openModal(title, items) {
    if (!modalOverlay || !modalTitle || !modalBody) return;
    modalTitle.textContent = title;
    modalBody.innerHTML = items.map(item =>
      typeof item === 'string'
        ? `<div class="modal-item">${item}</div>`
        : `<div class="modal-item">${item}</div>`
    ).join('');
    modalOverlay.classList.add('open');
    closeAllDropdowns();
  }

  function closeModal() {
    modalOverlay?.classList.remove('open');
  }

  // Close modal buttons
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  var escHtml = function(s) { return window.StorageDB ? window.StorageDB.escapeHtml(s || '') : (s || ''); };

  // Notification dropdown "View All" — navigate to Notification Management page
  document.getElementById('view-all-notif-dropdown')?.addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = '../notifications/admin-notifications.html';
  });

  // Messages dropdown "View All"
  document.getElementById('view-all-msg-dropdown')?.addEventListener('click', function(e) {
    e.preventDefault();
    openModal('All Messages', msgData.map(function(m) {
      return '<div class="dropdown-item-avatar" style="background:' + m.color + ';color:#fff;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.72rem;font-weight:700">' + escHtml(m.avatar) + '</div>' +
        '<div class="dropdown-item-body">' +
        '<div style="font-weight:600;font-size:0.82rem">' + escHtml(m.from) + '</div>' +
        '<div style="font-size:0.78rem;color:#2D2A24">' + escHtml(m.subject) + '</div>' +
        '<div style="font-size:0.76rem;color:#7A7268;margin-top:2px">' + escHtml(m.preview) + '</div>' +
        '<div class="dropdown-item-time">' + escHtml(m.time) + '</div>' +
        '</div>';
    }));
  });

  // Appointments panel "View All" — from StorageDB
  document.getElementById('view-all-appts')?.addEventListener('click', function(e) {
    e.preventDefault();
    if (!window.StorageDB) return;
    var appts = getAllAppointments();
    openModal('All Appointments', appts.map(function(a) {
      var status = a.status || 'Booked';
      var cls = statusClassMap[status] || 'status-badge--pending';
      return '<div style="display:flex;justify-content:space-between;align-items:center;width:100%">' +
        '<div>' +
        '<strong style="font-size:0.85rem">' + escHtml(a.id || '#N/A') + '</strong> — ' + escHtml(a.patientName || 'N/A') + '<br>' +
        '<span style="font-size:0.78rem;color:#7A7268">' + escHtml(a.doctorName || '') + ' · ' + escHtml(a.department || '') + ' · ' + escHtml(a.startTime ? a.startTime.substring(0,5) : '') + '</span>' +
        '</div>' +
        '<span class="status-badge ' + cls + '">' + escHtml(status) + '</span>' +
        '</div>';
    }));
  });

  // Schedule panel "View All" — from today's appointments
  document.getElementById('view-all-schedule')?.addEventListener('click', function(e) {
    e.preventDefault();
    if (!window.StorageDB) return;
    var appts = getAllAppointments().filter(function(a) { return a.appointmentDate === getTodayStr(); });
    openModal('Today\'s Schedule', appts.map(function(a) {
      var time = a.startTime ? a.startTime.substring(0,5) : '';
      return '<div style="display:flex;justify-content:space-between;align-items:center;width:100%">' +
        '<div>' +
        '<strong style="font-size:0.85rem">' + escHtml(a.patientName || 'N/A') + '</strong><br>' +
        '<span style="font-size:0.78rem;color:#7A7268">' + escHtml(a.doctorName || '') + ' · ' + escHtml(a.status || '') + '</span>' +
        '</div>' +
        '<span style="font-size:0.78rem;color:#7A7268;white-space:nowrap">' + escHtml(time) + '</span>' +
        '</div>';
    }));
  });

  // Notifications panel "View All" — from StorageDB
  document.getElementById('view-all-notif-panel')?.addEventListener('click', function(e) {
    e.preventDefault();
    if (!window.StorageDB) return;
    var items = window.StorageDB.getNotificationsForRecipient('admin', null);
    openModal('All Notifications', items.map(function(n) {
      var icon = n.type === 'warning' || n.type === 'system' ? 'orange' :
                 n.type === 'appointment' || n.type === 'info' ? 'blue' :
                 n.type === 'success' ? 'green' : 'red';
      return '<div class="dropdown-item-icon" style="background:' + dropdownIconMap[icon].bg + ';color:' + dropdownIconMap[icon].color + '">' + dropdownIconMap[icon].svg + '</div>' +
        '<div class="dropdown-item-body">' +
        '<div class="dropdown-item-text">' + escHtml(n.title) + '</div>' +
        '<div class="dropdown-item-time">' + escHtml(getTimeAgo(n.createdAt)) + '</div>' +
        '</div>';
    }));
  });

  // ── Logout handler ──
  document.querySelectorAll('a[href*="index.html"]').forEach(function(link) {
    if (link.textContent.trim().indexOf('Logout') !== -1 || link.classList.contains('logout-link')) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        if (window.StorageDB && window.StorageDB.addAuditLog) {
          window.StorageDB.addAuditLog('Admin', 'Logout', 'Session', 'User logged out');
        }
        sessionStorage.clear();
        window.location.href = link.getAttribute('href');
      });
    }
  });

});
