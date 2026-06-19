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

function render() {
  const c = SITE_CONTENT;

  document.title = `${c.name} — ${c.tagline}`;

  // Nav
  document.getElementById('nav-name').textContent = c.name;
  const navResume = document.getElementById('resume-link');
  if (c.resume) { navResume.href = c.resume; } else { navResume.style.display = 'none'; }

  // Hero
  document.getElementById('hero-eyebrow').textContent = `${c.tagline} — ${c.location}`;
  document.getElementById('hero-name').textContent = c.name;
  document.getElementById('hero-role').textContent = c.tagline;
  document.getElementById('hero-sub').textContent = c.about;
  document.getElementById('hero-email-link').href = `mailto:${c.email}`;
  document.getElementById('hero-linkedin-link').href = c.linkedin;
  const heroResume = document.getElementById('hero-resume-link');
  if (c.resume) { heroResume.href = c.resume; } else { heroResume.style.display = 'none'; }

  // Stats row (auto-calculated from your content — no need to edit these numbers)
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

  // Profile / About
  document.getElementById('about-text').textContent = c.about;

  // Photo carousel (headshot first; arrows/dots advance manually only)
  renderPhotoCarousel(c);

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

  // Track record — Education
  const eduTl = document.getElementById('education-timeline');
  eduTl.innerHTML = '';
  c.education.forEach(e => {
    eduTl.appendChild(el(`
      <div class="track-item">
        <div class="track-years">${e.years}</div>
        <div>
          <h3 class="track-title">${e.degree}</h3>
          <p class="track-org">${e.school}</p>
          ${e.details ? `<p class="track-details">${e.details}</p>` : ''}
        </div>
      </div>
    `));
  });

  // Track record — Experience
  const expTl = document.getElementById('experience-timeline');
  expTl.innerHTML = '';
  if (c.experience && c.experience.length) {
    c.experience.forEach(x => {
      expTl.appendChild(el(`
        <div class="track-item">
          <div class="track-years">${x.years || ''}</div>
          <div>
            <h3 class="track-title">${x.title}</h3>
            <p class="track-org">${x.organization}</p>
            ${x.details ? `<p class="track-details">${x.details}</p>` : ''}
          </div>
        </div>
      `));
    });
  }

  // Certifications
  const certGrid = document.getElementById('cert-grid');
  certGrid.innerHTML = '';
  if (c.certifications && c.certifications.length) {
    c.certifications.forEach(cert => {
      certGrid.appendChild(el(`
        <div class="cert-card">
          <div class="cert-name">${cert.name}</div>
          <div class="cert-meta">${cert.issuer}${cert.date ? ' · ' + cert.date : ''}</div>
          <a class="cert-link" href="${cert.file}" target="_blank" rel="noopener" data-cert-check>View certificate (PDF) →</a>
        </div>
      `));
    });
    // Hide the link (without breaking layout) if the PDF hasn't been uploaded yet
    certGrid.querySelectorAll('[data-cert-check]').forEach(link => {
      fetch(link.href, { method: 'HEAD' })
        .then(res => { if (!res.ok) link.replaceWith(el(`<span class="cert-link" style="opacity:.5; cursor:default;">PDF coming soon</span>`)); })
        .catch(() => { link.replaceWith(el(`<span class="cert-link" style="opacity:.5; cursor:default;">PDF coming soon</span>`)); });
    });
  } else {
    certGrid.appendChild(el(`<p style="color:var(--muted)">No certifications added yet.</p>`));
  }

  // Skills
  const skillsList = document.getElementById('skills-list');
  skillsList.innerHTML = '';
  (c.skills || []).forEach(s => {
    skillsList.appendChild(el(`<span class="pill">${s}</span>`));
  });

  // Languages
  const langList = document.getElementById('languages-list');
  langList.innerHTML = '';
  (c.languages || []).forEach(l => {
    langList.appendChild(el(`<span class="pill">${l.name} — ${l.level}</span>`));
  });

  // Contact
  document.getElementById('contact-email').innerHTML = `<a href="mailto:${c.email}">${c.email}</a>`;
  document.getElementById('contact-phone').textContent = c.phone;
  document.getElementById('contact-location').textContent = c.location;
  document.getElementById('contact-linkedin').innerHTML = `<a href="${c.linkedin}" target="_blank" rel="noopener">Connect on LinkedIn →</a>`;

  // Footer
  document.getElementById('footer-name').textContent = c.name;
  document.getElementById('footer-year').textContent = new Date().getFullYear();
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
