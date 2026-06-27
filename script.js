function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
function safe(label, fn) {
  try { fn(); } catch (err) { console.error(`"${label}":`, err); }
}
async function getSavedOverrides() {
  try { return (await fetchSiteContentRow()) || {}; } catch { return {}; }
}

async function render() {
  const overrides = await getSavedOverrides();
  const c = Object.assign({}, SITE_CONTENT, overrides);
  document.title = c.name;

  safe('nav', () => {
    document.getElementById('nav-name').textContent = c.name.split(' ').map(w => w[0]).join('');
    const rl = document.getElementById('resume-link');
    const mrl = document.getElementById('mobile-resume-link');
    if (c.resume) { rl.href = c.resume; if (mrl) mrl.href = c.resume; }
    else { rl.style.display = 'none'; if (mrl) mrl.style.display = 'none'; }
  });

  safe('hero', () => {
    document.getElementById('hero-name').textContent = c.name;
    document.getElementById('hero-role').textContent = c.tagline;
    document.getElementById('hero-sub').textContent = c.heroSub || c.about;
    const linkedinUrl = (c.social && c.social.linkedin) || c.linkedin;
    const hl = document.getElementById('hero-linkedin-link');
    if (linkedinUrl) { hl.href = linkedinUrl; } else { hl.style.display = 'none'; }
  });

  safe('photo', () => renderPhotoCarousel(c));

  safe('stats', () => {
    const row = document.getElementById('stat-row');
    row.innerHTML = '';
    const stats = (c.stats && c.stats.length) ? c.stats : [
      { num: (c.certifications || []).length, label: 'Certifications' },
      { num: (c.languages || []).length || 1, label: 'Languages' }
    ];
    stats.forEach(s => {
      row.appendChild(el(`<div class="stat-item"><span class="stat-num">${s.num}</span><span class="stat-label">${s.label}</span></div>`));
    });
  });

  safe('about', () => {
    document.getElementById('about-text').textContent = c.about;
    const linkedinUrl = (c.social && c.social.linkedin) || c.linkedin;
    const ll = document.getElementById('about-linkedin-link');
    if (linkedinUrl) { ll.href = linkedinUrl; } else { ll.style.display = 'none'; }
  });

  safe('info chips', () => {
    const wrap = document.getElementById('info-list');
    wrap.innerHTML = '';
    const edu0 = (c.education && c.education[0]) || {};
    [
      { label: 'Location', value: c.location },
      { label: 'Currently', value: edu0.degree || '' },
      { label: 'At', value: edu0.school || '' },
      { label: 'Undergrad', value: (c.education && c.education[1] && c.education[1].school) || '' }
    ].forEach(i => {
      if (!i.value) return;
      wrap.appendChild(el(`<span class="info-chip"><strong>${i.label}</strong>${i.value}</span>`));
    });
  });

  safe('education', () => {
    const list = document.getElementById('zigzag-rail');
    list.innerHTML = '';
    (c.education || []).forEach(e => {
      list.appendChild(el(`
        <li class="exp-item reveal">
          <div class="exp-left">
            <div class="exp-year">${e.years || ''}</div>
            ${e.logo ? `<img class="exp-logo" src="${e.logo}" alt="${e.school || ''}" loading="lazy">` : ''}
          </div>
          <div class="exp-content">
            <div class="exp-title">${e.degree || ''}</div>
            <div class="exp-org">${e.school || ''}</div>
            ${e.details ? `<div class="exp-detail">${e.details}</div>` : ''}
          </div>
        </li>
      `));
    });
    attachReveal();
  });

  safe('certs', () => {
    const grid = document.getElementById('cert-grid');
    grid.innerHTML = '';
    (c.certifications || []).forEach(cert => {
      grid.appendChild(el(`
        <div class="cert-card">
          <div class="cert-name">${cert.name}</div>
          <div class="cert-meta">${cert.issuer}${cert.date ? ' · ' + cert.date : ''}</div>
          ${cert.file ? `<a class="cert-link" href="${cert.file}" target="_blank" rel="noopener">View document →</a>` : ''}
        </div>
      `));
    });
  });

  safe('projects and experience', () => {
    const grid = document.getElementById('work-combined-grid');
    grid.innerHTML = '';
    // Projects first, then experience_items — all rendered as project cards
    const allItems = [
      ...(c.projects || []),
      ...(c.experience_items || []).map(x => ({ ...x, _isExp: true }))
    ];
    if (allItems.length) {
      const pg = el('<div class="project-grid"></div>');
      allItems.forEach(p => {
        pg.appendChild(el(`
          <div class="project-card">
            ${p.logo ? `<img src="${p.logo}" style="height:32px;width:auto;object-fit:contain;margin-bottom:8px;" loading="lazy">` : ''}
            <div class="project-name">${p.name}</div>
            ${p.tag ? `<div class="project-tag">${p.tag}</div>` : ''}
            <p class="project-summary">${p.summary || ''}</p>
            ${p.details ? `<p class="project-details">${p.details}</p>` : ''}
            ${p.link || p.file ? `<div class="project-links">
              ${p.link ? `<a class="project-link" href="${p.link}" target="_blank" rel="noopener">View project →</a>` : ''}
              ${p.file ? `<a class="project-link" href="${p.file}" target="_blank" rel="noopener">Download file →</a>` : ''}
            </div>` : ''}
          </div>
        `));
      });
      grid.appendChild(pg);
    } else {
      grid.innerHTML = '<p style="color:var(--ink-3);font-size:14px;">No projects or experience added yet.</p>';
    }
  });

  safe('awards', () => {
    const awards = c.awards || [];
    const row = document.getElementById('awards-row');
    if (!row) return;
    if (!awards.length) { row.style.display = 'none'; return; }
    row.style.display = '';
    const grid = document.getElementById('awards-grid');
    grid.innerHTML = '';
    awards.forEach(a => {
      grid.appendChild(el(`
        <div class="cert-card">
          <div class="cert-name">${a.name}</div>
          <div class="cert-meta">${a.issuer || ''}${a.date ? ' · ' + a.date : ''}</div>
          ${a.file ? `<a class="cert-link" href="${a.file}" target="_blank" rel="noopener">View award →</a>` : ''}
        </div>
      `));
    });
  });

  safe('skills', () => {
    ['skills-list', 'languages-list'].forEach(id => document.getElementById(id).innerHTML = '');
    (c.skills || []).forEach(s => document.getElementById('skills-list').appendChild(el(`<span class="tag">${s}</span>`)));
    (c.languages || []).forEach(l => document.getElementById('languages-list').appendChild(el(`<span class="tag">${l.name}${l.level ? ' — ' + l.level : ''}</span>`)));
  });

  safe('contact', () => {
    document.getElementById('contact-email').innerHTML = c.email ? `<a href="mailto:${c.email}">${c.email}</a>` : '';
    document.getElementById('contact-phone').textContent = c.phone || '';
    document.getElementById('contact-location').textContent = c.location || '';
    const lu = (c.social && c.social.linkedin) || c.linkedin;
    document.getElementById('contact-linkedin').innerHTML = lu ? `<a href="${lu}" target="_blank" rel="noopener">LinkedIn ↗</a>` : '';
  });

  safe('social', () => {
    const wrap = document.getElementById('social-links');
    wrap.innerHTML = '';
    const social = c.social || {};
    const icons = {
      linkedin: '<svg viewBox="0 0 24 24"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.59 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>',
      instagram: '<svg viewBox="0 0 24 24"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07zm0 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.41-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0z"/></svg>',
      facebook: '<svg viewBox="0 0 24 24"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z"/></svg>',
      x: '<svg viewBox="0 0 24 24"><path d="M18.9 2H22l-7.6 8.7L23.3 22H16.7l-5.2-6.8L5.5 22H2.4l8.1-9.3L1.5 2h6.8l4.7 6.2L18.9 2zm-1.2 18h1.7L7.4 4H5.6l12.1 16z"/></svg>'
    };
    Object.entries(icons).forEach(([key, svg]) => {
      const url = social[key];
      if (url) wrap.appendChild(el(`<a href="${url}" target="_blank" rel="noopener" aria-label="${key}">${svg}</a>`));
    });
  });

  safe('footer', () => {
    document.getElementById('footer-copy').textContent = `© ${new Date().getFullYear()} ${c.name}`;
  });

  attachReveal();
}

