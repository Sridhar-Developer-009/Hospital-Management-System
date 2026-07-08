/* ================================================================
   CityCare — Main App Bootstrapper
   Handles: navbar, modal, scroll-reveal, count-up, stagger
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ─── 0. Instant hash-jump (no hero flash on back-navigation) ───── */
  if (window.location.hash) {
    const navType = (performance.getEntriesByType('navigation')[0] || {}).type;
    const isNavigation = navType !== 'reload' && navType !== 'back_forward';

    if (isNavigation) {
      const target = document.querySelector(window.location.hash);
      if (target) {
        // Jump instantly — no smooth scroll — so user lands directly at section
        target.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
      // Fade page in now that we're in position
      document.documentElement.style.transition = 'opacity 0.25s ease';
      document.documentElement.style.opacity = '1';
    }
  }

  /* ─── 1. Navbar envelope → flat on scroll ──────────────────── */
  const header = document.getElementById('navbar-header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('navbar-scrolled', window.scrollY > 80);
  }, { passive: true });

  /* ─── 2. Gateway modal ───────────────────────────────────────── */
  const loginModal   = document.getElementById('gateway-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');

  if (closeModalBtn && loginModal) {
    closeModalBtn.addEventListener('click', () => loginModal.classList.remove('show'));
  }
  // Close on backdrop click
  if (loginModal) {
    loginModal.addEventListener('click', e => {
      if (e.target === loginModal) loginModal.classList.remove('show');
    });
  }


  /* ─── 3. Smooth scroll ───────────────────────────────────────── */
  document.querySelectorAll('.nav-menu-link').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });


  /* ─── 4. Hero Story Slider ─────────────────────────────────────── */
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-slider-dot');
  const slider = document.querySelector('.hero-slider');
  let currentIndex = 0;
  let slideInterval;

  const goToSlide = (index) => {
    slides.forEach((s, i) => s.classList.toggle('active', i === index));
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
    currentIndex = index;
  };

  const nextSlide = () => goToSlide((currentIndex + 1) % slides.length);

  const startSlideInterval = () => {
    stopSlideInterval();
    slideInterval = setInterval(nextSlide, 6000);
  };
  const stopSlideInterval = () => clearInterval(slideInterval);

  // Pause on hover
  if (slider) {
    slider.addEventListener('mouseenter', stopSlideInterval);
    slider.addEventListener('mouseleave', startSlideInterval);
  }

  // Dot clicks
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      goToSlide(parseInt(dot.dataset.index));
      startSlideInterval(); // reset timer on manual click
    });
  });

  // Start the slideshow
  startSlideInterval();


  /* ─── 5. Scroll-Reveal (Intersection Observer) ───────────────── */
  // Attach reveal classes to key sections
  const revealTargets = [
    // [selector, direction, delay-class]
    ['.gateway-selection-panel .section-title', '', ''],
    ['.gateway-selection-panel .section-subtitle', '', 'delay-1'],
    ['.gateway-card',         '',           ''],      // staggered below
    ['.stat-counter-block',   '',           ''],      // staggered below
    ['.modules-showcase-panel .section-title', '', ''],
    ['.module-card',          '',           ''],      // staggered below
    ['.showcase-info',        'from-left',  ''],
    ['.laptop-frame-wrapper', 'from-right', 'delay-2'],
    ['.stat-counter-block .stat-number', '', ''],
    ['.cert-item-block',      '',           ''],      // staggered below
    ['.cta-info',             'from-left',  ''],
    ['.cta-grid > div:last-child', 'from-right', 'delay-2'],
    ['.pricing-section-panel .section-title', '', ''],
    ['.pricing-card',         '',           ''],
    ['.about-section-panel .section-title', '', ''],
    ['.about-info p',         '',           'delay-1'],
    ['.about-stat-item',      '',           ''],
    ['.about-value-card',     '',           ''],
  ];

  // Apply classes
  revealTargets.forEach(([sel, dir, delay]) => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('reveal');
      if (dir) el.classList.add(dir);
      if (delay) el.classList.add(delay);
    });
  });

   // Stagger cards
   const staggerGroups = [
      '.gateway-card',
      '.stat-counter-block',
      '.module-card',
      '#facilities .reveal',
      '#about-values .reveal',
      '.cert-item-block',
      '.pricing-card',
      '.about-stat-item',
      '.about-value-card',
    ];
   staggerGroups.forEach(sel => {
     document.querySelectorAll(sel).forEach((el, i) => {
       el.style.transitionDelay = `${i * 0.2}s`;
     });
   });

   // Apply reveal class to stat numbers (they're children of stat-counter-block)
   document.querySelectorAll('.stat-number').forEach(el => {
     el.classList.add('reveal');
   });

  // Apply animated underline class to section titles
  document.querySelectorAll('.section-title').forEach(el => {
    el.classList.add('section-title-animated');
  });

  // Intersection observer — to-and-fro on every scroll
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      entry.target.classList.toggle('visible', entry.isIntersecting);
    });
  }, { threshold: 0, rootMargin: '-30px 0px -30px 0px' });

  document.querySelectorAll('.reveal, .section-title-animated').forEach(el => {
    revealObserver.observe(el);
  });


  /* ─── 6. Count-Up Animation for Stats ───────────────────────── */
  const statNumbers = document.querySelectorAll('.stat-number');

  const parseStatValue = (text) => {
    const clean = text.replace(/,/g, '').replace(/\+/g, '').replace(/%/g, '');
    return parseFloat(clean);
  };

  const formatStat = (original, current) => {
    const hasPlus  = original.includes('+');
    const hasPercent = original.includes('%');
    const hasComma = original.includes(',');
    let str = hasComma
      ? Math.floor(current).toLocaleString()
      : Math.floor(current).toString();
    if (hasPercent) str = current.toFixed(1) + '%';
    if (hasPlus && !hasPercent) str += '+';
    return str;
  };

  const countUp = (el, target, originalText, duration = 3200) => {
    const start = performance.now();
    el.classList.add('counting');
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatStat(originalText, target * eased);
      if (progress < 1) requestAnimationFrame(tick);
      else {
        el.textContent = originalText;
        el.classList.remove('counting');
      }
    };
    requestAnimationFrame(tick);
  };

   const statsObserver = new IntersectionObserver((entries) => {
     entries.forEach(entry => {
       const el = entry.target;
       if (el.classList.contains('stat-number')) {
         if (entry.isIntersecting && !el.classList.contains('counting')) {
           const originalText = el.dataset.target || el.textContent;
           el.dataset.target = originalText;
           const target = parseStatValue(originalText);
           countUp(el, target, originalText);
         }
       }
     });
   }, { threshold: 0, rootMargin: '-20px 0px -20px 0px' });

   statNumbers.forEach(el => statsObserver.observe(el));


  /* ─── 7. Smooth parallax engine (rAF-throttled) ────────────── */
  let parallaxTicking = false;
  window.addEventListener('scroll', () => {
    if (!parallaxTicking) {
      parallaxTicking = true;
      requestAnimationFrame(() => {
        const sy = window.scrollY;
        // Hero video — slow scroll (parallax depth)
        const video = document.querySelector('.hero-video-bg');
        if (video) video.style.transform = `translateY(${sy * 0.08}px)`;
        // Overlay — slightly different speed for depth
        const overlay = document.querySelector('.hero-video-overlay');
        if (overlay) overlay.style.transform = `translateY(${sy * 0.12}px)`;
        // Particles — fastest layer (closest)
        const particles = document.querySelector('.hero-particles');
        if (particles) particles.style.transform = `translateY(${sy * 0.2}px)`;
        // Section fade — dynamic opacity as hero scrolls out
        const fadeEl = document.querySelector('.section-fade');
        if (fadeEl) {
          const fadeRect = fadeEl.getBoundingClientRect();
          const fadeProgress = Math.max(0, Math.min(1, 1 - fadeRect.top / fadeRect.height));
          fadeEl.style.opacity = fadeProgress;
        }
        parallaxTicking = false;
      });
    }
  }, { passive: true });


  /* ─── 8. Scroll-to-Top Button ───────────────────────────────── */
  const scrollBtn = document.getElementById('scrollTopBtn');
  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      scrollBtn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

});
