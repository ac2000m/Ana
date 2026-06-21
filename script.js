// This file builds the page using the text in content.js.
// You shouldn't need to edit this — just edit content.js.

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

// Hides one or more elements if the file they link to hasn't been
// uploaded yet (so buttons don't 404 before you've added your files).
function checkFileExists(url, elements) {
  fetch(url, { method: 'HEAD' })
    .then(res => { if (!res.ok) elements.forEach(e => e.style.display = 'none'); })
    .catch(() => elements.forEach(e => e.style.display = 'none'));
}

// Renders the hero photo. First photo is the headshot and shows by default.
// Photos never auto-advance — only the arrows/dots change which one shows.
function renderPhotoCarousel(c) {
  const photos = (c.photos && c.photos.length) ? c.photos : (c.photo ? [c.photo] : []);
  const frame = document.getElementById('photo-frame');
  const prevBtn = document.getElementById('photo-prev');
  const nextBtn = document.getElementById('photo-next');
  const dotsWrap = document.getElementById('photo-dots');
  if (!frame) return;

  if (!photos.length) {
    frame.innerHTML = `<span class="photo-placeholder">Add a photo at<br><strong>assets/photos/</strong></span>`;
    if (prevBtn) prevBtn.hidden = true;
    if (nextBtn) nextBtn.hidden = true;
    return;
  }

  let index = 0;

  function showPhoto(i) {
    index = (i + photos.length) % photos.length;
    frame.innerHTML = '';
    const img = new Image();
    img.alt = c.name;
    img.onerror = () => {
      frame.innerHTML = `<span class="photo-placeholder">Add your photo at<br><strong>${photos[index]}</strong></span>`;
    };
    img.src = photos[index];
    frame.appendChild(img);

    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      if (photos.length > 1) {
        photos.forEach((_, i2) => {
          const dot = el(`<button type="button" class="photo-dot${i2 === index ? ' active' : ''}" aria-label="Show photo ${i2 + 1}"></button>`);
          dot.addEventListener('click', () => showPhoto(i2));
          dotsWrap.appendChild(dot);
        });
      }
    }
  }

  // Only one photo: hide arrows entirely, photo never changes.
  const multi = photos.length > 1;
  if (prevBtn) prevBtn.hidden = !multi;
  if (nextBtn) nextBtn.hidden = !multi;
  if (multi) {
    prevBtn.onclick = () => showPhoto(index - 1);
    nextBtn.onclick = () => showPhoto(index + 1);
  }

  showPhoto(0); // headshot first, no auto-advance
}

// Picks up any saved edits from Supabase (made via the Edit page).
// Falls back to the defaults in content.js if nothing's been saved,
// or if Supabase isn't reachable.
async function getSavedOverrides() {
  try {
    const saved = await fetchSiteContentRow();
    return saved || {};
  } catch (e) {
    return {};
  }
}

