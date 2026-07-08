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
  var currentDoctorId = sessionStorage.getItem('currentDoctorId') || 'DOC-1001';

  // ── State Model (matches console A/R/K/C/- markers) ──
  var MARKER_TO_STATE = { 'A': 'available', 'R': 'blocked', 'K': 'booked', 'C': 'completed', 'N': 'noshow', '-': 'empty' };
  var STATE_TO_MARKER = { available: 'A', blocked: 'R', booked: 'K', completed: 'C', noshow: 'N', empty: '-' };
  var STATE_LABEL = { available: 'Available', blocked: 'Blocked', empty: 'No Slot', booked: 'Booked', completed: 'Completed', noshow: 'No-Show' };
  var STATE_COLOR = { available: '#166534', blocked: '#B91C1C', empty: '#7A7268', booked: '#B45309', completed: '#047857', noshow: '#9A3412' };
  var STATE_BG = { available: '#DCFCE7', blocked: '#FEE2E2', empty: '#F0E8DA', booked: '#FEF3C7', completed: '#DCFCE7', noshow: '#FFF7ED' };
  var CYCLE_STATES = ['available', 'blocked', 'empty'];
  var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // ── Config (per-doctor localStorage) ──
  var configKey = 'medtrack_config_' + currentDoctorId;
  var defaultConfig = {
    slotDuration: 30,
    break1Start: '11:00',
    break1End: '11:15',
    lunchStart: '12:00',
    lunchEnd: '13:00',
    break2Start: '15:00',
    break2End: '15:15',
    slotTimes: ['09:00', '10:00', '11:00', '14:00', '16:00']
  };

  function loadConfig() {
    try {
      var saved = localStorage.getItem(configKey);
      if (saved) {
        var p = JSON.parse(saved);
        if (p.slotTimes && p.slotTimes.length === 5) return p;
      }
    } catch(e) {}
    return JSON.parse(JSON.stringify(defaultConfig));
  }

  function saveConfig(c) {
    try { localStorage.setItem(configKey, JSON.stringify(c)); } catch(e) {}
  }

  var config = loadConfig();

  // ── Per-Day Time Overrides ──
  var dayTimesKey = 'medtrack_day_times_' + currentDoctorId;
  var dayTimes = {};

  function loadDayTimes() {
    try {
      var saved = localStorage.getItem(dayTimesKey);
      dayTimes = saved ? JSON.parse(saved) : {};
    } catch(e) { dayTimes = {}; }
  }

  function saveDayTimes() {
    try { localStorage.setItem(dayTimesKey, JSON.stringify(dayTimes)); } catch(e) {}
  }

  function getDaySlotTimes(dayName) {
    if (dayTimes[dayName] && dayTimes[dayName].slotTimes) return dayTimes[dayName];
    return null;
  }

  loadDayTimes();

  // ── Grid Data (via StorageDB / medtrack_slots) ──
  var gridData = {};

  function loadGrid() {
    var stored = window.StorageDB.getDoctorSlots(currentDoctorId);
    gridData = {};
    if (stored) {
      DAY_NAMES.forEach(function(day) {
        var markers = stored[day] || ['-','-','-','-','-'];
        gridData[day] = markers.map(function(m) { return MARKER_TO_STATE[m] || 'empty'; });
      });
    } else {
      DAY_NAMES.forEach(function(day) {
        gridData[day] = ['empty','empty','empty','empty','empty'];
      });
    }
    // ── Repair: sync any booked appointments that lack 'K' markers ──
    syncBookedAppointmentsToGrid();
  }

  function syncBookedAppointmentsToGrid() {
    var appts = window.StorageDB.getAppointments() || [];
    var relevant = appts.filter(function(a) { return a.doctorId === currentDoctorId && (a.status === 'Booked' || a.status === 'NoShow' || a.status === 'Completed'); });
    if (!relevant.length) return;
    var changed = false;
    var statusToState = { 'Booked': 'booked', 'NoShow': 'noshow', 'Completed': 'completed' };
    relevant.forEach(function(appt) {
      var d = new Date(appt.appointmentDate + 'T00:00:00');
      var dayName = getDayNameFromDate(d);
      var slotIdx = findSlotIndexForAppointment(appt);
      if (slotIdx < 0 || slotIdx > 4) return;
      if (!gridData[dayName]) gridData[dayName] = ['empty','empty','empty','empty','empty'];
      var expectedState = statusToState[appt.status];
      if (gridData[dayName][slotIdx] !== expectedState) {
        gridData[dayName][slotIdx] = expectedState;
        changed = true;
      }
    });
    if (changed) saveGrid();
  }

  function getDayNameFromDate(dateObj) {
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    return days[dateObj.getDay()];
  }

  function findSlotIndexForAppointment(appt) {
    // Get this doctor's slot times for the appointment's day
    var d = new Date(appt.appointmentDate + 'T00:00:00');
    var dayName = getDayNameFromDate(d);
    var dayOverride = getDaySlotTimes(dayName);
    var times = dayOverride ? dayOverride.slotTimes : config.slotTimes;
    // Parse appointment start time (format: "2:00 PM" or "14:00")
    var apptMinutes = parseApptTimeToMinutes(appt.startTime);
    if (apptMinutes < 0) return -1;
    for (var i = 0; i < times.length; i++) {
      var parts = times[i].split(':');
      var slotMin = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      if (slotMin === apptMinutes) return i;
    }
    return -1;
  }

  function parseApptTimeToMinutes(timeStr) {
    if (!timeStr) return -1;
    var p = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (p) {
      var h = parseInt(p[1], 10), m = parseInt(p[2], 10);
      if (p[3].toUpperCase() === 'PM' && h !== 12) h += 12;
      if (p[3].toUpperCase() === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    }
    var p2 = timeStr.split(':');
    if (p2.length >= 2) return parseInt(p2[0], 10) * 60 + parseInt(p2[1], 10);
    return -1;
  }

  function saveGrid() {
    var output = {};
    DAY_NAMES.forEach(function(day) {
      output[day] = (gridData[day] || []).map(function(s) { return STATE_TO_MARKER[s] || '-'; });
    });
    window.StorageDB.saveDoctorSlots(currentDoctorId, output);
  }

  function syncSlotAppointment(dayName, slotIdx, newStatus, dateStr) {
    var timeStr;
    if (!dateStr) {
      var st = getSlotDateTime(dayName, slotIdx);
      dateStr = st.start.getFullYear() + '-' + String(st.start.getMonth() + 1).padStart(2, '0') + '-' + String(st.start.getDate()).padStart(2, '0');
      timeStr = String(st.start.getHours()).padStart(2, '0') + ':' + String(st.start.getMinutes()).padStart(2, '0');
    } else {
      var dayOverride = getDaySlotTimes(dayName);
      var times = dayOverride ? dayOverride.slotTimes : config.slotTimes;
      timeStr = times[slotIdx];
    }
    var allAppts = window.StorageDB.getAppointments();
    var match = null;
    for (var i = 0; i < allAppts.length; i++) {
      var a = allAppts[i];
      if (a.doctorId === currentDoctorId && a.appointmentDate === dateStr && a.startTime.indexOf(timeStr) !== -1) {
        match = a;
        break;
      }
    }
    if (!match) return;
    var slotMarker = newStatus === 'Completed' ? 'C' : newStatus === 'NoShow' ? 'N' : newStatus === 'Cancelled' ? 'A' : null;
    window.StorageDB.setApptStatusAndSlot(match.id, newStatus, slotMarker);
    // Dispatch notifications for status changes from availability grid
    if (newStatus === 'Completed') {
      window.StorageDB.dispatchNotification('Appointment completed', match.patientName + '\'s appointment with ' + (match.doctorName || 'Doctor') + ' marked completed', 'admin', null, 'success');
    } else if (newStatus === 'Cancelled') {
      window.StorageDB.dispatchNotification('Appointment cancelled', match.patientName + '\'s appointment ' + match.id + ' was cancelled by doctor', 'admin', null, 'warning');
      window.StorageDB.dispatchNotification('Appointment cancelled', 'Your appointment with ' + (match.doctorName || 'Doctor') + ' on ' + match.appointmentDate + ' has been cancelled by the doctor', 'patient', match.patientId, 'warning');
    } else if (newStatus === 'NoShow') {
      window.StorageDB.dispatchNotification('Patient no-show', match.patientName + ' did not attend appointment ' + match.id + ' with ' + (match.doctorName || 'Doctor'), 'admin', null, 'warning');
      window.StorageDB.dispatchNotification('Missed appointment', 'You missed your appointment with ' + (match.doctorName || 'Doctor') + ' on ' + match.appointmentDate + '. Please reschedule if needed.', 'patient', match.patientId, 'warning');
    }
  }

  // ── Tab Switching ──
  function switchTab(tab) {
    document.querySelectorAll('.avail-tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.avail-panel').forEach(function(p) { p.style.display = 'none'; });
    if (tab === 'setup') {
      document.getElementById('tabSetup').classList.add('active');
      document.getElementById('panelSetup').style.display = 'block';
    } else {
      document.getElementById('tabGrid').classList.add('active');
      document.getElementById('panelGrid').style.display = 'block';
      loadGrid();
      renderGrid();
    }
  }

  document.getElementById('tabSetup').addEventListener('click', function() {
    if (_editingDay) {
      _editingDay = null;
      document.getElementById('dayOverrideBanner').style.display = 'none';
      updateGenerateBtnLabel();
      renderSetup();
    }
    switchTab('setup');
  });
  document.getElementById('tabGrid').addEventListener('click', function() { switchTab('grid'); });

  // ── Tab 1: Setup Form ──
  function renderSetup() {
    document.getElementById('setupDuration').value = config.slotDuration;
    document.getElementById('setupB1S').value = config.break1Start;
    document.getElementById('setupB1E').value = config.break1End;
    document.getElementById('setupLunchS').value = config.lunchStart;
    document.getElementById('setupLunchE').value = config.lunchEnd;
    document.getElementById('setupB2S').value = config.break2Start;
    document.getElementById('setupB2E').value = config.break2End;
    for (var i = 0; i < 5; i++) {
      document.getElementById('setupSlot' + (i + 1)).value = config.slotTimes[i];
    }
  }

  function toMins(t) {
    if (!t) return 0;
    var p = t.split(':');
    return parseInt(p[0]) * 60 + parseInt(p[1]);
  }

  function clearGlows() {
    document.querySelectorAll('.slot-glow').forEach(function(el) { el.classList.remove('slot-glow'); });
  }

  function glowField(id) {
    var el = document.getElementById(id);
    if (el) { el.classList.add('slot-glow'); }
  }

  function validateSetup() {
    var err = document.getElementById('setupError');
    err.textContent = '';
    clearGlows();

    // Check breaks and lunch don't overlap
    var b1s = toMins(document.getElementById('setupB1S').value);
    var b1e = toMins(document.getElementById('setupB1E').value);
    if (b1e <= b1s) { glowField('setupB1E'); err.textContent = 'Break 1 end must be after start.'; return false; }

    var ls = toMins(document.getElementById('setupLunchS').value);
    var le = toMins(document.getElementById('setupLunchE').value);
    if (le <= ls) { glowField('setupLunchE'); err.textContent = 'Lunch end must be after start.'; return false; }
    if (ls < b1e && le > b1s) { glowField('setupLunchS'); glowField('setupB1E'); err.textContent = 'Lunch overlaps with Break 1.'; return false; }

    var b2s = toMins(document.getElementById('setupB2S').value);
    var b2e = toMins(document.getElementById('setupB2E').value);
    if (b2e <= b2s) { glowField('setupB2E'); err.textContent = 'Break 2 end must be after start.'; return false; }
    if (b2s < le && b2e > ls) { glowField('setupB2S'); glowField('setupLunchE'); err.textContent = 'Break 2 overlaps with Lunch.'; return false; }
    if (b2s < b1e && b2e > b1s) { glowField('setupB2S'); glowField('setupB1E'); err.textContent = 'Break 2 overlaps with Break 1.'; return false; }

    // Check slots don't overlap with breaks or each other
    var dur = parseInt(document.getElementById('setupDuration').value, 10) || 30;
    var breakRanges = [[b1s, b1e, 'Break 1'], [ls, le, 'Lunch'], [b2s, b2e, 'Break 2']];
    var slotValues = [];
    for (var i = 0; i < 5; i++) {
      var sv = document.getElementById('setupSlot' + (i + 1)).value;
      if (!sv) { glowField('setupSlot' + (i + 1)); err.textContent = 'Slot ' + (i + 1) + ' time is required.'; return false; }
      var ss = toMins(sv);
      var se = ss + dur;
      for (var b = 0; b < breakRanges.length; b++) {
        if (ss < breakRanges[b][1] && se > breakRanges[b][0]) {
          glowField('setupSlot' + (i + 1));
          err.textContent = 'Slot ' + (i + 1) + ' (' + sv + ') overlaps with ' + breakRanges[b][2] + '.'; return false;
        }
      }
      for (var p = 0; p < slotValues.length; p++) {
        var ps = toMins(slotValues[p]);
        var pe = ps + dur;
        if (ss < pe && se > ps) {
          glowField('setupSlot' + (i + 1));
          glowField('setupSlot' + (p + 1));
          err.textContent = 'Slot ' + (i + 1) + ' (' + sv + ') overlaps with Slot ' + (p + 1) + ' (' + slotValues[p] + '). Ensure at least ' + dur + ' min gap between slots.'; return false;
        }
      }
      slotValues.push(sv);
    }
    return true;
  }

  function updateGenerateBtnLabel() {
    var btn = document.getElementById('generateGridBtn');
    if (_editingDay) {
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-1"><polyline points="20 6 9 17 4 12"/></svg> Apply Times to This Day';
      btn.title = 'Only changes slot times — your blocked/booked slots stay as-is';
    } else {
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-1"><polyline points="20 6 9 17 4 12"/></svg> Generate Grid';
      btn.title = 'Resets ALL slots to Available with current config';
    }
  }

  document.getElementById('generateGridBtn').addEventListener('click', function() {
    if (!validateSetup()) return;

    var dur = parseInt(document.getElementById('setupDuration').value, 10) || 30;
    var slotVals = [];
    for (var i = 0; i < 5; i++) {
      slotVals[i] = document.getElementById('setupSlot' + (i + 1)).value;
    }

    if (_editingDay) {
      var editedDay = _editingDay;
      var daySlots = gridData[editedDay] || [];

      var currentDayTimes = getDaySlotTimes(editedDay);
      var origTimes = currentDayTimes ? currentDayTimes.slotTimes : config.slotTimes;
      var origDur = currentDayTimes ? currentDayTimes.slotDuration : config.slotDuration;
      var hadBookingPreserved = false;

      // ── Determine past slots (using original times) ──
      var now = new Date();
      var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      var dayDate = new Date(todayStart);
      var dayOffset = DAY_NAMES.indexOf(editedDay) - todayStart.getDay();
      dayDate.setDate(todayStart.getDate() + dayOffset);
      var isPastSlot = [];
      for (var si = 0; si < 5; si++) {
        isPastSlot[si] = false;
        if (origTimes && origTimes[si]) {
          var p = origTimes[si].split(':');
          var ss = new Date(dayDate);
          ss.setHours(parseInt(p[0], 10), parseInt(p[1], 10), 0, 0);
          if (new Date(ss.getTime() + origDur * 60000) < now) {
            isPastSlot[si] = true;
          }
        }
      }

      // ── Preserve times: past slots + booked/completed/noshow ──
      for (var si = 0; si < 5; si++) {
        var preserve = isPastSlot[si] || daySlots[si] === 'booked' || daySlots[si] === 'completed' || daySlots[si] === 'noshow';
        if (preserve && origTimes && origTimes[si] && origTimes[si] !== slotVals[si]) {
          slotVals[si] = origTimes[si];
          document.getElementById('setupSlot' + (si + 1)).value = origTimes[si];
          hadBookingPreserved = true;
        }
      }

      dayTimes[editedDay] = { slotTimes: slotVals, slotDuration: dur };
      saveDayTimes();
      // Reset: past + booked/completed/noshow stay, rest become available
      for (var si = 0; si < 5; si++) {
        if (!isPastSlot[si] && daySlots[si] !== 'booked' && daySlots[si] !== 'completed' && daySlots[si] !== 'noshow') {
          daySlots[si] = 'available';
        }
      }
      gridData[editedDay] = daySlots;
      saveGrid();
      _editingDay = null;
      document.getElementById('dayOverrideBanner').style.display = 'none';
      updateGenerateBtnLabel();
      switchTab('grid');
      var msg = editedDay + ' configured with new times';
      if (hadBookingPreserved) msg += ' (past/booked/completed/noshow slots preserved)';
      showToast(msg, hadBookingPreserved ? 'info' : 'success');
    } else {
      // ── Preserve original times for booked/completed/noshow slots ──
      // Before overwriting config, create day overrides for any day that
      // has a booked/completed/noshow slot at an index whose time changed.
      var hadBookingPreserved = false;
      var oldConfigTimes = config.slotTimes.slice();
      DAY_NAMES.forEach(function(day) {
        var existing = gridData[day] || [];
        var dayOverride = getDaySlotTimes(day);
        var origTimes = dayOverride ? dayOverride.slotTimes : oldConfigTimes;
        var newSlotTimes = slotVals.slice();
        var changed = false;
        for (var si = 0; si < 5; si++) {
          if (existing[si] === 'booked' || existing[si] === 'completed' || existing[si] === 'noshow') {
            if (origTimes && origTimes[si] && origTimes[si] !== slotVals[si]) {
              newSlotTimes[si] = origTimes[si];
              changed = true;
            }
          }
        }
        if (changed) {
          var dur = dayOverride ? dayOverride.slotDuration : config.slotDuration;
          dayTimes[day] = { slotTimes: newSlotTimes, slotDuration: dur };
          hadBookingPreserved = true;
        }
      });
      if (hadBookingPreserved) saveDayTimes();

      config.slotDuration = dur;
      config.break1Start = document.getElementById('setupB1S').value;
      config.break1End = document.getElementById('setupB1E').value;
      config.lunchStart = document.getElementById('setupLunchS').value;
      config.lunchEnd = document.getElementById('setupLunchE').value;
      config.break2Start = document.getElementById('setupB2S').value;
      config.break2End = document.getElementById('setupB2E').value;
      for (var i = 0; i < 5; i++) {
        config.slotTimes[i] = slotVals[i];
      }
      saveConfig(config);

      // Preserve booked/completed slots, reset rest to available
      DAY_NAMES.forEach(function(day) {
        var existing = gridData[day] || [];
        gridData[day] = existing.map(function(s) {
          return (s === 'booked' || s === 'completed' || s === 'noshow') ? s : 'available';
        });
      });
      saveGrid();
      switchTab('grid');
      var msg = 'Grid generated from setup (booked/completed preserved)';
      if (hadBookingPreserved) msg += '; booked slot times preserved via day override';
      showToast(msg, hadBookingPreserved ? 'info' : 'success');
    }
  });

  document.getElementById('setupResetBtn').addEventListener('click', function() {
    config = JSON.parse(JSON.stringify(defaultConfig));
    saveConfig(config);
    renderSetup();
    showToast('Setup reset to defaults', 'info');
  });

  // ── Tab 2: Slots Grid ──

  function timeLabel(t) {
    if (!t) return '--:--';
    var parts = t.split(':');
    var h = parseInt(parts[0]), m = parts[1];
    var ampm = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return h + ':' + m + ' ' + ampm;
  }

  var SHORT_DAY = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  function renderGrid() {
    var tbody = document.getElementById('gridBody');
    tbody.innerHTML = '';

    var totals = { available: 0, blocked: 0, empty: 0, booked: 0, completed: 0, noshow: 0 };

    var weekDates = [];
    var today = new Date();
    for (var di = 0; di < 7; di++) {
      var d = new Date(today);
      d.setDate(today.getDate() + di);
      weekDates.push(d);
    }

    var todayStart = new Date();
    todayStart.setHours(0,0,0,0);

    weekDates.forEach(function(dateObj) {
      var dayIndex = dateObj.getDay();
      var dayName = DAY_NAMES[dayIndex];
      var shortDay = SHORT_DAY[dayIndex];
      var dayNum = String(dateObj.getDate()).padStart(2, '0');
      var monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' });
      var dateLabel = shortDay + ', ' + dayNum + ' ' + monthShort;

      var isToday = dateObj.toDateString() === todayStart.toDateString();
      var slots = gridData[dayName] || ['empty','empty','empty','empty','empty'];
      var isWeekend = (dayIndex === 0 || dayIndex === 6);

      // Get per-day times (fallback to global config)
      var dayOverride = getDaySlotTimes(dayName);
      var daySlotTimes = dayOverride ? dayOverride.slotTimes : config.slotTimes;
      var dayDuration = dayOverride ? dayOverride.slotDuration : config.slotDuration;

      slots.forEach(function(s) { totals[s] = (totals[s] || 0) + 1; });

      var tr = document.createElement('tr');
      if (isToday) { tr.className = 'today-row'; }
      else if (isWeekend) { tr.className = 'weekend-row'; }

      var tdDay = document.createElement('td');
      tdDay.className = 'grid-day-col' + (isToday ? ' today' : '');
      tdDay.style.cursor = 'pointer';
      if (isToday) tdDay.innerHTML = '<span class="today-dot"></span> ' + dateLabel;
      else tdDay.textContent = dateLabel;
      tdDay.addEventListener('click', function() {
        if (paintState) return;
        openDayConfig(dayName, dateLabel, dateObj);
      });
      tr.appendChild(tdDay);

      var now = new Date();
      for (var si2 = 0; si2 < 5; si2++) {
        var state = slots[si2] || 'empty';
        var cell = document.createElement('td');
    var slotTimeStr = daySlotTimes[si2];
    var isPastSlot = false;
    if (slotTimeStr) {
      var sp = slotTimeStr.split(':');
      var slotDate = new Date(dateObj);
      slotDate.setHours(parseInt(sp[0], 10), parseInt(sp[1], 10), 0, 0);
      var slotEnd = new Date(slotDate.getTime() + dayDuration * 60000);
      isPastSlot = slotEnd < now;
    }
        cell.className = 'avail-cell slot-' + state + (isWeekend ? ' weekend' : '') + (isPastSlot ? ' slot-past' : '');
        cell.dataset.day = dayName;
        cell.dataset.slot = si2;
        cell.dataset.date = dateObj.toISOString().split('T')[0];

        var timeHtml = document.createElement('span');
        timeHtml.className = 'slot-time';
        timeHtml.textContent = daySlotTimes[si2] ? timeLabel(daySlotTimes[si2]) : '';

        var label = document.createElement('span');
        label.className = 'slot-label';
        label.textContent = STATE_TO_MARKER[state] || '-';
        cell.appendChild(timeHtml);
        cell.appendChild(label);

        var sub = document.createElement('span');
        sub.className = 'slot-sub';
        sub.textContent = STATE_LABEL[state] || 'Empty';
        cell.appendChild(sub);

        cell.addEventListener('click', function() {
          if (paintState) return;
          var day = this.dataset.day;
          var slot = parseInt(this.dataset.slot);
          var dateStr = this.dataset.date;
          var cur = gridData[day][slot];
          openSlotAction(this, day, slot, cur, dateStr);
        });

        tr.appendChild(cell);
      }

      tbody.appendChild(tr);
    });

    updateStats(totals);
  }

  function isSlotPast(dayName, slotIdx, dateStr) {
    if (!dateStr) return true;
    var dayOverride = getDaySlotTimes(dayName);
    var times = dayOverride ? dayOverride.slotTimes : config.slotTimes;
    var dur = dayOverride ? dayOverride.slotDuration : config.slotDuration;
    var timeStr = times[slotIdx];
    if (!timeStr) return true;
    var p = timeStr.split(':');
    var slotDate = new Date(dateStr + 'T00:00:00');
    slotDate.setHours(parseInt(p[0], 10), parseInt(p[1], 10), 0, 0);
    var slotEnd = new Date(slotDate.getTime() + dur * 60000);
    return slotEnd < new Date();
  }

  function updateCell(cell, day, slot, newState) {
    gridData[day][slot] = newState;
    var dateStr = cell.dataset.date;
    var isPastSlot = isSlotPast(day, slot, dateStr);
    cell.className = 'avail-cell slot-' + newState + (cell.classList.contains('weekend') ? ' weekend' : '') + (isPastSlot ? ' slot-past' : '');
    cell.querySelector('.slot-label').textContent = STATE_TO_MARKER[newState] || '-';
    cell.querySelector('.slot-sub').textContent = STATE_LABEL[newState] || 'Empty';

    // Recalc totals
    var totals = { available: 0, blocked: 0, empty: 0, booked: 0, completed: 0, noshow: 0 };
    DAY_NAMES.forEach(function(d) {
      (gridData[d] || []).forEach(function(s) { totals[s] = (totals[s] || 0) + 1; });
    });
    updateStats(totals);
    saveGrid();
  }

  // ── Time helpers ──
  function getSlotDateTime(dayName, slotIdx, dateObj) {
    var now = new Date();
    if (!dateObj) {
      var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      var dayIndex = DAY_NAMES.indexOf(dayName);
      dateObj = new Date(today);
      dateObj.setDate(today.getDate() + dayIndex);
    }
    var dayOverride = getDaySlotTimes(dayName);
    var times = dayOverride ? dayOverride.slotTimes : config.slotTimes;
    var dur = dayOverride ? dayOverride.slotDuration : config.slotDuration;
    var timeStr = times[slotIdx] || '09:00';
    var parts = timeStr.split(':');
    dateObj.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
    var endDate = new Date(dateObj.getTime() + dur * 60000);
    return { start: dateObj, end: endDate };
  }

  function slotActionAddBtn(parent, label, color, iconSvg, onClick) {
    var btn = document.createElement('button');
    btn.className = 'slot-opt-btn';
    btn.style.border = '1px solid ' + color;
    btn.style.color = color;
    btn.innerHTML = (iconSvg || '') + ' ' + label;
    btn.addEventListener('click', onClick);
    parent.appendChild(btn);
  }

  // ── Slot Action Card ──
  function openSlotAction(cell, day, slot, curState, dateStr) {
    var overlay = document.getElementById('slotOverlay');
    var title = document.getElementById('slotCardTitle');
    var info = document.getElementById('slotCardInfo');
    var options = document.getElementById('slotCardOptions');

    var dayOverride = getDaySlotTimes(day);
    var times = dayOverride ? dayOverride.slotTimes : config.slotTimes;
    var dur = dayOverride ? dayOverride.slotDuration : config.slotDuration;
    title.textContent = day + ' \u2014 ' + timeLabel(times[slot]);

    var now = new Date();
    var slotStart = new Date();
    var slotEnd = new Date();
    if (dateStr && times[slot]) {
      var sp = times[slot].split(':');
      slotStart = new Date(dateStr + 'T00:00:00');
      slotStart.setHours(parseInt(sp[0], 10), parseInt(sp[1], 10), 0, 0);
      slotEnd = new Date(slotStart.getTime() + dur * 60000);
    }
    var canComplete = slotStart <= now;
    var canPreManage = slotStart > new Date(now.getTime() + 2 * 3600000);
    var isPast = slotEnd < now;

    // Past non-booked slots are read-only
    if (isPast && curState !== 'booked') {
      var curColor2 = STATE_COLOR[curState] || '#7A7268';
      var curLabel2 = STATE_LABEL[curState] || 'Empty';
      info.innerHTML = '<div style="font-size:0.9rem;color:var(--text-muted);">Status: <strong style="color:' + curColor2 + ';">' + curLabel2 + '</strong></div><div style="font-size:0.8rem;color:var(--muted-text);margin-top:6px;">This slot has passed and cannot be modified.</div>';
      options.innerHTML = '';
      overlay.style.display = 'flex';
      overlay.classList.add('open');
      return;
    }

    var curLabel = STATE_LABEL[curState] || 'Empty';
    var curColor = STATE_COLOR[curState] || '#7A7268';

    // ── Completed / No-Show: read-only ──
    if (curState === 'completed' || curState === 'noshow') {
      var readonlyMsg = curState === 'completed' ? 'Completed appointments are read-only.' : 'No-show slots are read-only.';
      info.innerHTML = '<div style="font-size:0.9rem;color:var(--text-muted);">Status: <strong style="color:' + curColor + ';">' + curLabel + '</strong></div><div style="font-size:0.8rem;color:var(--muted-text);margin-top:6px;">' + readonlyMsg + '</div>';
      options.innerHTML = '';
      overlay.style.display = 'flex';
      overlay.classList.add('open');
      return;
    }

    // ── Booked (K) ──
    if (curState === 'booked') {
      options.innerHTML = '';
      if (canComplete) {
        // Slot started/passed → doctor can complete or no-show
        info.innerHTML = '<div style="font-size:0.9rem;color:var(--text-muted);margin-bottom:8px;">Status: <strong style="color:#B45309;">Booked (K)</strong></div><div style="font-size:0.8rem;color:var(--muted-text);">This slot has started. Mark as completed or no-show.</div>';
        slotActionAddBtn(options, 'Mark Completed', '#1D4ED8', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>', function() {
          updateCell(cell, day, slot, 'completed');
          syncSlotAppointment(day, slot, 'Completed', dateStr);
          closeSlotAction();
          showToast('Slot marked as Completed', 'success');
        });
        slotActionAddBtn(options, 'Mark No-Show', '#9A3412', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>', function() {
          updateCell(cell, day, slot, 'noshow');
          syncSlotAppointment(day, slot, 'NoShow', dateStr);
          closeSlotAction();
          showToast('Marked as No-Show', 'info');
        });
      } else if (canPreManage) {
        // More than 2 hours away → can cancel
        info.innerHTML = '<div style="font-size:0.9rem;color:var(--text-muted);margin-bottom:8px;">Status: <strong style="color:#B45309;">Booked (K)</strong></div><div style="font-size:0.8rem;color:var(--muted-text);">This appointment is more than 2 hours away.</div>';
        slotActionAddBtn(options, 'Cancel Appointment', '#B91C1C', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>', function() {
          if (confirm('Cancel this appointment and release the slot?')) {
            updateCell(cell, day, slot, 'available');
            syncSlotAppointment(day, slot, 'Cancelled', dateStr);
            closeSlotAction();
            showToast('Appointment cancelled, slot released', 'info');
          }
        });
      } else {
        // Within 2 hours
        info.innerHTML = '<div style="font-size:0.9rem;color:var(--text-muted);margin-bottom:8px;">Status: <strong style="color:#B45309;">Booked (K)</strong></div><div style="font-size:0.8rem;color:#B45309;font-weight:500;display:flex;align-items:center;gap:6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B45309" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Within 2-hour window \u2014 cannot modify or cancel.</div>';
      }
      overlay.style.display = 'flex';
      overlay.classList.add('open');
      return;
    }

    // ── Available / Blocked / Empty: cycle toggle ──
    info.innerHTML = '<div style="font-size:0.9rem;color:var(--text-muted);margin-bottom:4px;">Current: <strong style="color:' + curColor + ';">' + curLabel + '</strong></div>';
    options.innerHTML = '';
    CYCLE_STATES.forEach(function(st) {
      var isCurrent = st === curState;
      var btn = document.createElement('button');
      btn.className = 'slot-opt-btn' + (isCurrent ? ' slot-opt-current' : '');
      btn.innerHTML = '<span class="slot-opt-marker" style="background:' + STATE_COLOR[st] + ';">' + STATE_TO_MARKER[st] + '</span> ' + STATE_LABEL[st] + (isCurrent ? ' <span class="slot-opt-current-badge">(current)</span>' : '');
      if (!isCurrent) {
        btn.addEventListener('click', function() {
          updateCell(cell, day, slot, st);
          closeSlotAction();
        });
      }
      options.appendChild(btn);
    });

    overlay.style.display = 'flex';
    overlay.classList.add('open');
  }

  function closeSlotAction() {
    var overlay = document.getElementById('slotOverlay');
    overlay.style.display = 'none';
    overlay.classList.remove('open');
  }

  document.getElementById('slotCardClose').addEventListener('click', closeSlotAction);
  document.getElementById('slotCardCancel').addEventListener('click', closeSlotAction);

  // ── Paint Mode ──
  var paintState = null;

  document.querySelectorAll('.legend-item').forEach(function(item) {
    item.addEventListener('click', function() {
      var st = this.dataset.state;
      if (st === 'booked' || st === 'completed' || st === 'noshow') {
        showToast('Booked/Completed/No-Show are set automatically from appointments', 'info');
        return;
      }
      if (paintState === st) {
        paintState = null;
        document.querySelectorAll('.legend-item').forEach(function(li) { li.style.outline = ''; });
        showToast('Paint mode off', 'info');
        return;
      }
      paintState = st;
      document.querySelectorAll('.legend-item').forEach(function(li) { li.style.outline = ''; });
      this.style.outline = '2px solid ' + STATE_COLOR[st];
      showToast('Click slots to mark as "' + STATE_LABEL[st] + '"', 'info');
    });
  });

  document.addEventListener('click', function(e) {
    var cell = e.target.closest('.avail-cell');
    if (!cell || !cell.dataset.day || !paintState) return;
    var day = cell.dataset.day;
    var slot = parseInt(cell.dataset.slot);
    var cur = gridData[day][slot];
    if (cur === 'booked' || cur === 'completed' || cur === 'noshow') {
      showToast('Cannot paint over booked/completed/no-show slots', 'info');
      return;
    }
    updateCell(cell, day, slot, paintState);
  }, true);

  // ── Day Override Mode (reuses Setup tab) ──
  var _editingDay = null;

  function openDayConfig(dayName, dateLabel, dateObj) {
    // ── Rule: Cannot configure past days (matches C# DoctorDashboard.cs:793) ──
    var todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (dateObj && dateObj < todayStart) {
      showToast('Cannot configure past days.', 'error');
      return;
    }

    // ── Rule: Cannot configure a day where ALL slots have already passed (matches C# DoctorDashboard.cs:78-83) ──
    if (dateObj) {
      var now = new Date();
      var dayOverride = getDaySlotTimes(dayName);
      var dayTimes = dayOverride ? dayOverride.slotTimes : config.slotTimes;
      var dayDur = dayOverride ? dayOverride.slotDuration : config.slotDuration;
      var allPassed = true;
      for (var si = 0; si < 5; si++) {
        var timeStr = dayTimes[si] || '09:00';
        var parts = timeStr.split(':');
        var slotStart = new Date(dateObj);
        slotStart.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
        var slotEnd = new Date(slotStart.getTime() + dayDur * 60000);
        if (slotEnd > now) {
          allPassed = false;
          break;
        }
      }
      if (allPassed) {
        showToast('All slots for this day have already passed. Cannot configure.', 'error');
        return;
      }
    }

    _editingDay = dayName;
    updateGenerateBtnLabel();
    var dayOverride = getDaySlotTimes(dayName);
    var times = dayOverride ? dayOverride.slotTimes : config.slotTimes;
    var dur = dayOverride ? dayOverride.slotDuration : config.slotDuration;

    // Pre-fill setup form with this day's times
    document.getElementById('setupDuration').value = dur;
    for (var i = 0; i < 5; i++) {
      document.getElementById('setupSlot' + (i + 1)).value = times[i] || '09:00';
    }

    document.getElementById('dayOverrideBanner').style.display = 'flex';
    document.getElementById('dayOverrideLabel').textContent = dayName + ' \u2014 ' + dateLabel;

    switchTab('setup');
    showToast('Editing ' + dayName + ' \u2014 configure times then Generate', 'info');
  }

  document.getElementById('dayOverrideCancel').addEventListener('click', function() {
    _editingDay = null;
    document.getElementById('dayOverrideBanner').style.display = 'none';
    updateGenerateBtnLabel();
    renderSetup();
    showToast('Day override cancelled', 'info');
  });

  // ── Stats ──
  function updateStats(totals) {
    document.getElementById('statAvailable').textContent = totals.available || 0;
    document.getElementById('statBlocked').textContent = totals.blocked || 0;
    document.getElementById('statBooked').textContent = totals.booked || 0;
    document.getElementById('statCompleted').textContent = totals.completed || 0;
    document.getElementById('statNoShow').textContent = totals.noshow || 0;
    document.getElementById('statEmpty').textContent = totals.empty || 0;
  }

  // ── Grid Actions ──
  document.getElementById('saveGridBtn').addEventListener('click', function() {
    saveGrid();
    var docName = sessionStorage.getItem('doctorName') || currentDoctorId;
    window.StorageDB.dispatchNotification('Availability updated', docName + ' updated their availability schedule', 'admin', null, 'info');
    showToast('Availability saved', 'success');
  });

  document.getElementById('resetGridBtn').addEventListener('click', function() {
    // Check if there are any booked/completed slots that would be affected
    var hasBookedOrCompleted = false;
    DAY_NAMES.forEach(function(day) {
      (gridData[day] || []).forEach(function(s) {
        if (s === 'booked' || s === 'completed' || s === 'noshow') hasBookedOrCompleted = true;
      });
    });
    if (hasBookedOrCompleted) {
      if (!confirm('Some slots are booked or completed. Reset will only affect available/blocked/empty slots. Continue?')) return;
    } else {
      if (!confirm('Reset all slots to empty?')) return;
    }
    DAY_NAMES.forEach(function(day) {
      var slots = gridData[day] || [];
      for (var i = 0; i < 5; i++) {
        if (slots[i] !== 'booked' && slots[i] !== 'completed' && slots[i] !== 'noshow') {
          slots[i] = 'empty';
        }
      }
    });
    saveGrid();
    renderGrid();
    showToast('Grid reset (booked/completed preserved)', 'info');
  });

  document.getElementById('fillAvailableBtn').addEventListener('click', function() {
    DAY_NAMES.forEach(function(day) {
      var slots = gridData[day] || [];
      for (var i = 0; i < 5; i++) {
        if (slots[i] !== 'booked' && slots[i] !== 'completed' && slots[i] !== 'noshow') {
          slots[i] = 'available';
        }
      }
    });
    saveGrid();
    renderGrid();
    showToast('All slots set to Available', 'success');
  });

  // ── Modal Helpers ──
  function closeModal(id) {
    var el = document.getElementById(id);
    if (el) { el.style.display = 'none'; el.classList.remove('open'); }
  }
  document.querySelectorAll('.appt-modal').forEach(function(m) {
    m.addEventListener('click', function(e) { if (e.target === m) { this.style.display = 'none'; this.classList.remove('open'); } });
  });

  // ── Toast ──
  function showToast(msg, type) {
    var t = document.createElement('div');
    t.className = 'toast-notification ' + (type || 'success');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function() { t.classList.add('show'); }, 10);
    setTimeout(function() { t.classList.remove('show'); setTimeout(function() { t.remove(); }, 300); }, 2800);
  }

  // ── Cross-tab & same-tab sync ──
  function reloadGridData() {
    loadGrid();
    if (document.getElementById('panelGrid').style.display !== 'none') renderGrid();
  }
  window.addEventListener('storage', function(e) {
    if (e.key === 'medtrack_slots' || e.key === 'medtrack_appointments' || (e.key && e.key.indexOf('medtrack_config_') === 0)) {
      reloadGridData();
    }
  });
  document.addEventListener('medtrack:dataChanged', reloadGridData);

  // ── Init ──
  loadGrid();
  renderSetup();
  switchTab('setup');
});
