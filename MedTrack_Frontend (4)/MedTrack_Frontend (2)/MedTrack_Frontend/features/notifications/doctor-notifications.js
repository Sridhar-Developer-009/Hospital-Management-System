document.addEventListener('DOMContentLoaded', function () {

  var sidebar = document.getElementById('sidebar');
  var sidebarOverlay = document.getElementById('sidebar-overlay');
  var hamburgerBtn = document.getElementById('hamburger-btn');

  if (window.innerWidth > 1280 && sidebar) sidebar.classList.add('open');
  requestAnimationFrame(function() {
    if (sidebar) sidebar.classList.add('sidebar-animate');
  });

  function toggleSidebar() {
    if (!sidebar) return;
    var isOpen = sidebar.classList.toggle('open');
    if (window.innerWidth <= 1280 && sidebarOverlay) sidebarOverlay.classList.toggle('open', isOpen);
  }
  function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('open');
    if (window.innerWidth <= 1280 && sidebarOverlay) sidebarOverlay.classList.remove('open');
  }
  if (hamburgerBtn) hamburgerBtn.addEventListener('click', toggleSidebar);
  var sidebarCloseBtn = document.getElementById('sidebar-close');
  if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSidebar(); });

  // ── Data ──

  var iconConfigs = {
    appointment: { bg: '#DCFCE7', color: '#166534', emoji: '📅' },
    info: { bg: '#E0F2FE', color: '#0369A1', emoji: 'ℹ️' },
    success: { bg: '#DCFCE7', color: '#166534', emoji: '✅' },
    warning: { bg: '#FEF3C7', color: '#B45309', emoji: '⚠️' },
    lab: { bg: '#F3E8FF', color: '#7C3AED', emoji: '🔬' },
    patient: { bg: '#FFE4E6', color: '#BE123C', emoji: '👤' },
    system: { bg: '#F3E8FF', color: '#7C3AED', emoji: '🔔' }
  };

  var currentDoctorId = sessionStorage.getItem('currentDoctorId') || 'DOC-1001';
  var notifications = [];
  var currentFilter = 'all';
  var searchQuery = '';
  var currentPage = 1;
  var ITEMS_PER_PAGE = 10;

  function loadNotifications() {
    if (window.StorageDB) {
      window.StorageDB.migrateOldDoctorNotifications();
      return window.StorageDB.getNotificationsForRecipient('doctor', currentDoctorId);
    }
    return [];
  }

  function saveAll() {
    // Doctor notifications are read-only via StorageDB; mark-read is handled per-item
  }

  // ── Render ──

  function render() {
    notifications = loadNotifications();
    var filtered = filterNotifications();
    var container = document.getElementById('notifList');
    var empty = document.getElementById('notifEmpty');

    if (!filtered.length) {
      container.innerHTML = '';
      empty.style.display = 'block';
      renderPagination(0);
      updateStats();
      return;
    }
    empty.style.display = 'none';

    var totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;
    var start = (currentPage - 1) * ITEMS_PER_PAGE;
    var end = Math.min(start + ITEMS_PER_PAGE, filtered.length);
    var page = filtered.slice(start, end);

    var html = '';
    for (var i = 0; i < page.length; i++) {
      var n = page[i];
      var cfg = iconConfigs[n.type] || iconConfigs.info;
      var unreadClass = n.read ? '' : ' unread';
      var timeAgo = getTimeAgo(n.createdAt);

      html += '<div class="notif-list-item' + unreadClass + '" data-id="' + n.id + '">' +
        '<div class="notif-item-icon" style="background:' + cfg.bg + ';color:' + cfg.color + ';">' + cfg.emoji + '</div>' +
        '<div class="notif-item-body">' +
          '<div class="notif-item-title">' + n.title + '</div>' +
          '<div class="notif-item-desc">' + n.message + '</div>' +
          '<div class="notif-item-time">' +
            (!n.read ? '<span class="notif-item-dot"></span>' : '') +
            timeAgo +
          '</div>' +
        '</div>' +
        '</div>';
    }
    container.innerHTML = html;

    var items = container.querySelectorAll('.notif-list-item');
    for (var j = 0; j < items.length; j++) {
      items[j].addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        markAsRead(id);
      });
    }

    renderPagination(filtered.length);
    updateStats();
  }

  function renderPagination(totalItems) {
    var existing = document.getElementById('notifPagination');
    if (existing) existing.remove();

    if (totalItems <= ITEMS_PER_PAGE) return;

    var totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    var start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    var end = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

    var wrapper = document.createElement('div');
    wrapper.id = 'notifPagination';
    wrapper.className = 'p-3 border-top d-flex justify-content-between align-items-center';
    wrapper.innerHTML =
      '<span class="small text-muted">Showing ' + start + '-' + end + ' of ' + totalItems + '</span>' +
      '<div class="btn-group">' +
        '<button class="btn btn-sm btn-outline-secondary" id="notifPrev"' + (currentPage <= 1 ? ' disabled' : '') + '>Prev</button>' +
        '<button class="btn btn-sm btn-outline-secondary" id="notifNext"' + (currentPage >= totalPages ? ' disabled' : '') + '>Next</button>' +
      '</div>';

    var listWrapper = document.querySelector('.notif-list-wrapper');
    if (listWrapper) listWrapper.appendChild(wrapper);

    var prevBtn = document.getElementById('notifPrev');
    var nextBtn = document.getElementById('notifNext');
    if (prevBtn) prevBtn.addEventListener('click', function () { if (currentPage > 1) { currentPage--; render(); } });
    if (nextBtn) nextBtn.addEventListener('click', function () { if (currentPage < totalPages) { currentPage++; render(); } });
  }

  function getTimeAgo(isoString) {
    if (!isoString) return 'recently';
    var diff = Date.now() - new Date(isoString).getTime();
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + ' min ago';
    var hours = Math.floor(mins / 60);
    if (hours < 24) return hours + ' hour' + (hours > 1 ? 's' : '') + ' ago';
    var days = Math.floor(hours / 24);
    if (days < 7) return days + ' day' + (days > 1 ? 's' : '') + ' ago';
    return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function filterNotifications() {
    var result = [];
    for (var i = 0; i < notifications.length; i++) {
      var n = notifications[i];
      if (currentFilter === 'unread' && n.read) continue;
      if (currentFilter === 'read' && !n.read) continue;
      if (searchQuery) {
        var q = searchQuery.toLowerCase();
        if (!n.title.toLowerCase().includes(q) && !(n.message || '').toLowerCase().includes(q)) continue;
      }
      result.push(n);
    }
    return result;
  }

  function updateStats() {
    var total = notifications.length;
    var unread = 0;
    for (var i = 0; i < notifications.length; i++) {
      if (!notifications[i].read) unread++;
    }
    var statUnread = document.getElementById('statUnread');
    var statTotal = document.getElementById('statTotal');
    var statToday = document.getElementById('statToday');
    if (statUnread) statUnread.textContent = unread;
    if (statTotal) statTotal.textContent = total;
    if (statToday) statToday.textContent = notifications.filter(function(n) {
      if (!n.createdAt) return false;
      var d = new Date(n.createdAt);
      var now = new Date();
      return d.toDateString() === now.toDateString();
    }).length;

    var sidebarBadge = document.getElementById('sidebarNotifBadge');
    var headerBadge = document.getElementById('headerNotifBadge');
    if (sidebarBadge) sidebarBadge.textContent = unread;
    if (headerBadge) headerBadge.textContent = unread;
  }

  function markAsRead(id) {
    if (window.StorageDB) {
      window.StorageDB.markNotificationRead(id);
      render();
    }
  }

  // ── Search & Filter ──

  document.getElementById('notifSearch').addEventListener('input', function () {
    searchQuery = this.value;
    currentPage = 1;
    render();
  });

  document.querySelectorAll('.notif-filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.notif-filter-btn').forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      currentFilter = this.getAttribute('data-filter');
      currentPage = 1;
      render();
    });
  });

  // ── Mark All Read ──

  document.getElementById('markAllReadBtn').addEventListener('click', function () {
    if (window.StorageDB) {
      var changed = window.StorageDB.markAllNotificationsRead('doctor', currentDoctorId);
      if (changed) {
        render();
        showToast('All notifications marked as read', 'success');
      }
    }
  });

  // ── Toast ──

  function showToast(msg, type) {
    var t = document.createElement('div');
    t.className = 'toast-notification ' + (type || 'success');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('show'); }, 10);
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 2500);
  }

  // ── Init ──

  render();

});