function renderPhotoCarousel(c) {
  const photos = (c.photos && c.photos.length) ? c.photos : (c.photo ? [c.photo] : []);
  const frame = document.getElementById('photo-frame');
  const prev = document.getElementById('photo-prev');
  const next = document.getElementById('photo-next');
  const dots = document.getElementById('photo-dots');
  if (!frame) return;
  if (!photos.length) { frame.innerHTML = '<span class="photo-placeholder">Add a photo via admin</span>'; if (prev) prev.hidden = true; if (next) next.hidden = true; return; }
  let idx = 0;
  function show(i) {
    idx = (i + photos.length) % photos.length;
    frame.innerHTML = '';
    const img = new Image();
    img.onerror = () => { frame.innerHTML = `<span class="photo-placeholder">Add photo: ${photos[idx]}</span>`; };
    img.src = photos[idx];
    frame.appendChild(img);
    if (dots) {
      dots.innerHTML = '';
      if (photos.length > 1) photos.forEach((_, j) => {
        const d = el(`<button class="photo-dot${j===idx?' active':''}" type="button" aria-label="Photo ${j+1}"></button>`);
        d.onclick = () => show(j);
        dots.appendChild(d);
      });
    }
  }
  const multi = photos.length > 1;
  if (prev) { prev.hidden = !multi; if (multi) prev.onclick = () => show(idx - 1); }
  if (next) { next.hidden = !multi; if (multi) next.onclick = () => show(idx + 1); }
  show(0);
}

