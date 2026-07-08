/* shared/utils/profile-validation.js
   Validation rules mirroring HospitalManagementSystem.Console validation:
   - InputHelper.ReadName, ReadPhone, ReadEmail, ReadGender, ReadDate, etc.
   - ValidationRules.ForName(), ForPhone(), ForEmail(), etc.
   - ApplicationConstants.PASSWORD_MIN_LENGTH = 8
*/

(function () {

  var ProfileValidation = {};

  function addError(errors, field, message) {
    errors.push({ field: field, message: message });
  }

  function isBlank(v) {
    return typeof v !== 'string' || v.trim() === '';
  }

  // ── Full Name: Letters, spaces, dots | 2-100 characters ──
  ProfileValidation.NAME_REGEX = /^[A-Za-z. ]{2,100}$/;
  ProfileValidation.NAME_HELP = 'Letters, spaces, dots | 2-100 characters';

  ProfileValidation.validateName = function (value, fieldLabel) {
    fieldLabel = fieldLabel || 'Full Name';
    if (isBlank(value)) return fieldLabel + ' is required.';
    if (!ProfileValidation.NAME_REGEX.test(value.trim()))
      return fieldLabel + ' must contain only letters, spaces, and dots (2-100 characters).';
    return '';
  };

  // ── Phone: 10 digits | Starts with 6-9 ──
  ProfileValidation.PHONE_REGEX = /^[6-9]\d{9}$/;
  ProfileValidation.PHONE_HELP = '10 digits | Starts with 6-9';

  ProfileValidation.validatePhone = function (value, fieldLabel) {
    fieldLabel = fieldLabel || 'Phone Number';
    if (isBlank(value)) return fieldLabel + ' is required.';
    if (!ProfileValidation.PHONE_REGEX.test(value.trim()))
      return fieldLabel + ' must be exactly 10 digits and start with 6, 7, 8, or 9.';
    return '';
  };

  // ── Email: user@example.com ──
  ProfileValidation.EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  ProfileValidation.EMAIL_HELP = 'Email address | Required';

  ProfileValidation.validateEmail = function (value, fieldLabel) {
    fieldLabel = fieldLabel || 'Email';
    if (isBlank(value)) return fieldLabel + ' is required.';
    if (!ProfileValidation.EMAIL_REGEX.test(value.trim()))
      return fieldLabel + ' must be a valid email address (e.g., user@example.com).';
    return '';
  };

  // ── Gender: Male, Female, or Other ──
  ProfileValidation.VALID_GENDERS = ['Male', 'Female', 'Other'];
  ProfileValidation.GENDER_HELP = 'Male, Female, or Other';

  ProfileValidation.validateGender = function (value, fieldLabel) {
    fieldLabel = fieldLabel || 'Gender';
    if (isBlank(value)) return fieldLabel + ' is required.';
    var normalised = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    if (ProfileValidation.VALID_GENDERS.indexOf(normalised) === -1)
      return fieldLabel + ' must be Male, Female, or Other.';
    return '';
  };

  // ── Date of Birth: valid date, not in future ──
  ProfileValidation.DATE_HELP = 'DD-MM-YYYY or YYYY-MM-DD';

  ProfileValidation.validateDate = function (value, fieldLabel) {
    fieldLabel = fieldLabel || 'Date of Birth';
    if (isBlank(value)) return fieldLabel + ' is required.';
    var d = parseDateStrict(value);
    if (!d) return fieldLabel + ' must be a valid date (DD-MM-YYYY or YYYY-MM-DD).';
    if (d > new Date()) return fieldLabel + ' cannot be in the future.';
    return '';
  };

  function parseDateStrict(value) {
    var m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      var d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
      if (d.getFullYear() === parseInt(m[1], 10) && d.getMonth() === parseInt(m[2], 10) - 1) return d;
    }
    m = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (m) {
      d = new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
      if (d.getFullYear() === parseInt(m[3], 10) && d.getMonth() === parseInt(m[2], 10) - 1) return d;
    }
    m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) {
      d = new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
      if (d.getFullYear() === parseInt(m[3], 10) && d.getMonth() === parseInt(m[2], 10) - 1) return d;
    }
    return null;
  }

  // ── Address: Optional ──
  ProfileValidation.validateAddress = function () { return ''; };

  // ── Blood Group: Optional, validated if provided ──
  ProfileValidation.BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  ProfileValidation.validateBloodGroup = function (value) {
    if (isBlank(value)) return '';
    if (ProfileValidation.BLOOD_GROUPS.indexOf(value.trim()) === -1)
      return 'Blood Group must be a valid type (e.g., A+, O-).';
    return '';
  };

  // ── Emergency Contact: Optional, validated as phone if provided ──
  ProfileValidation.validateEmergencyContact = function (value, fieldLabel) {
    fieldLabel = fieldLabel || 'Emergency Contact';
    if (isBlank(value)) return '';
    var cleaned = value.trim().replace(/[\s-]/g, '');
    if (cleaned.length > 0 && !ProfileValidation.PHONE_REGEX.test(cleaned))
      return fieldLabel + ' must be a valid 10-digit number starting with 6-9.';
    return '';
  };

  // ── Username: Letters, numbers, underscore | 4-50 characters ──
  ProfileValidation.USERNAME_REGEX = /^[A-Za-z0-9_]{4,50}$/;
  ProfileValidation.USERNAME_HELP = 'Letters, numbers, underscore | 4-50 characters';
  ProfileValidation.validateUsername = function (value, fieldLabel) {
    fieldLabel = fieldLabel || 'Username';
    if (isBlank(value)) return fieldLabel + ' is required.';
    if (!ProfileValidation.USERNAME_REGEX.test(value.trim()))
      return fieldLabel + ' must be 4-50 characters and may contain letters, numbers, and underscore only.';
    return '';
  };

  // ── Password: Min 8 | Uppercase | Lowercase | Digit | Special ──
  ProfileValidation.PASSWORD_MIN_LENGTH = 8;
  ProfileValidation.PASSWORD_HELP = 'Min 8 characters | Uppercase | Lowercase | Digit | Special character';
  ProfileValidation.validatePassword = function (value, fieldLabel) {
    fieldLabel = fieldLabel || 'Password';
    if (isBlank(value)) return fieldLabel + ' is required.';
    var v = value;
    if (v.length < ProfileValidation.PASSWORD_MIN_LENGTH)
      return fieldLabel + ' must be at least ' + ProfileValidation.PASSWORD_MIN_LENGTH + ' characters.';
    if (!/[A-Z]/.test(v)) return fieldLabel + ' must contain at least one uppercase letter.';
    if (!/[a-z]/.test(v)) return fieldLabel + ' must contain at least one lowercase letter.';
    if (!/\d/.test(v)) return fieldLabel + ' must contain at least one digit.';
    if (!/[^A-Za-z0-9]/.test(v)) return fieldLabel + ' must contain at least one special character.';
    return '';
  };

  // ── Qualification: Required ──
  ProfileValidation.validateQualification = function (value, fieldLabel) {
    fieldLabel = fieldLabel || 'Qualification';
    if (isBlank(value)) return fieldLabel + ' is required.';
    return '';
  };

  // ── Experience: 0-70 years ──
  ProfileValidation.EXPERIENCE_MIN = 0;
  ProfileValidation.EXPERIENCE_MAX = 70;
  ProfileValidation.EXPERIENCE_HELP = 'Digits only | 0 to 70 years';
  ProfileValidation.validateExperience = function (value, fieldLabel) {
    fieldLabel = fieldLabel || 'Experience';
    if (isBlank(value)) return fieldLabel + ' is required.';
    var num = parseInt(value, 10);
    if (isNaN(num) || String(num) !== String(value).trim())
      return fieldLabel + ' must be a number (0-70 years).';
    if (num < ProfileValidation.EXPERIENCE_MIN || num > ProfileValidation.EXPERIENCE_MAX)
      return fieldLabel + ' must be between ' + ProfileValidation.EXPERIENCE_MIN + ' and ' + ProfileValidation.EXPERIENCE_MAX + ' years.';
    return '';
  };

  // ── Department: Required ──
  ProfileValidation.validateDepartment = function (value, fieldLabel) {
    fieldLabel = fieldLabel || 'Department';
    if (isBlank(value)) return fieldLabel + ' is required.';
    return '';
  };

  // ── Bulk validation ──
  ProfileValidation.validateFields = function (rules) {
    var errors = [];
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      var val = typeof r.value === 'function' ? r.value() : (r.value || '');
      var msg = r.validator(val, r.label);
      if (msg) { errors.push({ field: r.field, message: msg }); }
    }
    return errors;
  };

  // ── Apply validation UI ──
  ProfileValidation.applyUI = function (errors, containerEl) {
    containerEl = containerEl || document;
    var prevHighlights = containerEl.querySelectorAll('.profile-validation-error');
    for (var i = 0; i < prevHighlights.length; i++) {
      var el = prevHighlights[i];
      el.classList.remove('profile-validation-error');
      var msg = el.parentNode.querySelector('.validation-message');
      if (msg) msg.remove();
    }
    if (!errors || errors.length === 0) return null;
    var firstField = null;
    for (var j = 0; j < errors.length; j++) {
      var err = errors[j];
      var fieldEl = containerEl.getElementById(err.field);
      if (!fieldEl) continue;
      fieldEl.classList.add('profile-validation-error');
      var msgEl = document.createElement('div');
      msgEl.className = 'validation-message text-danger';
      msgEl.style.fontSize = '0.8rem';
      msgEl.style.marginTop = '3px';
      msgEl.textContent = err.message;
      fieldEl.parentNode.insertBefore(msgEl, fieldEl.nextSibling);
      if (!firstField) firstField = fieldEl;
    }
    return firstField;
  };

  ProfileValidation.setFieldState = function (inputEl, errorEl, isValid) {
    if (!inputEl) return;
    if (isValid) {
      inputEl.classList.remove('is-invalid', 'error');
      inputEl.classList.add('is-valid');
      if (errorEl) errorEl.classList.add('d-none');
    } else {
      inputEl.classList.remove('is-valid');
      inputEl.classList.add('is-invalid');
      if (errorEl) errorEl.classList.remove('d-none');
    }
  };

  ProfileValidation.clearFieldState = function (inputEl, errorEl) {
    if (!inputEl) return;
    inputEl.classList.remove('is-invalid', 'is-valid', 'error');
    if (errorEl) errorEl.classList.add('d-none');
  };

  ProfileValidation.liveValidate = function (fields) {
    fields.forEach(function (f) {
      var inputEl = typeof f.input === 'string' ? document.getElementById(f.input) : f.input;
      var errorEl = typeof f.error === 'string' ? document.getElementById(f.error) : f.error;
      if (!inputEl) return;
      var handler = function () {
        var val = inputEl.value;
        if (val === '' && !f.required) {
          ProfileValidation.clearFieldState(inputEl, errorEl);
          return;
        }
        var msg = f.validator(val, f.label);
        ProfileValidation.setFieldState(inputEl, errorEl, !msg);
        if (msg && errorEl) errorEl.textContent = msg;
      };
      inputEl.addEventListener('input', handler);
      inputEl.addEventListener('change', handler);
    });
  };

  window.ProfileValidation = ProfileValidation;
})();
