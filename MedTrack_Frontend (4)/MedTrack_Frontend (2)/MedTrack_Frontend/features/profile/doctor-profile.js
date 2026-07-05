var _saving = false;

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

  // ── Doctor Data ──

  var PROFILE_KEY = 'medtrack_doctor_profile';

  function getDoctorFromStorage() {
    var docId = sessionStorage.getItem('currentDoctorId') || '';
    var doc = window.StorageDB ? window.StorageDB.getDoctorById(docId) : null;
    if (!doc && window.StorageDB) {
      var allDocs = window.StorageDB.getDoctors();
      doc = allDocs.length ? allDocs[0] : null;
    }
    return doc;
  }

  function loadProfile() {
    var doc = getDoctorFromStorage();
    if (!doc) {
      doc = { id: 'DOC-0000', name: 'Unknown Doctor', department: 'General', email: '', contact: '', qualification: '', experience: 0 };
    }
    var stored = localStorage.getItem(PROFILE_KEY);
    var extended = {};
    if (stored) {
      try { extended = JSON.parse(stored); } catch (e) {}
    }
    return {
      id: doc.id || extended.id,
      name: doc.name || extended.name || 'Doctor',
      email: doc.email || extended.email || '',
      phone: doc.contact || extended.phone || '',
      department: doc.department || extended.department || 'General',
      qualification: doc.qualification || extended.qualification || '',
      experience: doc.experience || extended.experience || 0,
      blood: extended.blood || 'O+',
      languages: extended.languages || '',
      about: extended.about || ''
    };
  }

  function saveProfile(data) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({
      id: data.id, name: data.name, email: data.email, phone: data.phone,
      department: data.department, qualification: data.qualification,
      experience: data.experience, blood: data.blood, languages: data.languages, about: data.about
    }));
    var doc = getDoctorFromStorage();
    if (doc && window.StorageDB) {
      doc.name = data.name;
      doc.email = data.email;
      doc.contact = data.phone;
      doc.department = data.department;
      doc.qualification = data.qualification;
      doc.experience = data.experience;
      window.StorageDB.updateDoctor(doc);
      if (sessionStorage.getItem('doctorName')) sessionStorage.setItem('doctorName', data.name);
    }
  }

  var doctor = loadProfile();

  // ── Render ──

  function renderProfile() {
    var initials = getInitials(doctor.name);
    var avatarColor = '#047857';
    document.getElementById('profileCard').innerHTML =
      '<div class="profile-card-banner"></div>' +
      '<div class="profile-card-body">' +
        '<div class="profile-avatar-lg" style="background:' + avatarColor + ';">' + initials + '</div>' +
        '<div class="profile-name-section">' +
          '<div class="profile-doctor-name">' + doctor.name + '</div>' +
          '<div class="profile-doctor-id">' + doctor.id + ' &bull; ' + doctor.department + '</div>' +
        '</div>' +
        '<div class="profile-card-actions">' +
          '<button class="btn btn-sm btn-profile-edit" id="editProfileBtn">Edit Profile</button>' +
        '</div>' +
      '</div>';

    document.getElementById('editProfileBtn').addEventListener('click', function () {
      openEditModal();
    });

    var infoItems = [
      { icon: 'mail', label: 'Email', value: doctor.email || '--' },
      { icon: 'phone', label: 'Phone', value: doctor.phone || '--' },
      { icon: 'qualification', label: 'Qualification', value: doctor.qualification || '--' },
      { icon: 'experience', label: 'Experience', value: (doctor.experience || 0) + ' Years' },
      { icon: 'blood', label: 'Blood Group', value: doctor.blood || '--' },
      { icon: 'language', label: 'Languages', value: doctor.languages || '--' }
    ];

    var infoHtml = '';
    for (var i = 0; i < infoItems.length; i++) {
      infoHtml +=
        '<div class="profile-info-item">' +
          '<span class="pi-icon">' + getInfoIcon(infoItems[i].icon) + '</span>' +
          '<div><label>' + infoItems[i].label + '</label><span>' + infoItems[i].value + '</span></div>' +
        '</div>';
    }
    document.getElementById('profileInfoGrid').innerHTML = infoHtml;

    document.getElementById('profileAbout').textContent = doctor.about || 'No about information available.';
  }

  function getInitials(name) {
    var parts = name.split(' ');
    if (parts.length >= 2) return parts[0][0] + parts[1][0];
    return parts[0][0] || 'D';
  }

  function getInfoIcon(type) {
    var icons = {
      mail: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
      phone: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
      qualification: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
      experience: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
      blood: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>',
      language: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'
    };
    return icons[type] || '';
  }

  // ── Edit Modal ──

  var editModal = document.getElementById('editProfileModal');
  var editModalClose = document.getElementById('editModalClose');
  var editCancelBtn = document.getElementById('editCancelBtn');
  var editSaveBtn = document.getElementById('editSaveBtn');

  function openEditModal() {
    ProfileValidation.applyUI([], document);
    document.getElementById('editName').value = doctor.name;
    document.getElementById('editEmail').value = doctor.email;
    document.getElementById('editPhone').value = doctor.phone;
    document.getElementById('editBlood').value = doctor.blood;
    document.getElementById('editQualification').value = doctor.qualification;
    document.getElementById('editExperience').value = doctor.experience;
    document.getElementById('editLanguages').value = doctor.languages;
    document.getElementById('editDepartment').value = doctor.department;
    document.getElementById('editAbout').value = doctor.about;
    editModal.style.display = 'flex';
  }

  editModalClose.addEventListener('click', function () { editModal.style.display = 'none'; });
  editCancelBtn.addEventListener('click', function () { editModal.style.display = 'none'; });
  editModal.addEventListener('click', function (e) { if (e.target === editModal) editModal.style.display = 'none'; });

  editSaveBtn.addEventListener('click', function () {
    if (_saving) return;
    var errors = validateDoctorProfile();
    var firstInvalid = ProfileValidation.applyUI(errors, document);
    if (errors.length > 0) {
      if (firstInvalid) firstInvalid.focus();
      return;
    }
    _saving = true;
    editSaveBtn.disabled = true;
    editSaveBtn.textContent = 'Saving...';

    doctor.name = document.getElementById('editName').value.trim();
    doctor.email = document.getElementById('editEmail').value.trim();
    doctor.phone = document.getElementById('editPhone').value.trim();
    doctor.blood = document.getElementById('editBlood').value;
    doctor.qualification = document.getElementById('editQualification').value.trim();
    doctor.experience = parseInt(document.getElementById('editExperience').value, 10) || 0;
    doctor.languages = document.getElementById('editLanguages').value.trim();
    doctor.department = document.getElementById('editDepartment').value.trim();
    doctor.about = document.getElementById('editAbout').value.trim();
    saveProfile(doctor);
    editModal.style.display = 'none';
    renderProfile();
    showToast('Profile updated successfully', 'success');

    _saving = false;
    editSaveBtn.disabled = false;
    editSaveBtn.textContent = 'Save Changes';
  });
  editSaveBtn._originalText = 'Save Changes';

  function validateDoctorProfile() {
    return ProfileValidation.validateFields([
      { field: 'editName',          validator: ProfileValidation.validateName,     value: function() { return document.getElementById('editName').value; },          label: 'Full Name' },
      { field: 'editEmail',         validator: ProfileValidation.validateEmail,    value: function() { return document.getElementById('editEmail').value; },         label: 'Email' },
      { field: 'editPhone',         validator: ProfileValidation.validatePhone,    value: function() { return document.getElementById('editPhone').value; },         label: 'Phone' },
      { field: 'editQualification', validator: ProfileValidation.validateQualification, value: function() { return document.getElementById('editQualification').value; }, label: 'Qualification' },
      { field: 'editExperience',    validator: ProfileValidation.validateExperience, value: function() { return document.getElementById('editExperience').value; },   label: 'Experience' },
      { field: 'editDepartment',    validator: ProfileValidation.validateDepartment, value: function() { return document.getElementById('editDepartment').value; },   label: 'Department' }
    ]);
  }

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

  renderProfile();

});
