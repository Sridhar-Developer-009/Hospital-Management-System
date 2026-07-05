document.addEventListener('DOMContentLoaded', function () {

  // ── Sidebar Toggle ──
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
    if (!sidebar) return; sidebar.classList.remove('open');
    if (window.innerWidth <= 1280 && sidebarOverlay) sidebarOverlay.classList.remove('open');
  }
  if (hamburgerBtn) hamburgerBtn.addEventListener('click', toggleSidebar);
  var sidebarCloseBtn = document.getElementById('sidebar-close');
  if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSidebar(); });

  // ── Doctor Context ──
  var currentDoctorId = sessionStorage.getItem('currentDoctorId') || 'DOC-1001';
  var currentDoctor = window.StorageDB.getDoctorById(currentDoctorId);
  if (!currentDoctor) {
    var allDocs = window.StorageDB.getDoctors();
    currentDoctor = allDocs.length ? allDocs[0] : { name: 'Dr. Unknown', id: 'DOC-0000' };
    currentDoctorId = currentDoctor.id;
  }

  // ── Doctor Config Helpers ──
  function getDoctorConfig(doctorId) {
    var configKey = 'medtrack_config_' + doctorId;
    try {
      var saved = localStorage.getItem(configKey);
      if (saved) {
        var p = JSON.parse(saved);
        if (p.slotTimes && p.slotTimes.length) return p;
      }
    } catch (e) {}
    return { slotTimes: ['09:00', '10:00', '11:00', '14:00', '16:00'] };
  }

  var CONFIG = getDoctorConfig(currentDoctorId);
  var SLOT_TIMES = CONFIG.slotTimes;
  var TOTAL_SLOTS = SLOT_TIMES.length;

  // ── Data State ──
  var todayStr = new Date().toISOString().split('T')[0];
  var allAppointments = [];
  var allPatients = [];
  var currentFilter = 'all';
  var currentStatusFilter = 'all';
  var currentDateFilter = '';
  var currentSearchQuery = '';
  var _apptPage = 1;
  var APPT_PER_PAGE = 10;

  // ── Modal Helpers ──
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

  // ── Toast ──
  function showToast(msg, type) {
    var t = document.createElement('div');
    t.className = 'toast-notification ' + (type || 'success');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('show'); }, 10);
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 2500);
  }

  // ── Data Loader ──
  function loadAllData() {
    allAppointments = window.StorageDB.getAppointments().filter(function(a) {
      return a.doctorId === currentDoctorId;
    }).sort(function(a, b) {
      var d = (a.appointmentDate || '').localeCompare(b.appointmentDate || '');
      if (d !== 0) return d;
      return (a.startTime || '').localeCompare(b.startTime || '');
    });
    allPatients = window.StorageDB.getPatients();
    todayStr = new Date().toISOString().split('T')[0];
  }

  function getTodaysAppts() {
    return allAppointments.filter(function(a) { return a.appointmentDate === todayStr; });
  }

  // ── Formatting Helpers ──
  function formatTime24to12(timeStr) {
    if (!timeStr) return '--:--';
    var parts = timeStr.split(':');
    var h = parseInt(parts[0], 10);
    var m = parts[1];
    var ampm = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return h + ':' + m + ' ' + ampm;
  }

  function getInitials(name) {
    if (!name) return '--';
    var np = name.split(' ');
    return np.map(function(p) { return p.charAt(0); }).join('').substring(0, 2).toUpperCase();
  }

  function getPatientInfo(patient) {
    return (patient ? patient.age : '--') + 'Y &bull; ' + (patient ? (patient.gender || '--') : '--');
  }

  // ── Slot Marker Read ──
  function getDayMarkers(dayName) {
    var slots = window.StorageDB.getDoctorSlots(currentDoctorId);
    return slots ? (slots[dayName] || null) : null;
  }

  function getTodayDayName() {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  }

  // ── Check if appointment slot has elapsed ──
  function canStartConsultation(a) {
    if (!a || !a.appointmentDate) return false;
    if (a.appointmentDate !== todayStr) return false;
    var now = new Date();
    var apptDate = new Date(a.appointmentDate + 'T' + (a.startTime || '00:00'));
    return now >= apptDate;
  }

  // ══════════════════════════════════════════
  //  APPOINTMENTS LIST RENDER
  // ══════════════════════════════════════════

  function renderAppointments() {
    var tbody = document.querySelector('#appointmentsList .appts-table tbody');
    if (!tbody) return;

    var filtered = allAppointments.slice();

    // Period filter (all / today / week)
    if (currentFilter === 'today') {
      filtered = filtered.filter(function(a) { return a.appointmentDate === todayStr; });
    } else if (currentFilter === 'week') {
      var now = new Date();
      var startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1);
      var endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      var s = startOfWeek.toISOString().split('T')[0];
      var e = endOfWeek.toISOString().split('T')[0];
      filtered = filtered.filter(function(a) { return a.appointmentDate >= s && a.appointmentDate <= e; });
    }

    // Status filter
    if (currentStatusFilter !== 'all') {
      filtered = filtered.filter(function(a) {
        var st = (a.status || '').toLowerCase();
        if (currentStatusFilter === 'no-show') return st === 'noshow';
        return st === currentStatusFilter;
      });
    }

    // Date filter (specific date from native input)
    if (currentDateFilter) {
      filtered = filtered.filter(function(a) { return a.appointmentDate === currentDateFilter; });
    }

    // Search filter (patient name, ID, or reason)
    if (currentSearchQuery) {
      var q = currentSearchQuery.toLowerCase();
      filtered = filtered.filter(function(a) {
        return (a.patientName || '').toLowerCase().indexOf(q) !== -1 ||
               (a.patientId || '').toLowerCase().indexOf(q) !== -1 ||
               (a.reasonForVisit || '').toLowerCase().indexOf(q) !== -1;
      });
    }

    filtered.sort(function(a, b) {
      var d = (a.appointmentDate || '').localeCompare(b.appointmentDate || '');
      if (d !== 0) return d;
      return (a.startTime || '').localeCompare(b.startTime || '');
    });

    var total = filtered.length;
    var maxPage = Math.max(1, Math.ceil(total / APPT_PER_PAGE));
    if (_apptPage > maxPage) _apptPage = maxPage;
    var start = (_apptPage - 1) * APPT_PER_PAGE;
    var end = Math.min(start + APPT_PER_PAGE, total);
    var pageItems = filtered.slice(start, end);

    if (total === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4" style="font-size:0.85rem;">No appointments found.</td></tr>';
      document.getElementById('apptPageInfo').textContent = 'No appointments';
      var prevBtn = document.getElementById('btnApptPrev');
      var nextBtn = document.getElementById('btnApptNext');
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      bindActionButtons();
      return;
    }

    var rows = '';
    for (var i = 0; i < pageItems.length; i++) {
      var a = pageItems[i];
      var patient = window.StorageDB.getPatientById(a.patientId);
      var patientName = a.patientName || 'Unknown';
      var initials = getInitials(patientName);
      var pid = a.patientId || '--';
      var age = patient ? patient.age : '--';
      var gender = patient ? (patient.gender || '--') : '--';
      var timeDisplay = formatTime24to12(a.startTime);
      var dateDisplay = a.appointmentDate ? new Date(a.appointmentDate + 'T12:00:00').toLocaleDateString('en-US', { weekday:'short', day:'numeric', month:'short' }) : '--';
      var statusClass = a.status === 'Booked' ? 'bg-booked' : a.status === 'Completed' ? 'bg-completed' : a.status === 'Cancelled' ? 'bg-cancelled' : a.status === 'NoShow' ? 'bg-cancelled' : a.status === 'InProgress' ? 'bg-booked' : 'bg-pending';
      var statusLabel = a.status === 'NoShow' ? 'No-Show' : a.status === 'InProgress' ? 'In Progress' : a.status;

      var actionBtns = '<button class="action-btn action-view" data-appt-id="' + a.id + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>View</button>';

      if (a.status === 'Booked' && a.appointmentDate === todayStr) {
        actionBtns += '<button class="action-btn action-start" data-appt-id="' + a.id + '" style="background:#DCFCE7;color:#047857;"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>Start</button>';
      }

      rows += '<tr data-appt-id="' + a.id + '" class="appt-row-clickable">' +
        '<td>' + (start + i + 1) + '</td>' +
        '<td class="fw-medium" style="font-size:0.8rem;">' + dateDisplay + '</td>' +
        '<td class="fw-bold" style="font-size:0.85rem;">' + timeDisplay + '</td>' +
        '<td><div class="patient-details-col"><div class="avatar-circle" style="background:#DCFCE7;color:#166534;">' + initials + '</div><div><div class="fw-bold" style="color:var(--text-dark);font-size:0.85rem;">' + patientName + '</div><div class="text-muted" style="font-size:0.7rem;">' + pid + ' \u2022 ' + age + 'Y \u2022 ' + gender + '</div></div></div></td>' +
        '<td class="text-muted" style="font-size:0.8rem;">' + (a.reasonForVisit || '--') + '</td>' +
        '<td><span class="badge-status ' + statusClass + '">' + statusLabel + '</span></td>' +
        '<td><div class="action-btn-group justify-content-center">' + actionBtns + '</div></td></tr>';
    }
    tbody.innerHTML = rows;

    document.getElementById('apptPageInfo').textContent = 'Showing ' + (total ? (start + 1) + '-' + end : '0') + ' of ' + total + ' appointment' + (total !== 1 ? 's' : '');
    var prevBtn = document.getElementById('btnApptPrev');
    var nextBtn = document.getElementById('btnApptNext');
    if (prevBtn) { prevBtn.disabled = _apptPage <= 1; }
    if (nextBtn) { nextBtn.disabled = end >= total; }
    bindActionButtons();
  }

  // ══════════════════════════════════════════
  //  APPOINTMENT FILTER
  // ══════════════════════════════════════════

  var apptFilter = document.getElementById('apptFilter');
  var apptFilterMenu = document.getElementById('apptFilterMenu');
  if (apptFilter && apptFilterMenu) {
    apptFilter.addEventListener('click', function(e) {
      e.stopPropagation();
      var rect = apptFilter.getBoundingClientRect();
      apptFilterMenu.style.top = (rect.bottom + 4) + 'px';
      apptFilterMenu.style.left = rect.left + 'px';
      apptFilterMenu.classList.toggle('show');
    });
    apptFilterMenu.querySelectorAll('.dropdown-item').forEach(function(item) {
      item.addEventListener('click', function() {
        currentFilter = this.dataset.filter;
        _apptPage = 1;
        apptFilter.querySelector('span').textContent = this.textContent;
        apptFilterMenu.classList.remove('show');
        renderAppointments();
      });
    });
    document.addEventListener('click', function() { apptFilterMenu.classList.remove('show'); });
  }

  // ── Pagination Prev / Next ──
  document.getElementById('btnApptPrev').addEventListener('click', function() {
    if (_apptPage > 1) { _apptPage--; renderAppointments(); }
  });
  document.getElementById('btnApptNext').addEventListener('click', function() {
    var total = allAppointments.length;
    if ((_apptPage * APPT_PER_PAGE) < total) { _apptPage++; renderAppointments(); }
  });

  // ══════════════════════════════════════════
  //  ACTION BUTTON BINDER
  // ══════════════════════════════════════════

  function getAppointmentById(id) {
    for (var i = 0; i < allAppointments.length; i++) {
      if (allAppointments[i].id === id) return allAppointments[i];
    }
    return null;
  }

  // ══════════════════════════════════════════
  //  CONSULTATION WIZARD
  // ══════════════════════════════════════════

  var _wizardApptId = null;
  var _wizardTimerInterval = null;
  var _wizardStep = 1;

  function setWizardStep(step) {
    _wizardStep = step;
    document.querySelectorAll('#wizardStepTracker .step-item').forEach(function(item) {
      var s = parseInt(item.dataset.step);
      item.classList.toggle('completed', s < step);
      item.classList.toggle('active', s === step);
    });
    document.querySelectorAll('#wizardStepTracker .step-connector').forEach(function(conn, idx) {
      conn.classList.toggle('completed', idx + 1 < step);
    });
    for (var i = 1; i <= 5; i++) {
      var el = document.getElementById('wizStep' + i);
      if (el) el.style.display = (i === step) ? '' : 'none';
    }
    document.getElementById('wiz-back-btn').style.display = (step > 1) ? '' : 'none';
    document.getElementById('wiz-start-btn').style.display = (step === 1) ? '' : 'none';
    document.getElementById('wiz-end-btn').style.display = (step === 2) ? '' : 'none';
    document.getElementById('wiz-next-btn').style.display = (step >= 3 && step <= 4) ? '' : 'none';
    document.getElementById('wiz-save-btn').style.display = (step === 5) ? '' : 'none';
  }

  window.openConsultWizard = function(apptId) {
    var a = getAppointmentById(apptId);
    if (!a) return;
    _wizardApptId = apptId;
    var patient = window.StorageDB.getPatientById(a.patientId);
    var name = a.patientName || 'Unknown';
    var initials = getInitials(name);
    var pid = a.patientId || '--';
    var age = patient ? patient.age : '--';
    var gender = patient ? (patient.gender || '--') : '--';

    document.getElementById('wizard-patient-name').textContent = name;
    document.getElementById('wizard-patient-info').textContent = pid + ' \u2022 ' + age + 'Y \u2022 ' + gender + ' \u2022 ' + (a.reasonForVisit || 'Consultation');
    document.getElementById('wiz-patient-initials').textContent = initials;
    document.getElementById('wiz-patient-name').textContent = name;
    document.getElementById('wiz-patient-id').textContent = pid + ' \u2022 ' + age + 'Y \u2022 ' + gender;
    document.getElementById('wiz-patient-phone').textContent = patient ? (patient.contact || '--') : '--';
    document.getElementById('wiz-patient-blood').textContent = patient ? (patient.bloodGroup || '--') : '--';
    document.getElementById('wiz-patient-reason').textContent = a.reasonForVisit || '--';
    document.getElementById('wiz-patient-history').textContent = patient ? (patient.medicalHistory || 'No history recorded.') : 'No history recorded.';
    document.getElementById('wiz-medical-history-btn').setAttribute('data-patient-id', a.patientId);
    document.getElementById('wiz-medical-history-btn').setAttribute('data-patient-name', name);

    // Clear fields
    document.getElementById('wiz-consult-notes').value = '';
    document.getElementById('wiz-diagnosis').value = '';
    document.getElementById('wiz-treatment-notes').value = '';
    document.querySelector('#wiz-rx-table tbody').innerHTML = '';

    if (_wizardTimerInterval) clearInterval(_wizardTimerInterval);
    setWizardStep(1);
    openModal('consultWizard');
  };

  window.wizardStartConsult = function() {
    var a = getAppointmentById(_wizardApptId);
    if (!a) return;
    if (!canStartConsultation(a)) {
      if (a.appointmentDate !== todayStr) { showToast('Cannot start — this appointment was for a past date', 'info'); return; }
      showToast('Cannot start — appointment time has not arrived yet', 'info'); return;
    }
    setWizardStep(2);
    document.getElementById('wiz-timer').textContent = '00:00:00';
    if (_wizardTimerInterval) clearInterval(_wizardTimerInterval);
    _wizardTimerInterval = setInterval(function() {
      var el = document.getElementById('wiz-timer');
      if (!el) { clearInterval(_wizardTimerInterval); return; }
      var parts = el.textContent.split(':');
      var h = +parts[0], m = +parts[1], s = +parts[2];
      s++;
      if (s >= 60) { s = 0; m++; }
      if (m >= 60) { m = 0; h++; }
      el.textContent = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }, 1000);
  };

  window.wizardEndConsult = function() {
    if (_wizardTimerInterval) clearInterval(_wizardTimerInterval);
    setWizardStep(3);
  };

  window.wizardNextStep = function() {
    if (_wizardStep === 3) {
      var diagnosis = document.getElementById('wiz-diagnosis').value.trim();
      if (!diagnosis) { showToast('Please enter a primary diagnosis', 'error'); return; }
    }
    var next = _wizardStep + 1;
    setWizardStep(next);
    if (next === 5) {
      document.getElementById('wiz-summary-diagnosis').textContent = document.getElementById('wiz-diagnosis').value.trim() || '--';
      var rxRows = document.querySelectorAll('#wiz-rx-table tbody tr');
      var rxCount = 0;
      rxRows.forEach(function(tr) {
        if (tr.querySelector('input') && tr.querySelector('input').value.trim()) rxCount++;
      });
      document.getElementById('wiz-summary-rx').textContent = rxCount > 0 ? rxCount + ' medicine(s)' : 'None';
    }
  };

  window.wizardPrevStep = function() {
    if (_wizardStep > 1) setWizardStep(_wizardStep - 1);
  };

  window.wizardSaveComplete = function() {
    var a = getAppointmentById(_wizardApptId);
    if (!a) return;
    var diagnosis = document.getElementById('wiz-diagnosis').value.trim();
    if (!diagnosis) { showToast('Please enter a primary diagnosis', 'error'); return; }
    var notes = document.getElementById('wiz-treatment-notes').value.trim();
    var consultNotes = document.getElementById('wiz-consult-notes').value.trim();

    var rxRows = document.querySelectorAll('#wiz-rx-table tbody tr');
    var prescriptions = [];
    rxRows.forEach(function(row) {
      var inputs = row.querySelectorAll('input');
      if (inputs[0] && inputs[0].value.trim()) {
        prescriptions.push({
          medicine: inputs[0].value.trim(),
          dosage: inputs[1] ? inputs[1].value.trim() : '',
          frequency: inputs[2] ? inputs[2].value.trim() : '',
          duration: inputs[3] ? inputs[3].value.trim() : '',
          instructions: inputs[4] ? inputs[4].value.trim() : ''
        });
      }
    });

    a.status = 'Completed';
    a.diagnosis = diagnosis;
    a.notes = (notes || '') + (consultNotes ? '\n---\n' + consultNotes : '');
    a.prescriptions = prescriptions;
    window.StorageDB.updateAppointment(a);
    window.StorageDB.setSlotMarker(a.doctorId, a.appointmentDate, a.startTime, 'C');

    // Also save to global prescriptions store
    if (prescriptions.length > 0) {
      var doctor = window.StorageDB.getDoctorById(a.doctorId);
      window.StorageDB.savePrescription({
        id: window.StorageDB.generatePrescriptionCode(),
        patientId: a.patientId,
        patientName: a.patientName,
        doctorId: a.doctorId,
        doctorName: doctor ? doctor.name : a.doctorName || '--',
        department: a.department || 'General',
        diagnosis: diagnosis,
        date: new Date().toISOString().split('T')[0],
        medicines: prescriptions,
        notes: notes,
        status: 'Issued'
      });
    }

    // Notify admin and patient
    window.StorageDB.dispatchNotification('Consultation completed', a.patientName + '\'s consultation with ' + (a.doctorName || 'Doctor') + ' completed (diagnosis: ' + diagnosis.substring(0, 80) + ')', 'admin', null, 'success');
    window.StorageDB.dispatchNotification('Consultation completed', 'Your consultation with ' + (a.doctorName || 'Doctor') + ' on ' + a.appointmentDate + ' has been completed. Prescription available in your account.', 'patient', a.patientId, 'success');

    showToast((a.patientName || 'Patient') + ' marked completed', 'success');
    closeModal('consultWizard');
    fullRefresh();
  };

  window.closeConsultWizard = function() {
    if (_wizardTimerInterval) clearInterval(_wizardTimerInterval);
    closeModal('consultWizard');
  };

  // ── Wizard inline handlers (set once) ──
  document.getElementById('wiz-medical-history-btn').addEventListener('click', function() {
    var pid = this.getAttribute('data-patient-id');
    var name = this.getAttribute('data-patient-name');
    if (!pid) return;
    closeModal('consultWizard');
    showMedicalHistory(pid, name);
  });

  document.getElementById('wiz-add-rx').addEventListener('click', function() {
    var tb = document.querySelector('#wiz-rx-table tbody');
    if (!tb) return;
    var tr = document.createElement('tr');
    tr.innerHTML = '<td><input type="text" class="rx-input" placeholder="Medicine name"></td>' +
      '<td><input type="text" class="rx-input" placeholder="e.g. 500mg" style="width:90px"></td>' +
      '<td><input type="text" class="rx-input" placeholder="e.g. 3x/day" style="width:90px"></td>' +
      '<td><input type="text" class="rx-input" placeholder="Days" style="width:60px"></td>' +
      '<td><input type="text" class="rx-input" placeholder="e.g. After food" style="width:100px"></td>' +
      '<td><button class="rx-remove-btn">&times;</button></td>';
    tb.appendChild(tr);
    tr.querySelector('.rx-remove-btn').addEventListener('click', function() { tr.remove(); });
  });

  // ══════════════════════════════════════════
  //  BIND ACTION BUTTONS (View + row click)
  // ══════════════════════════════════════════

  function startConsultation(apptId) {
    var a = getAppointmentById(apptId);
    if (!a) return;
    if (a.status !== 'Booked') { showToast('Only Booked appointments can be started', 'error'); return; }
    if (a.appointmentDate !== todayStr) { showToast('Can only start today\'s appointments', 'error'); return; }
    a.status = 'InProgress';
    window.StorageDB.updateAppointment(a);
    showToast((a.patientName || 'Patient') + ' — consultation started', 'success');
    fullRefresh();
  }

  function bindActionButtons() {
    document.querySelectorAll('.action-view').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        openConsultWizard(this.dataset.apptId);
      });
    });
    document.querySelectorAll('.action-start').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        startConsultation(this.dataset.apptId);
      });
    });
    document.querySelectorAll('.appt-row-clickable').forEach(function(tr) {
      tr.addEventListener('click', function() {
        openConsultWizard(this.dataset.apptId);
      });
    });
  }

  // ══════════════════════════════════════════
  //  STATUS FILTER
  // ══════════════════════════════════════════

  var statusFilter = document.getElementById('statusFilter');
  var statusMenu = document.getElementById('statusMenu');
  if (statusFilter && statusMenu) {
    statusFilter.addEventListener('click', function(e) {
      e.stopPropagation();
      var rect = statusFilter.getBoundingClientRect();
      statusMenu.style.top = (rect.bottom + 4) + 'px';
      statusMenu.style.left = rect.left + 'px';
      statusMenu.classList.toggle('show');
    });
    statusMenu.querySelectorAll('.dropdown-item').forEach(function(item) {
      item.addEventListener('click', function() {
        currentStatusFilter = this.dataset.value;
        _apptPage = 1;
        statusFilter.querySelector('span').textContent = this.textContent;
        statusMenu.classList.remove('show');
        renderAppointments();
      });
    });
    document.addEventListener('click', function() { statusMenu.classList.remove('show'); });
  }

  // ══════════════════════════════════════════
  //  SEARCH
  // ══════════════════════════════════════════

  var searchInput = document.querySelector('.filter-dropdown input[type="text"]');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      currentSearchQuery = this.value.trim();
      _apptPage = 1;
      renderAppointments();
    });
  }

  // ══════════════════════════════════════════
  //  DATE FILTER
  // ══════════════════════════════════════════

  var dateFilterInput = document.getElementById('dateFilterInput');
  var clearDateBtn = document.getElementById('clearDateFilter');
  if (dateFilterInput) {
    dateFilterInput.addEventListener('change', function() {
      currentDateFilter = this.value || '';
      _apptPage = 1;
      if (clearDateBtn) clearDateBtn.style.display = currentDateFilter ? '' : 'none';
      renderAppointments();
    });
  }
  if (clearDateBtn) {
    clearDateBtn.addEventListener('click', function() {
      currentDateFilter = '';
      if (dateFilterInput) dateFilterInput.value = '';
      this.style.display = 'none';
      _apptPage = 1;
      renderAppointments();
    });
  }

  // ══════════════════════════════════════════
  //  QUEUE MODAL
  // ══════════════════════════════════════════

  var queueBtn = document.getElementById('queueAction');
  if (queueBtn) {
    queueBtn.addEventListener('click', function(e) {
      e.preventDefault();
      renderQueue();
      openModal('queueModal');
    });
  }

  function renderQueue() {
    var tbody = document.querySelector('#queueTable tbody');
    if (!tbody) return;
    var queueAppts = getTodaysAppts().filter(function(a) { return a.status === 'Booked'; }).sort(function(a, b) {
      return (a.startTime || '').localeCompare(b.startTime || '');
    });

    var countEl = document.querySelector('#queueAction .badge');
    if (countEl) countEl.textContent = queueAppts.length;

    tbody.innerHTML = '';
    if (queueAppts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">No patients in queue</td></tr>';
      return;
    }
    queueAppts.forEach(function(q) {
      var patient = window.StorageDB.getPatientById(q.patientId);
      var age = patient ? patient.age : '--';
      var gender = patient ? (patient.gender || '') : '';
      var waitTime = '--';
      if (q.startTime) {
        var parts = q.startTime.split(':');
        var slotMin = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        var nowMin = new Date().getHours() * 60 + new Date().getMinutes();
        var diff = nowMin - slotMin;
        if (diff <= 0) waitTime = 'Scheduled';
        else if (diff < 60) waitTime = diff + ' min';
        else waitTime = Math.floor(diff / 60) + 'h ' + (diff % 60) + 'm';
      }
      var tr = document.createElement('tr');
      tr.innerHTML = '<td><span class="fw-medium">' + (q.patientName || 'Unknown') + '</span><br><span class="text-muted" style="font-size:0.7rem;">' + (q.patientId || '') + '</span></td>' +
        '<td class="text-muted">' + (q.reasonForVisit || '--') + '</td>' +
        '<td class="text-muted">' + waitTime + '</td>' +
        '<td><span class="badge-status" style="background:#DCFCE7;color:#047857;">Normal</span></td>' +
        '<td><button class="btn btn-sm text-white call-patient-btn" style="background:var(--primary-green);border:none;font-size:0.7rem;">Call</button></td>';
      tbody.appendChild(tr);
      tr.querySelector('.call-patient-btn').addEventListener('click', function() {
        closeModal('queueModal');
        showToast('Calling ' + (q.patientName || 'patient') + ' to consultation room', 'info');
      });
    });
  }

  // ══════════════════════════════════════════
  //  PATIENT RECORDS MODAL
  // ══════════════════════════════════════════

  var recSearch = document.getElementById('recordsSearch');
  if (recSearch) {
    recSearch.addEventListener('input', function() { renderPatientRecords(this.value); });
  }

  function renderPatientRecords(query) {
    query = (query || '').toLowerCase();
    var tbody = document.querySelector('#recordsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    var filtered = allPatients;
    if (query) {
      filtered = allPatients.filter(function(p) {
        return (p.name || '').toLowerCase().includes(query) || (p.id || '').toLowerCase().includes(query);
      });
    }
    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">No patients found</td></tr>';
      return;
    }
    filtered.forEach(function(p) {
      var lastAppt = allAppointments.filter(function(a) { return a.patientId === p.id; }).sort(function(a, b) {
        return (b.appointmentDate || '').localeCompare(a.appointmentDate || '');
      })[0];
      var lastVisit = lastAppt ? lastAppt.appointmentDate : '--';
      var tr = document.createElement('tr');
      tr.innerHTML = '<td><span class="fw-medium">' + p.name + '</span><br><span class="text-muted" style="font-size:0.7rem;">' + p.id + '</span></td>' +
        '<td class="text-muted">' + (p.age || '--') + 'Y / ' + (p.gender || '--') + '</td>' +
        '<td class="text-muted">' + (p.contact || '--') + '</td>' +
        '<td class="text-muted">' + lastVisit + '</td>' +
        '<td><span class="badge-status" style="background:#E0F2FE;color:#0369A1;">' + (p.department || 'General') + '</span></td>' +
        '<td><button class="btn btn-sm view-record-btn" style="background:var(--primary-light);color:var(--primary-green);border:none;font-size:0.7rem;">View</button></td>';
      tbody.appendChild(tr);
      tr.querySelector('.view-record-btn').addEventListener('click', function() {
        closeModal('recordsModal');
        showToast('Opening records for ' + p.name, 'info');
      });
    });
  }

  // ══════════════════════════════════════════
  //  NOTIFICATIONS PANEL
  // ══════════════════════════════════════════

  var notifBtn = document.querySelector('.icon-btn-wrapper .icon-btn');
  var notifPanel = document.getElementById('notifPanel');
  if (notifBtn && notifPanel) {
    notifBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      notifPanel.classList.toggle('show');
      renderNotifications();
    });
    document.addEventListener('click', function(e) {
      if (notifPanel && !notifPanel.contains(e.target) && e.target !== notifBtn && !notifBtn.contains(e.target)) {
        notifPanel.classList.remove('show');
      }
    });
  }

  function renderNotifications() {
    var list = document.getElementById('notifList');
    if (!list) return;
    var recentNotifs = allAppointments.slice().sort(function(a, b) {
      return (b.appointmentDate || '').localeCompare(a.appointmentDate || '');
    }).slice(0, 5);
    list.innerHTML = '';
    if (recentNotifs.length === 0) {
      list.innerHTML = '<div class="notif-item"><div class="notif-body"><div class="notif-title">No notifications</div></div></div>';
      return;
    }
    var iconMap = {
      'Booked': { bg: '#DCFCE7', color: '#166534', icon: '\uD83D\uDCC5' },
      'Completed': { bg: '#E0F2FE', color: '#0369A1', icon: '\u2705' },
      'Cancelled': { bg: '#FEE2E2', color: '#B91C1C', icon: '\u274C' },
      'NoShow': { bg: '#FEF3C7', color: '#B45309', icon: '\u26A0\uFE0F' }
    };
    recentNotifs.forEach(function(n) {
      var cfg = iconMap[n.status] || iconMap['Booked'];
      var div = document.createElement('div');
      div.className = 'notif-item';
      div.innerHTML = '<div class="notif-icon" style="background:' + cfg.bg + ';color:' + cfg.color + ';">' + cfg.icon + '</div>' +
        '<div class="notif-body"><div class="notif-title">Appointment ' + n.status + '</div><div class="notif-desc">' + (n.patientName || 'Patient') + ' - ' + (n.reasonForVisit || 'Consultation') + '</div><div class="notif-time">' + n.appointmentDate + ' ' + (n.startTime || '') + '</div></div>';
      list.appendChild(div);
    });
  }

  var markReadBtn = document.getElementById('markAllRead');
  if (markReadBtn) {
    markReadBtn.addEventListener('click', function() {
      var badge = document.querySelector('.icon-badge');
      if (badge) badge.remove();
      notifPanel && notifPanel.classList.remove('show');
      showToast('All notifications marked as read', 'success');
    });
  }

  // ══════════════════════════════════════════
  //  CALENDAR MODAL
  // ══════════════════════════════════════════

  var calBtn = document.querySelectorAll('.icon-btn-wrapper .icon-btn')[1];
  if (calBtn) {
    calBtn.addEventListener('click', function() { openModal('calModal'); });
  }

  // ══════════════════════════════════════════
  //  QUICK ACTIONS
  // ══════════════════════════════════════════

  // ── Manage Availability Save ──
  var saveAvail = document.getElementById('save-avail');
  if (saveAvail) saveAvail.addEventListener('click', function() {
    closeModal('availModal');
    showToast('Availability updated', 'success');
  });

  // ══════════════════════════════════════════
  //  MEDICAL HISTORY MODAL
  // ══════════════════════════════════════════

  function showMedicalHistory(patientId, patientName) {
    var body = document.getElementById('historyModalBody');
    if (!body) return;

    // Get all completed appointments for this patient with diagnosis data
    var history = allAppointments.filter(function(a) {
      return a.patientId === patientId && a.status === 'Completed';
    }).sort(function(a, b) {
      return (b.appointmentDate || '').localeCompare(a.appointmentDate || '');
    });

    if (history.length === 0) {
      body.innerHTML = '<p class="text-muted" style="font-size:0.85rem;">No past medical history available for ' + patientName + '.</p>';
    } else {
      var html = '<p class="text-muted mb-3" style="font-size:0.85rem;">Past visits for <strong>' + patientName + '</strong></p>';
      html += '<div style="overflow-x:auto;"><table class="table table-borderless align-middle mb-0" style="font-size:0.8rem;">';
      html += '<thead><tr><th class="text-muted fw-medium" style="font-size:0.7rem;">Date</th><th class="text-muted fw-medium" style="font-size:0.7rem;">Doctor</th><th class="text-muted fw-medium" style="font-size:0.7rem;">Diagnosis</th><th class="text-muted fw-medium" style="font-size:0.7rem;">Medicines</th></tr></thead><tbody>';
      history.forEach(function(h) {
        var meds = h.prescriptions && h.prescriptions.length
          ? h.prescriptions.map(function(p) { return p.medicine; }).join(', ')
          : '--';
        var dName = h.doctorName || '--';
        html += '<tr><td class="fw-medium" style="white-space:nowrap;">' + h.appointmentDate + '</td>' +
          '<td>' + dName + '</td>' +
          '<td>' + (h.diagnosis || '--') + '</td>' +
          '<td>' + meds + '</td></tr>';
      });
      html += '</tbody></table></div>';
      body.innerHTML = html;
    }
    openModal('historyModal');
  }

  // ══════════════════════════════════════════
  //  FULL REFRESH (sync)
  // ══════════════════════════════════════════

  function fullRefresh() {
    loadAllData();
    renderAppointments();
  }

  // Sync when page becomes visible again (tab switch / focus)
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) fullRefresh();
  });
  window.addEventListener('focus', function() {
    fullRefresh();
  });

  // ══════════════════════════════════════════
  //  INIT
  // ══════════════════════════════════════════

  loadAllData();
  renderAppointments();

});
