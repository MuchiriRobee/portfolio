/* ═══════════════════════════════════════════════════════════
   ALEX MORGAN PORTFOLIO — script.js
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── Utility: select elements ── */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ══════════════════════════════════
   1. SCROLL PROGRESS BAR
══════════════════════════════════ */
function initScrollProgress() {
  const bar = $('#scrollProgress');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const main = $('#mainContent');
    const scrollTop = main.scrollTop || window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = percent + '%';
  }, { passive: true });
}

/* ══════════════════════════════════
   2. THEME TOGGLE
══════════════════════════════════ */
function initTheme() {
  const btn  = $('#themeToggle');
  const icon = $('#themeIcon');
  const html = document.documentElement;

  // Restore saved preference
  const saved = localStorage.getItem('portfolio-theme') || 'dark';
  html.setAttribute('data-theme', saved);
  updateIcon(saved);

  btn.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('portfolio-theme', next);
    updateIcon(next);
  });

  function updateIcon(theme) {
    if (!icon) return;
    icon.className = theme === 'dark' ? 'ph-bold ph-sun' : 'ph-bold ph-moon';
  }
}

/* ══════════════════════════════════
   3. MOBILE NAVIGATION
══════════════════════════════════ */
function initMobileNav() {
  const hamburger = $('#hamburger');
  const sidebar   = $('#sidebar');
  const overlay   = $('#overlay');

  if (!hamburger || !sidebar) return;

  function openNav() {
    hamburger.classList.add('open');
    sidebar.classList.add('open');
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    hamburger.classList.remove('open');
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeNav() : openNav();
  });

  overlay.addEventListener('click', closeNav);

  // Close nav on link click (mobile)
  $$('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) closeNav();
    });
  });
}

/* ══════════════════════════════════
   4. SMOOTH SCROLL + ACTIVE NAV
══════════════════════════════════ */
function initSmoothScroll() {
  const navLinks = $$('.nav-link');
  const sections = $$('section[id]');

  // Click — scroll to section
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').replace('#', '');
      const target   = document.getElementById(targetId);
      if (target) {
        const topbarH = 88;
        const top = target.getBoundingClientRect().top + window.scrollY - topbarH;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // Intersection observer — highlight active nav link
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-section') === id);
          });
        }
      });
    },
    { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
  );

  sections.forEach(s => observer.observe(s));
}

/* ══════════════════════════════════
   5. SCROLL REVEAL ANIMATIONS
══════════════════════════════════ */
function initReveal() {
  const elements = $$('.reveal');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Animate skill bars when about section appears
          if (entry.target.closest('#about')) {
            animateSkillBars();
          }
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
  );

  elements.forEach(el => observer.observe(el));
}

/* ══════════════════════════════════
   6. SKILL BAR ANIMATION
══════════════════════════════════ */
function animateSkillBars() {
  $$('.bar-fill').forEach(fill => {
    const target = fill.getAttribute('data-width') || 0;
    // Small delay ensures transition is visible
    requestAnimationFrame(() => {
      fill.style.width = target + '%';
    });
  });
}

/* ══════════════════════════════════
   7. CONTACT FORM
══════════════════════════════════ */
function initContactForm() {
  const sendBtn    = $('#sendBtn');
  const formSuccess = $('#formSuccess');
  const nameInput  = $('#name');
  const emailInput = $('#email');
  const msgInput   = $('#message');

  if (!sendBtn) return;

  sendBtn.addEventListener('click', () => {
    // Basic validation
    const name  = nameInput?.value.trim();
    const email = emailInput?.value.trim();
    const msg   = msgInput?.value.trim();

    if (!name || !email || !msg) {
      shakeButton(sendBtn);
      return;
    }

    if (!isValidEmail(email)) {
      emailInput.style.borderColor = '#f43f5e';
      setTimeout(() => emailInput.style.borderColor = '', 2000);
      return;
    }

    // Simulate send
    sendBtn.innerHTML = '<i class="ph-bold ph-circle-notch" style="animation:spin 1s linear infinite"></i> Sending…';
    sendBtn.disabled = true;

    setTimeout(() => {
      // Reset form
      nameInput.value = '';
      emailInput.value = '';
      msgInput.value = '';
      sendBtn.innerHTML = '<i class="ph-bold ph-paper-plane-tilt"></i> Send Message';
      sendBtn.disabled = false;

      if (formSuccess) {
        formSuccess.style.display = 'flex';
        setTimeout(() => (formSuccess.style.display = 'none'), 5000);
      }
    }, 1500);
  });

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function shakeButton(btn) {
    btn.style.animation = 'shake 0.4s ease';
    setTimeout(() => (btn.style.animation = ''), 500);
  }
}

/* ══════════════════════════════════
   8. TYPING ANIMATION (home sub)
══════════════════════════════════ */
function initTypingEffect() {
  const el = document.querySelector('.intro-heading .accent');
  if (!el) return;

  const words = ['reliable', 'scalable', 'elegant', 'tested'];
  let wordIdx = 0, charIdx = 0, deleting = false;

  function type() {
    const current = words[wordIdx];

    if (deleting) {
      el.textContent = current.substring(0, charIdx--);
      if (charIdx < 0) {
        deleting = false;
        wordIdx = (wordIdx + 1) % words.length;
        setTimeout(type, 400);
        return;
      }
    } else {
      el.textContent = current.substring(0, charIdx++);
      if (charIdx > current.length) {
        deleting = true;
        setTimeout(type, 1800);
        return;
      }
    }

    setTimeout(type, deleting ? 60 : 100);
  }

  // Start after page loads
  setTimeout(type, 1200);
}

/* ══════════════════════════════════
   9. STAGGER CARD ANIMATIONS
══════════════════════════════════ */
function initStaggerAnimations() {
  // Tech cards get staggered delay
  $$('.tech-card').forEach((card, i) => {
    card.style.transitionDelay = (i * 30) + 'ms';
  });

  // Project cards
  $$('.project-card').forEach((card, i) => {
    card.style.animationDelay = (i * 80) + 'ms';
  });
}

/* ══════════════════════════════════
   10. SCROLL PROGRESS (per-section)
══════════════════════════════════ */
function initScrollListener() {
  const bar = $('#scrollProgress');

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress  = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (bar) bar.style.width = Math.min(progress, 100) + '%';
  }, { passive: true });
}

/* ══════════════════════════════════
   11. INJECT SPIN KEYFRAME (for loading)
══════════════════════════════════ */
function injectKeyframes() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%,100% { transform: translateX(0); }
      20%,60% { transform: translateX(-6px); }
      40%,80% { transform: translateX(6px); }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

/* ══════════════════════════════════
   12. ACTIVE SECTION ON LOAD
══════════════════════════════════ */
function setInitialActiveNav() {
  const homeLink = document.querySelector('.nav-link[data-section="home"]');
  if (homeLink) homeLink.classList.add('active');
}

/* ══════════════════════════════════
   INIT ALL
══════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  injectKeyframes();
  initTheme();
  initMobileNav();
  initSmoothScroll();
  initReveal();
  initScrollListener();
  initContactForm();
  initTypingEffect();
  initStaggerAnimations();
  setInitialActiveNav();

  // Trigger reveal for elements already in viewport on load
  setTimeout(() => {
    $$('.reveal').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.95) {
        el.classList.add('visible');
      }
    });
    // Animate skill bars if about section is visible initially
    const aboutSection = $('#about');
    if (aboutSection) {
      const rect = aboutSection.getBoundingClientRect();
      if (rect.top < window.innerHeight) animateSkillBars();
    }
  }, 100);
});