function attachReveal() {
  const obs = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }), { threshold: 0.08, rootMargin: '0px 0px -28px 0px' });
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => obs.observe(el));
}

document.addEventListener('DOMContentLoaded', render);

// Nav — scroll behaviour + burger
(function () {
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
  const btn = document.getElementById('nav-burger');
  const mob = document.getElementById('nav-mobile');
  if (btn && mob) {
    btn.addEventListener('click', () => mob.classList.toggle('open'));
    mob.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mob.classList.remove('open')));
  }
})();

// Cursor trail — smooth canvas ribbon
(function () {
  if (window.matchMedia('(hover: none)').matches) return;
  const canvas = document.getElementById('trail-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const LIFETIME = 200;
  const HUES = ['184,92,120', '168,72,100', '196,106,140', '212,121,154'];
  let points = [], last = null, dpr = window.devicePixelRatio || 1;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  document.addEventListener('mousemove', e => {
    const now = performance.now();
    const pt = { x: e.clientX, y: e.clientY, time: now };
    if (last) {
      const dx = pt.x - last.x, dy = pt.y - last.y;
      const dist = Math.hypot(dx, dy);
      const steps = Math.min(16, Math.floor(dist / 5));
      for (let s = 1; s < steps; s++) points.push({ x: last.x + dx * (s/steps), y: last.y + dy * (s/steps), time: now });
    }
    points.push(pt);
    last = pt;
  });

  function draw() {
    const now = performance.now();
    points = points.filter(p => now - p.time < LIFETIME);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (points.length > 2) {
      for (let i = 1; i < points.length - 1; i++) {
        const p0 = points[i-1], p1 = points[i], p2 = points[i+1];
        const mx1 = (p0.x + p1.x) / 2, my1 = (p0.y + p1.y) / 2;
        const mx2 = (p1.x + p2.x) / 2, my2 = (p1.y + p2.y) / 2;
        const age = (now - p1.time) / LIFETIME;
        const t = i / points.length;
        const w = Math.max(0.5, 11 * t * (1 - age * 0.5));
        const a = Math.max(0, (1 - age) * 0.7 * t);
        const hue = HUES[i % HUES.length];
        ctx.beginPath();
        ctx.moveTo(mx1, my1);
        ctx.quadraticCurveTo(p1.x, p1.y, mx2, my2);
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.lineWidth = w;
        ctx.strokeStyle = `rgba(${hue},${a})`;
        ctx.shadowColor = `rgba(${hue},${Math.min(a * 1.4, 0.55)})`;
        ctx.shadowBlur = 7;
        ctx.stroke();
      }
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();
