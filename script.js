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
    const allItems = (c.projects || []).concat(
      (c.experience_items || []).map(x => ({
        name: x.name, tag: x.tag, summary: x.summary,
        details: x.details, link: x.link, file: x.file, logo: x.logo
      }))
    ).filter(p => p.name && p.name.trim()); // skip blank/malformed entries

    if (allItems.length) {
      const pg = el('<div class="project-grid"></div>');
      allItems.forEach(p => {
        pg.appendChild(el(`
          <div class="project-card">
            ${p.logo ? `<img src="${p.logo}" style="height:32px;width:auto;object-fit:contain;margin-bottom:8px;" loading="lazy">` : ''}
            <div class="project-name">${p.name || ''}</div>
            ${p.tag ? `<div class="project-tag">${p.tag}</div>` : ''}
            <p class="project-summary">${p.summary || ''}</p>
            <p class="project-details">${p.details || ''}</p>
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
      instagram: '<svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
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
