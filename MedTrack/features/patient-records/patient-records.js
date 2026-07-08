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

  // ── Patient Data (from shared localStorage) ──
  function loadPatients() {
    if (!window.StorageDB) return [];
    var doctorName = sessionStorage.getItem('doctorName') || '';
    var doctorId = sessionStorage.getItem('currentDoctorId') || '';
    var all = StorageDB.getPatients();
    // Get all patients who have appointments with this doctor
    var appts = StorageDB.getAppointments();
    var myApptPatientIds = {};
    appts.forEach(function(a) {
      if (a.doctorId === doctorId || a.doctorName === doctorName) {
        myApptPatientIds[a.patientId] = true;
      }
    });
    // Filter: assigned to this doctor OR had appointment with this doctor
    all = all.filter(function(p) {
      return p.assignedDoctor === doctorName || myApptPatientIds[p.id];
    });
    return all.map(function(p) {
      var age = 0;
      if (p.dateOfBirth) {
        var bd = new Date(p.dateOfBirth);
        age = Math.floor((Date.now() - bd.getTime()) / 31557600000);
      }
      var lastVisit = '';
      if (p.registeredAt) {
        var d = new Date(p.registeredAt);
        lastVisit = d.getDate() + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()] + ' ' + d.getFullYear();
      }
      return {
        id: p.id,
        name: p.name,
        age: age,
        gender: p.gender || 'N/A',
        phone: p.contact || 'N/A',
        blood: p.bloodGroup || 'N/A',
        lastVisit: lastVisit,
        condition: p.department || 'General',
        history: p.medicalHistory || 'No medical history recorded.',
        email: p.email || '',
        address: p.address || '',
        emergencyContact: p.emergencyContact || '',
        assignedDoctor: p.assignedDoctor || ''
      };
    });
  }

  var patients = loadPatients();

  var searchQuery = '';
  var _recordsPage = 1;
  var RECORDS_PER_PAGE = 10;

  // ── Helpers ──
  function getInitials(name) {
    var parts = name.split(' ');
    return (parts[0][0] || '') + (parts[1] ? parts[1][0] : '');
  }

  function getColor(name) {
    var colors = ['#047857', '#0369A1', '#B45309', '#7C3AED', '#BE185D', '#0891B2', '#65A30D', '#D97706'];
    var hash = 0;
    for (var i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
    return colors[Math.abs(hash) % colors.length];
  }

  // ── Render ──
  function renderPatients() {
    var filtered = patients.filter(function (p) {
      if (searchQuery) {
        var q = searchQuery.toLowerCase();
        if (p.name.toLowerCase().indexOf(q) === -1 && p.id.toLowerCase().indexOf(q) === -1) return false;
      }
      return true;
    });

    document.getElementById('totalPatients').textContent = patients.length;
    document.getElementById('activePatients').textContent = patients.length;
    document.getElementById('newPatients').textContent = patients.length;

    var tbody = document.getElementById('recordsBody');
    var empty = document.getElementById('recordsEmpty');
    var pageInfo = document.getElementById('recordsPageInfo');
    var prevBtn = document.getElementById('recordsPagePrev');
    var nextBtn = document.getElementById('recordsPageNext');

    tbody.innerHTML = '';

    if (filtered.length === 0) {
      empty.style.display = 'block';
      pageInfo.textContent = 'Showing 0-0 of 0 patients';
      prevBtn.disabled = true; nextBtn.disabled = true;
      return;
    }
    empty.style.display = 'none';

    var totalPages = Math.ceil(filtered.length / RECORDS_PER_PAGE);
    if (_recordsPage > totalPages) _recordsPage = totalPages;
    var start = (_recordsPage - 1) * RECORDS_PER_PAGE;
    var end = Math.min(start + RECORDS_PER_PAGE, filtered.length);
    var page = filtered.slice(start, end);

    page.forEach(function (p) {
      var tr = document.createElement('tr');

      var avatarColor = getColor(p.name);
      var initials = getInitials(p.name);

      tr.innerHTML =
        '<td><div class="patient-cell"><div class="patient-avatar" style="background:' + avatarColor + ';">' + initials + '</div><div class="patient-name">' + p.name + '</div></div></td>' +
        '<td><span class="patient-id">' + p.id + '</span></td>' +
        '<td>' + p.age + ' / ' + p.gender + '</td>' +
        '<td>' + p.phone + '</td>' +
        '<td>' + p.blood + '</td>' +
        '<td>' + p.lastVisit + '</td>' +
        '<td>' + p.condition + '</td>' +
        '<td><button class="view-btn" data-id="' + p.id + '">View</button></td>';

      tbody.appendChild(tr);
    });

    document.querySelectorAll('.view-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.dataset.id;
        var patient = patients.find(function (p) { return p.id === id; });
        if (patient) showPatientDetail(patient);
      });
    });

    pageInfo.textContent = 'Showing ' + (filtered.length ? start + 1 : 0) + '-' + end + ' of ' + filtered.length + ' patients';
    prevBtn.disabled = _recordsPage <= 1;
    nextBtn.disabled = end >= filtered.length;
  }

  // ── Patient Detail Modal ──
  function showPatientDetail(p) {
    document.getElementById('patientModalTitle').textContent = 'Patient Profile';
    var avatarColor = getColor(p.name);
    var initials = getInitials(p.name);
    var statusBadge = '<span class="badge bg-success" style="font-size:0.65rem;">Active</span>';

    var html =
      '<div class="profile-card">' +
        '<div class="profile-card-bg"></div>' +
        '<div class="profile-card-body">' +
          '<div class="profile-avatar-wrap">' +
            '<div class="profile-avatar-lg" style="background:' + avatarColor + ';">' + initials + '</div>' +
          '</div>' +
          '<div class="profile-name-section">' +
            '<div class="profile-name">' + p.name + '</div>' +
            '<div class="profile-id">' + p.id + ' ' + statusBadge + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="profile-info-grid">' +
        '<div class="profile-info-item"><span class="pi-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#047857" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg></span><div><label>Age</label><span>' + p.age + ' years</span></div></div>' +
        '<div class="profile-info-item"><span class="pi-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#047857" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></span><div><label>Gender</label><span>' + p.gender + '</span></div></div>' +
        '<div class="profile-info-item"><span class="pi-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#047857" stroke-width="2"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"></path><circle cx="12" cy="10" r="3"></circle></svg></span><div><label>Blood</label><span>' + p.blood + '</span></div></div>' +
        '<div class="profile-info-item"><span class="pi-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#047857" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></span><div><label>Phone</label><span>' + p.phone + '</span></div></div>' +
        '<div class="profile-info-item"><span class="pi-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#047857" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg></span><div><label>Email</label><span>' + (p.email || 'N/A') + '</span></div></div>' +
        '<div class="profile-info-item"><span class="pi-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#047857" stroke-width="2"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"></path><circle cx="12" cy="10" r="3"></circle></svg></span><div><label>Address</label><span>' + (p.address || 'N/A') + '</span></div></div>' +
        '<div class="profile-info-item"><span class="pi-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#047857" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"></path><rect x="9" y="3" width="6" height="4" rx="1"></rect><line x1="9" y1="12" x2="15" y2="12"></line></svg></span><div><label>Condition</label><span>' + p.condition + '</span></div></div>' +
        '<div class="profile-info-item"><span class="pi-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#047857" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></span><div><label>Last Visit</label><span>' + p.lastVisit + '</span></div></div>' +
        '<div class="profile-info-item"><span class="pi-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#047857" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></span><div><label>Doctor</label><span>' + (p.assignedDoctor || 'N/A') + '</span></div></div>' +
        '<div class="profile-info-item"><span class="pi-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#047857" stroke-width="2"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"></path><circle cx="12" cy="10" r="3"></circle></svg></span><div><label>Emergency</label><span>' + (p.emergencyContact || 'N/A') + '</span></div></div>' +
      '</div>' +
      '<div class="profile-section">' +
        '<div class="profile-section-title">Medical History</div>' +
        '<div class="profile-history">' + p.history + '</div>' +
      '</div>';

    document.getElementById('patientDetailContent').innerHTML = html;
    openModal('patientModal');
  }

  // ── Search ──
  document.getElementById('recordsFilterSearch').addEventListener('input', function () {
    searchQuery = this.value;
    _recordsPage = 1;
    renderPatients();
  });

  document.getElementById('searchInput').addEventListener('input', function () {
    searchQuery = this.value;
    document.getElementById('recordsFilterSearch').value = this.value;
    _recordsPage = 1;
    renderPatients();
  });

  document.getElementById('recordsPagePrev').addEventListener('click', function () {
    if (_recordsPage > 1) { _recordsPage--; renderPatients(); }
  });
  document.getElementById('recordsPageNext').addEventListener('click', function () {
    _recordsPage++; renderPatients();
  });

  // ── Modal ──
  function openModal(id) {
    var el = document.getElementById(id);
    if (el) { el.style.display = 'flex'; el.classList.add('open'); }
  }
  function closeModal(id) {
    var el = document.getElementById(id);
    if (el) { el.style.display = 'none'; el.classList.remove('open'); }
  }
  document.querySelectorAll('.appt-modal').forEach(function (m) {
    m.addEventListener('click', function (e) { if (e.target === m) { this.style.display = 'none'; this.classList.remove('open'); } });
  });
  document.getElementById('patientModalClose').addEventListener('click', function () { closeModal('patientModal'); });
  document.getElementById('patientModalCloseBtn').addEventListener('click', function () { closeModal('patientModal'); });

  // ── Init ──
  renderPatients();
});
