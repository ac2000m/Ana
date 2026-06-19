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

// Cursor-following glow
(function () {
  const glow = document.getElementById('cursor-glow');
  if (!glow) return;
  let raf = null;
  document.addEventListener('mousemove', (e) => {
    glow.classList.add('active');
    if (raf) return;
    raf = requestAnimationFrame(() => {
      glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      raf = null;
    });
  });
  document.addEventListener('mouseleave', () => glow.classList.remove('active'));
})();