async function render() {
  const overrides = await getSavedOverrides();
  const c = Object.assign({}, SITE_CONTENT, overrides);

  document.title = `${c.name} — ${c.tagline}`;

  safe('nav', () => {
    document.getElementById('nav-name').textContent = c.name;
    const navResume = document.getElementById('resume-link');
    if (c.resume) { navResume.href = c.resume; } else { navResume.style.display = 'none'; }
  });

  safe('hero', () => {
    document.getElementById('hero-eyebrow').textContent = `${c.tagline} — ${c.location}`;
    document.getElementById('hero-name').textContent = c.name;
    document.getElementById('hero-role').textContent = c.tagline;
    document.getElementById('hero-sub').textContent = c.heroSub || c.about;
    document.getElementById('hero-email-link').href = `mailto:${c.email}`;
    document.getElementById('hero-linkedin-link').href = c.linkedin;
    const heroResume = document.getElementById('hero-resume-link');
    if (c.resume) { heroResume.href = c.resume; } else { heroResume.style.display = 'none'; }
  });

  safe('stats', () => {
    const statRow = document.getElementById('stat-row');
    statRow.innerHTML = '';
    const certCount = (c.certifications || []).length;
    const langCount = (c.languages || []).length;
    const stats = [
      { num: c.clinicalHours || '0', label: 'Clinical hours' },
      { num: certCount, label: 'Certifications' },
      { num: langCount || 1, label: 'Languages spoken' }
    ];
    stats.forEach(s => {
      statRow.appendChild(el(`
        <div class="stat-badge">
          <div class="stat-num">${s.num}</div>
          <div class="stat-label">${s.label}</div>
        </div>
      `));
    });
  });

  safe('about', () => {
    document.getElementById('about-text').textContent = c.about;
  });

  safe('photo carousel', () => {
    renderPhotoCarousel(c);
  });

  safe('info list', () => {
    const infoList = document.getElementById('info-list');
    infoList.innerHTML = '';
    const currentEdu = (c.education && c.education[0]) || {};
    const info = [
      { label: 'Location', value: c.location },
      { label: 'Currently', value: currentEdu.degree || '' },
      { label: 'At', value: currentEdu.school || '' },
      { label: 'Undergrad', value: (c.education && c.education[1] && c.education[1].school) || '' }
    ];
    info.forEach(i => {
      if (!i.value) return;
      infoList.appendChild(el(`
        <div class="info-item">
          <div class="info-label">${i.label}</div>
          <div class="info-value">${i.value}</div>
        </div>
      `));
    });
  });

  safe('track record', () => {
    const rail = document.getElementById('zigzag-rail');
    rail.innerHTML = '';
    const items = []
      .concat((c.education || []).map(e => ({ kind: 'edu', years: e.years, title: e.degree, org: e.school, details: e.details })))
      .concat((c.experience || []).map(x => ({ kind: 'exp', years: x.years, title: x.title, org: x.organization, details: x.details })));

    items.forEach((item, i) => {
      const side = i % 2 === 0 ? 'left' : 'right';
      const icon = item.kind === 'edu' ? '🎓' : '💼';
      rail.appendChild(el(`
        <div class="zigzag-item zigzag-item--${side}">
          <div class="zigzag-icon">${icon}</div>
          <div class="zigzag-card">
            <div class="zigzag-years">${item.years || ''}</div>
            <h3 class="track-title">${item.title}</h3>
            <p class="track-org">${item.org}</p>
            ${item.details ? `<p class="track-details">${item.details}</p>` : ''}
          </div>
        </div>
      `));
    });
  });

  safe('certifications', () => {
    const certGrid = document.getElementById('cert-grid');
    certGrid.innerHTML = '';
    if (c.certifications && c.certifications.length) {
      c.certifications.forEach(cert => {
        certGrid.appendChild(el(`
          <div class="cert-card">
            <div class="cert-name">${cert.name}</div>
            <div class="cert-meta">${cert.issuer}${cert.date ? ' · ' + cert.date : ''}</div>
            ${cert.file ? `<a class="cert-link" href="${cert.file}" target="_blank" rel="noopener" data-cert-check>View document →</a>` : ''}
          </div>
        `));
      });
      certGrid.querySelectorAll('[data-cert-check]').forEach(link => {
        fetch(link.href, { method: 'HEAD' })
          .then(res => { if (!res.ok) link.replaceWith(el(`<span class="cert-link" style="opacity:.5; cursor:default;">File coming soon</span>`)); })
          .catch(() => { link.replaceWith(el(`<span class="cert-link" style="opacity:.5; cursor:default;">File coming soon</span>`)); });
      });
    } else {
      certGrid.appendChild(el(`<p style="color:var(--muted)">No certifications added yet.</p>`));
    }
  });

  safe('projects', () => {
    const grid = document.getElementById('project-grid');
    grid.innerHTML = '';
    if (c.projects && c.projects.length) {
      c.projects.forEach(p => {
        grid.appendChild(el(`
          <div class="project-card">
            <div class="project-name">${p.name}</div>
            ${p.tag ? `<div class="project-tag">${p.tag}</div>` : ''}
            <p class="project-summary">${p.summary || ''}</p>
            ${p.details ? `<p class="project-details">${p.details}</p>` : ''}
          </div>
        `));
      });
    } else {
      grid.appendChild(el(`<p style="color:var(--muted)">No projects added yet.</p>`));
    }
  });

  safe('skills', () => {
    const skillsList = document.getElementById('skills-list');
    skillsList.innerHTML = '';
    (c.skills || []).forEach(s => {
      skillsList.appendChild(el(`<span class="pill">${s}</span>`));
    });
  });

  safe('languages', () => {
    const langList = document.getElementById('languages-list');
    langList.innerHTML = '';
    (c.languages || []).forEach(l => {
      langList.appendChild(el(`<span class="pill">${l.name} — ${l.level}</span>`));
    });
  });

  safe('contact', () => {
    document.getElementById('contact-email').innerHTML = `<a href="mailto:${c.email}">${c.email}</a>`;
    document.getElementById('contact-phone').textContent = c.phone;
    document.getElementById('contact-location').textContent = c.location;
    document.getElementById('contact-linkedin').innerHTML = `<a href="${c.linkedin}" target="_blank" rel="noopener">Connect on LinkedIn →</a>`;
  });

  safe('social links', () => {
    const wrap = document.getElementById('social-links');
    wrap.innerHTML = '';
    const social = c.social || {};
    const icons = {
      linkedin: '<svg viewBox="0 0 24 24"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.59 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>',
      instagram: '<svg viewBox="0 0 24 24"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.31-1.46.72-2.13 1.39A5.9 5.9 0 0 0 .62 4.14c-.3.76-.5 1.64-.56 2.91C0 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.39 2.13a5.9 5.9 0 0 0 2.13 1.39c.76.3 1.64.5 2.91.56 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.9 5.9 0 0 0 2.13-1.39 5.9 5.9 0 0 0 1.39-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.9 5.9 0 0 0-1.39-2.13A5.9 5.9 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.41-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0z"/></svg>',
      facebook: '<svg viewBox="0 0 24 24"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z"/></svg>',
      x: '<svg viewBox="0 0 24 24"><path d="M18.9 2H22l-7.6 8.7L23.3 22H16.7l-5.2-6.8L5.5 22H2.4l8.1-9.3L1.5 2h6.8l4.7 6.2L18.9 2zm-1.2 18h1.7L7.4 4H5.6l12.1 16z"/></svg>'
    };
    Object.keys(icons).forEach(key => {
      const url = social[key];
      if (url) {
        wrap.appendChild(el(`<a href="${url}" target="_blank" rel="noopener" aria-label="${key}">${icons[key]}</a>`));
      }
    });
  });

  safe('footer', () => {
    document.getElementById('footer-name').textContent = c.name;
    document.getElementById('footer-year').textContent = new Date().getFullYear();
  });
}

// Runs a render step in isolation — if it throws, log it and keep going
// instead of letting one broken section blank out the rest of the page.
function safe(label, fn) {
  try {
    fn();
  } catch (err) {
    console.error(`Error rendering "${label}":`, err);
  }
}

document.addEventListener('DOMContentLoaded', render);

// Short pink trail of fading dots following the cursor
(function () {
  if (window.matchMedia && window.matchMedia('(hover: none)').matches) return;
  let lastSpawn = 0;
  const SPAWN_INTERVAL = 35; // ms between dots — controls trail density
  const DOT_LIFETIME = 450; // ms before a dot fully fades out

  document.addEventListener('mousemove', (e) => {
    const now = performance.now();
    if (now - lastSpawn < SPAWN_INTERVAL) return;
    lastSpawn = now;

    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    dot.style.left = e.clientX + 'px';
    dot.style.top = e.clientY + 'px';
    document.body.appendChild(dot);

    requestAnimationFrame(() => {
      dot.style.opacity = '0';
      dot.style.transform = 'scale(0.3)';
    });
    setTimeout(() => dot.remove(), DOT_LIFETIME);
  });
})();
