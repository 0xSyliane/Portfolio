/* ========== PORTFOLIO INTERACTIVE SCRIPT ========== */
document.addEventListener('DOMContentLoaded', () => {

  // ===== NAVBAR =====
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('nav-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  navToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });

  document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });

  // ===== CURSOR GLOW =====
  const cursorGlow = document.getElementById('cursor-glow');
  let glowActive = false;
  document.addEventListener('mousemove', (e) => {
    if (!glowActive) { cursorGlow.classList.add('active'); glowActive = true; }
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top = e.clientY + 'px';
  });
  document.addEventListener('mouseleave', () => { cursorGlow.classList.remove('active'); glowActive = false; });

  // ===== PROJECT CARD GLOW TRACKING =====
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
      card.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
    });
  });

  // ===== SCROLL REVEAL =====
  const revealElements = document.querySelectorAll('.section-header, .about-text, .about-stats, .project-card, .skill-category, .contact-card');
  revealElements.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach(el => observer.observe(el));

  // ===== STAT COUNTER ANIMATION =====
  const statNumbers = document.querySelectorAll('.stat-number[data-count]');
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count);
        animateCounter(el, target);
        statObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  statNumbers.forEach(el => statObserver.observe(el));

  function animateCounter(el, target) {
    const duration = 1500;
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  // ===== INTERACTIVE TERMINAL =====
  const terminalInput = document.getElementById('terminal-input');
  const terminalOutput = document.getElementById('terminal-output');
  const terminalBody = document.getElementById('terminal-body');
  const terminalClearBtn = document.getElementById('terminal-clear-btn');

  const commands = {
    help: () => [
      { type: 'header', text: '📋 Available Commands:' },
      { type: 'line', text: '  help       — Show this help message' },
      { type: 'line', text: '  about      — Learn about me' },
      { type: 'line', text: '  skills     — View my tech stack' },
      { type: 'line', text: '  projects   — Browse my projects' },
      { type: 'line', text: '  education  — My academic background' },
      { type: 'line', text: '  contact    — How to reach me' },
      { type: 'line', text: '  clear      — Clear the terminal' },
    ],
    about: () => [
      { type: 'header', text: '👤 About Me' },
      { type: 'line', text: '  Name: Syliane Sofiane Saad Bouzid' },
      { type: 'line', text: '  Role: CS Engineering Student & Full-Stack Developer' },
      { type: 'line', text: '  Location: Algiers, Algeria 🇩🇿' },
      { type: 'line', text: '  University: USTHB (3rd year, starting soon)' },
      { type: 'line', text: '' },
      { type: 'line', text: '  Passionate about web dev, cybersecurity, Linux,' },
      { type: 'line', text: '  and pushing the boundaries of what\'s possible.' },
    ],
    skills: () => [
      { type: 'header', text: '🛠️  Tech Stack' },
      { type: 'success', text: '  ▸ Frontend:  JS · TS · HTML · CSS · Tailwind · Next.js' },
      { type: 'success', text: '  ▸ Backend:   Python · C · Java · Bash' },
      { type: 'success', text: '  ▸ Systems:   Linux · Git · Vercel' },
      { type: 'success', text: '  ▸ AI/Tools:  Ollama · OpenClaw · Notion' },
    ],
    projects: () => [
      { type: 'header', text: '🚀 Projects' },
      { type: 'line', text: '' },
      { type: 'line', text: '  [1] Blaze Type — Modern typing speed test app' },
      { type: 'link', text: '      → https://blaze-type.vercel.app/', url: 'https://blaze-type.vercel.app/' },
      { type: 'line', text: '' },
      { type: 'line', text: '  [2] Shellmates Club — Official cybersecurity club site' },
      { type: 'link', text: '      → https://www.shellmates.club/', url: 'https://www.shellmates.club/' },
      { type: 'line', text: '' },
      { type: 'line', text: '  [3] ██████████ — CLASSIFIED [Coming Soon]' },
    ],
    education: () => [
      { type: 'header', text: '🎓 Education' },
      { type: 'line', text: '  University: USTHB — Houari Boumediene University' },
      { type: 'line', text: '             of Science and Technology' },
      { type: 'line', text: '  Program:    Computer Science Engineering (Ingénieur)' },
      { type: 'line', text: '  Year:       Entering 3rd year (2026-2027)' },
      { type: 'line', text: '  Location:   Bab Ezzouar, Algiers, Algeria' },
    ],
    contact: () => [
      { type: 'header', text: '📬 Contact' },
      { type: 'line', text: '  Email:    sylianesaadbouzide@gmail.com' },
      { type: 'link', text: '  GitHub:   github.com/0xSyliane', url: 'https://github.com/0xSyliane' },
      { type: 'link', text: '  LinkedIn: linkedin.com/in/syliane-saadbouzid', url: 'https://www.linkedin.com/in/syliane-saadbouzid-a9278a395/' },
      { type: 'line', text: '' },
      { type: 'success', text: '  Feel free to reach out! I\'m always open to chat.' },
    ],

    whoami: () => [{ type: 'success', text: '  syliane' }],
    pwd: () => [{ type: 'line', text: '  /home/syliane/portfolio' }],
    ls: () => [{ type: 'line', text: '  about.md  projects/  skills.json  contact.txt' }],
    date: () => [{ type: 'line', text: '  ' + new Date().toString() }],
    echo: (args) => [{ type: 'line', text: '  ' + (args || '') }],
    neofetch: () => [
      { type: 'header', text: '  ┌──────────────────────────┐' },
      { type: 'success', text: '  │  syliane@portfolio       │' },
      { type: 'header', text: '  ├──────────────────────────┤' },
      { type: 'line', text: '  │  OS:     Linux (Arch btw) │' },
      { type: 'line', text: '  │  Shell:  bash 5.2          │' },
      { type: 'line', text: '  │  Editor: VSCode + Vim      │' },
      { type: 'line', text: '  │  Lang:   JS/TS/Python/C    │' },
      { type: 'line', text: '  │  Uptime: ∞                 │' },
      { type: 'header', text: '  └──────────────────────────┘' },
    ],
  };

  function processCommand(input) {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Echo the command
    const cmdLine = document.createElement('div');
    cmdLine.className = 'terminal-line cmd-line';
    cmdLine.innerHTML = `<span class="prompt-echo"><span class="prompt-user">syliane</span><span class="prompt-at">@</span><span class="prompt-host">portfolio</span><span class="prompt-colon">:</span><span class="prompt-path">~</span><span class="prompt-dollar">$</span> </span>${escapeHtml(trimmed)}`;
    terminalOutput.appendChild(cmdLine);

    const parts = trimmed.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    if (cmd === 'clear') {
      terminalOutput.innerHTML = '';
      scrollTerminal();
      return;
    }

    let results;
    if (cmd === 'echo') {
      results = commands.echo(args);
    } else if (commands[cmd]) {
      results = commands[cmd]();
    } else {
      results = [{ type: 'error', text: `  bash: ${escapeHtml(cmd)}: command not found. Type 'help' for available commands.` }];
    }

    results.forEach(r => {
      const line = document.createElement('div');
      line.className = 'terminal-line';
      switch (r.type) {
        case 'header': line.innerHTML = `<span class="result-header">${escapeHtml(r.text)}</span>`; break;
        case 'success': line.innerHTML = `<span class="result-success">${escapeHtml(r.text)}</span>`; break;
        case 'error': line.innerHTML = `<span class="result-error">${escapeHtml(r.text)}</span>`; break;
        case 'link':
          line.innerHTML = `<a href="${r.url}" target="_blank" rel="noopener noreferrer" class="result-link">${escapeHtml(r.text)}</a>`;
          break;
        default: line.innerHTML = `<span class="result-line">${escapeHtml(r.text)}</span>`;
      }
      terminalOutput.appendChild(line);
    });

    // Spacer
    const spacer = document.createElement('div');
    spacer.className = 'terminal-line terminal-spacer';
    terminalOutput.appendChild(spacer);

    scrollTerminal();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function scrollTerminal() {
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }

  // Command history
  let history = [];
  let historyIndex = -1;

  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = terminalInput.value;
      if (val.trim()) { history.unshift(val); historyIndex = -1; }
      processCommand(val);
      terminalInput.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        historyIndex++;
        terminalInput.value = history[historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        terminalInput.value = history[historyIndex];
      } else {
        historyIndex = -1;
        terminalInput.value = '';
      }
    }
  });

  // Click terminal body to focus input
  terminalBody.addEventListener('click', () => terminalInput.focus());

  // Clear button
  terminalClearBtn.addEventListener('click', () => {
    terminalOutput.innerHTML = '';
    terminalInput.focus();
  });

  // ===== SMOOTH SCROLL FOR NAV =====
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ===== ACTIVE NAV LINK HIGHLIGHT =====
  const sections = document.querySelectorAll('.section, .hero');
  const navLinks = document.querySelectorAll('.nav-link');
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { threshold: 0.3 });
  sections.forEach(s => navObserver.observe(s));

  // ===== LANGUAGE SWITCHER =====
  let currentLang = localStorage.getItem('portfolio-lang') || 'en';

  function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    localStorage.setItem('portfolio-lang', lang);

    // Update dir and lang attributes for RTL support
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    // Translate all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[lang][key] !== undefined) {
        el.innerHTML = translations[lang][key];
      }
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (translations[lang][key] !== undefined) {
        el.setAttribute('placeholder', translations[lang][key]);
      }
    });

    // Sync active state across all lang buttons (desktop + mobile)
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  // Attach click handlers to all language buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setLanguage(btn.dataset.lang);
    });
  });

  // Apply saved language on load
  setLanguage(currentLang);
});
