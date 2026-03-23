// =========================================
//  DHEERAJ CHOUDHARY PORTFOLIO — script.js
// =========================================

// ---- Custom Cursor ----
const cursor = document.getElementById('cursor');
const follower = document.getElementById('cursorFollower');

let mouseX = 0, mouseY = 0;
let followerX = 0, followerY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursor.style.left = mouseX + 'px';
  cursor.style.top  = mouseY + 'px';
});

function animateFollower() {
  followerX += (mouseX - followerX) * 0.12;
  followerY += (mouseY - followerY) * 0.12;
  follower.style.left = followerX + 'px';
  follower.style.top  = followerY + 'px';
  requestAnimationFrame(animateFollower);
}
animateFollower();

// Scale cursor on hover
document.querySelectorAll('a, button, .expertise-card, .about-card, .contact-card').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.transform = 'translate(-50%, -50%) scale(2)';
    follower.style.transform = 'translate(-50%, -50%) scale(1.5)';
    follower.style.borderColor = 'rgba(255,153,0,0.8)';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.transform = 'translate(-50%, -50%) scale(1)';
    follower.style.transform = 'translate(-50%, -50%) scale(1)';
    follower.style.borderColor = 'rgba(255,153,0,0.5)';
  });
});

// ---- Navbar Scroll Effect ----
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

// ---- Hamburger / Mobile Menu ----
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
let menuOpen = false;

hamburger.addEventListener('click', () => {
  menuOpen = !menuOpen;
  mobileMenu.classList.toggle('open', menuOpen);
  // Animate bars
  const bars = hamburger.querySelectorAll('span');
  if (menuOpen) {
    bars[0].style.transform = 'translateY(7px) rotate(45deg)';
    bars[1].style.opacity = '0';
    bars[2].style.transform = 'translateY(-7px) rotate(-45deg)';
  } else {
    bars[0].style.transform = '';
    bars[1].style.opacity = '';
    bars[2].style.transform = '';
  }
});

// Close mobile menu on link click
document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    menuOpen = false;
    mobileMenu.classList.remove('open');
    const bars = hamburger.querySelectorAll('span');
    bars[0].style.transform = '';
    bars[1].style.opacity = '';
    bars[2].style.transform = '';
  });
});

// ---- Animated Counter ----
function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-target'));
  const duration = 1800;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target);
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target;
  }
  requestAnimationFrame(update);
}

// ---- Intersection Observer for Reveal + Counters ----
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Counters observer
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.stat-num').forEach(num => animateCounter(num));
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) counterObserver.observe(heroStats);

// ---- Expertise Card Stagger ----
const expertiseCards = document.querySelectorAll('.expertise-card');
const cardObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const index = parseInt(entry.target.getAttribute('data-index')) || 0;
      setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }, index * 80);
      cardObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

expertiseCards.forEach(card => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(24px)';
  card.style.transition = 'opacity 0.5s ease, transform 0.5s ease, border-color 0.3s, box-shadow 0.3s';
  cardObserver.observe(card);
});

// ---- Active Nav Link on Scroll ----
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    const top = section.offsetTop - 100;
    if (window.scrollY >= top) current = section.getAttribute('id');
  });
  navLinks.forEach(link => {
    link.style.color = '';
    if (link.getAttribute('href') === `#${current}`) {
      link.style.color = 'var(--accent)';
    }
  });
});

// ---- Smooth Scroll for all anchor links ----
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ---- About cards reveal ----
document.querySelectorAll('.about-card').forEach((card, i) => {
  card.style.opacity = '0';
  card.style.transform = 'translateX(20px)';
  card.style.transition = `opacity 0.5s ${i * 0.1}s ease, transform 0.5s ${i * 0.1}s ease, border-color 0.3s ease`;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        card.style.opacity = '1';
        card.style.transform = 'translateX(0)';
        obs.unobserve(card);
      }
    });
  }, { threshold: 0.2 });
  obs.observe(card);
});

// ---- Role items reveal ----
document.querySelectorAll('.role-item').forEach((item, i) => {
  item.style.opacity = '0';
  item.style.transform = 'translateY(16px)';
  item.style.transition = `opacity 0.5s ${i * 0.08}s ease, transform 0.5s ${i * 0.08}s ease`;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
        obs.unobserve(item);
      }
    });
  }, { threshold: 0.1 });
  obs.observe(item);
});

// ---- Content cards reveal ----
document.querySelectorAll('.content-card').forEach((card, i) => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(24px)';
  card.style.transition = `opacity 0.5s ${i * 0.12}s ease, transform 0.5s ${i * 0.12}s ease`;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
        obs.unobserve(card);
      }
    });
  }, { threshold: 0.15 });
  obs.observe(card);
});

// ---- Console Easter Egg ----
console.log('%c Dheeraj Choudhary ', 'background: #FF9900; color: #000; font-size: 1.2rem; font-weight: bold; padding: 8px 16px; border-radius: 4px;');
console.log('%c AWS Hero | DevOps Expert | Community Leader ', 'color: #FF9900; font-size: 0.9rem;');
console.log('%c Deployed on AWS EKS 🚀 ', 'color: #7a7a9a; font-size: 0.8rem;');