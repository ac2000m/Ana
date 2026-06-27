/* ============================================================
   ADMIN / EDIT PAGE LOGIC
   ============================================================
   Login is real email/password auth via Supabase. Only the user
   account(s) you created in Supabase → Authentication → Users
   can log in and save changes (enforced server-side by Row Level
   Security, not just by this page).
   ============================================================ */

let working = Object.assign({}, SITE_CONTENT);

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

// ---------- Login ----------
document.getElementById('unlock-btn').addEventListener('click', tryLogin);
document.getElementById('password-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') tryLogin();
});

async function tryLogin() {
  const email = document.getElementById('email-input').value.trim();
  const password = document.getElementById('password-input').value;
  const errorEl = document.getElementById('password-error');
  errorEl.textContent = 'Logging in…';

  try {
    if (typeof supabaseClient === 'undefined') {
      errorEl.textContent = 'Setup error: Supabase failed to load. Check your internet connection and refresh.';
      return;
    }
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      errorEl.textContent = 'Login failed: ' + error.message;
      return;
    }
    errorEl.textContent = '';
    await enterAdmin();
  } catch (err) {
    errorEl.textContent = 'Unexpected error: ' + (err && err.message ? err.message : String(err));
    console.error(err);
  }
}

async function enterAdmin() {
  document.getElementById('lock-screen').style.display = 'none';
  document.getElementById('admin-content').style.display = 'block';
  document.getElementById('save-bar').style.display = 'flex';

  const saved = await fetchSiteContentRow();
  working = Object.assign({}, SITE_CONTENT, saved || {});
  renderForm();
}

// If already logged in (session persisted), skip straight to the form.
(async function checkExistingSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data && data.session) {
    await enterAdmin();
  }
})();

// ---------- Form rendering ----------
function renderForm() {
  const root = document.getElementById('admin-content');
  root.innerHTML = '';

  root.appendChild(el(`
    <div class="admin-card">
      <h2>Contact &amp; basics</h2>
      <div class="field"><label>Full name</label><input id="f-name" value="${esc(working.name)}"></div>
      <div class="field"><label>Tagline</label><input id="f-tagline" value="${esc(working.tagline)}"></div>
      <div class="field"><label>Location</label><input id="f-location" value="${esc(working.location)}"></div>
      <div class="row2">
        <div class="field"><label>Email</label><input id="f-email" value="${esc(working.email)}"></div>
        <div class="field"><label>Phone</label><input id="f-phone" value="${esc(working.phone)}"></div>
      </div>
      <div class="field"><label>LinkedIn URL</label><input id="f-linkedin" value="${esc(working.linkedin)}"></div>
      <div class="field">
        <label>Résumé</label>
        ${working.resume ? `<a href="${esc(working.resume)}" target="_blank" rel="noopener" style="display:block; font-size:13.5px; color:var(--accent); font-weight:600; word-break:break-all; margin-bottom:8px;">${esc(working.resume)}</a>` : ''}
        <div class="dropzone" id="resume-dropzone">
          <div class="dz-title">${working.resume ? 'Drop a file to replace it, or click to browse' : 'Drag a PDF here, or click to browse'}</div>
          <div class="dz-sub">PDF only</div>
          <input type="file" id="resume-upload-input" accept=".pdf">
        </div>
        <span id="resume-upload-status" class="note" style="display:block; margin-top:8px;"></span>
      </div>
    </div>
  `));

  root.appendChild(el(`
    <div class="admin-card">
      <h2>Hero intro</h2>
      <p class="note">The short paragraph at the top of the site, under your name.</p>
      <div class="field"><label>Hero paragraph</label><textarea id="f-heroSub">${esc(working.heroSub)}</textarea></div>
    </div>
  `));

  root.appendChild(el(`
    <div class="admin-card">
      <h2>About</h2>
      <div class="field"><label>Intro paragraph (shown in "A little about me")</label><textarea id="f-about">${esc(working.about)}</textarea></div>
    </div>
  `));

  const statsCard = el(`
    <div class="admin-card">
      <h2>Stats</h2>
      <p class="note">The small number badges under your name at the top of the site. Add, remove, or edit any of them.</p>
      <div id="stats-list"></div>
      <button type="button" class="btn-soft" id="add-stat-btn">+ Add a stat</button>
    </div>
  `);
  root.appendChild(statsCard);
  renderStatsList();

  document.getElementById('add-stat-btn').addEventListener('click', () => {
    working.stats = working.stats || [];
    working.stats.push({ num: '0', label: '' });
    renderStatsList();
  });

  const photosCard = el(`
    <div class="admin-card">
      <h2>Photos</h2>
      <p class="note">First photo is your headshot and shows by default on the site. Drag a photo in, or click to browse — it goes straight onto the site, no code needed.</p>
      <div id="photo-list"></div>
      <div class="dropzone" id="photo-dropzone">
        <div class="dz-title">Drag a photo here, or click to browse</div>
        <div class="dz-sub">JPG, PNG, etc.</div>
        <input type="file" id="photo-upload-input" accept="image/*">
      </div>
      <div id="photo-upload-status" class="note" style="margin-top:8px; margin-bottom:0;"></div>
    </div>
  `);
  root.appendChild(photosCard);
  renderPhotoList();

  setupDropzone('photo-dropzone', 'photo-upload-input', async (file) => {
    const statusEl = document.getElementById('photo-upload-status');
    statusEl.textContent = 'Uploading…';
    try {
      const url = await uploadAssetFile(file, 'photos');
      working.photos = working.photos || [];
      working.photos.push(url);
      renderPhotoList();
      statusEl.textContent = 'Uploaded!';
      setTimeout(() => { statusEl.textContent = ''; }, 2500);
    } catch (err) {
      statusEl.textContent = 'Upload failed: ' + (err && err.message ? err.message : String(err));
    }
  });

  const credCard = el(`
    <div class="admin-card">
      <h2>Credentials &amp; documents</h2>
      <p class="note">Certifications, your diploma, transcript, licenses — anything you want visitors to be able to view or download. Drag a file in, or click to browse; fill in a name after.</p>
      <div id="cred-list"></div>
      <div class="dropzone" id="cred-dropzone">
        <div class="dz-title">Drag a file here, or click to browse</div>
        <div class="dz-sub">PDF or image</div>
        <input type="file" id="cred-upload-input" accept=".pdf,image/*">
      </div>
      <div id="cred-upload-status" class="note" style="margin-top:8px; margin-bottom:0;"></div>
      <button type="button" class="btn-soft" id="add-cred-no-file-btn" style="margin-top:14px;">+ Add a credential without a file</button>
    </div>
  `);
  root.appendChild(credCard);
  renderCredList();

  document.getElementById('add-cred-no-file-btn').addEventListener('click', () => {
    working.certifications = working.certifications || [];
    working.certifications.push({ name: '', issuer: '', date: '', file: '' });
    renderCredList();
  });

  setupDropzone('cred-dropzone', 'cred-upload-input', async (file) => {
    const statusEl = document.getElementById('cred-upload-status');
    statusEl.textContent = 'Uploading…';
    try {
      const url = await uploadAssetFile(file, 'certifications');
      working.certifications = working.certifications || [];
      const niceName = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
      working.certifications.push({ name: niceName, issuer: '', date: '', file: url });
      renderCredList();
      statusEl.textContent = 'Uploaded! Fill in the name below.';
      setTimeout(() => { statusEl.textContent = ''; }, 3500);
    } catch (err) {
      statusEl.textContent = 'Upload failed: ' + (err && err.message ? err.message : String(err));
    }
  });

  const eduCard = el(`
    <div class="admin-card">
      <h2>Education</h2>
      <p class="note">Shows in "Where I've been," alongside your experience, in order.</p>
      <div id="edu-list"></div>
      <button type="button" class="btn-soft" id="add-edu-btn">+ Add education</button>
    </div>
  `);
  root.appendChild(eduCard);
  renderEduList();

  document.getElementById('add-edu-btn').addEventListener('click', () => {
    working.education = working.education || [];
    working.education.push({ degree: '', school: '', years: '', details: '' });
    renderEduList();
  });

  const expCard = el(`
    <div class="admin-card">
      <h2>Experience</h2>
      <p class="note">Jobs, internships, clinical hours, volunteer work — shows in "Where I've been."</p>
      <div id="exp-list"></div>
      <button type="button" class="btn-soft" id="add-exp-btn">+ Add experience</button>
    </div>
  `);
  root.appendChild(expCard);
  renderExpList();

  document.getElementById('add-exp-btn').addEventListener('click', () => {
    working.experience = working.experience || [];
    working.experience.push({ title: '', organization: '', years: '', details: '' });
    renderExpList();
  });

  const skillsCard = el(`
    <div class="admin-card">
      <h2>What I bring (skills)</h2>
      <p class="note">Add skills one at a time — they appear as tags on your site.</p>
      <div id="skills-pill-list" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;min-height:32px;"></div>
      <div style="display:flex;gap:10px;align-items:center;">
        <input id="skills-new-input" placeholder="e.g. Patient Education" style="flex:1;" onkeydown="if(event.key==='Enter'){event.preventDefault();document.getElementById('skills-add-btn').click();}">
        <button type="button" class="btn-soft" id="skills-add-btn" style="white-space:nowrap;">+ Add</button>
      </div>
    </div>
  `);
  root.appendChild(skillsCard);

  function renderSkillsPills() {
    const container = document.getElementById('skills-pill-list');
    container.innerHTML = '';
    (working.skills || []).forEach((skill, i) => {
      const pill = el(`
        <span style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:var(--accent-soft,#FBDCEA);border-radius:100px;font-size:13.5px;font-weight:500;color:var(--ink);">
          ${esc(skill)}
          <button type="button" data-skill-i="${i}" style="background:none;border:none;cursor:pointer;font-size:14px;color:var(--muted);line-height:1;padding:0;" title="Remove">✕</button>
        </span>
      `);
      container.appendChild(pill);
    });
    container.querySelectorAll('[data-skill-i]').forEach(btn => {
      btn.addEventListener('click', () => {
        working.skills.splice(Number(btn.dataset.skillI), 1);
        renderSkillsPills();
      });
    });
  }
  renderSkillsPills();

  document.getElementById('skills-add-btn').addEventListener('click', () => {
    const input = document.getElementById('skills-new-input');
    const val = input.value.trim();
    if (!val) return;
    working.skills = working.skills || [];
    working.skills.push(val);
    input.value = '';
    renderSkillsPills();
  });

  const langCard = el(`
    <div class="admin-card">
      <h2>Languages</h2>
      <div id="lang-list"></div>
      <button type="button" class="btn-soft" id="add-lang-btn">+ Add a language</button>
    </div>
  `);
  root.appendChild(langCard);
  renderLangList();

  document.getElementById('add-lang-btn').addEventListener('click', () => {
    working.languages = working.languages || [];
    working.languages.push({ name: '', level: '' });
    renderLangList();
  });

  const projectsCard = el(`
    <div class="admin-card">
      <h2>My projects</h2>
      <p class="note">Research or projects you've worked on. "Short summary" always shows; "Full details" appears when a visitor hovers the card.</p>
      <div id="project-list"></div>
      <button type="button" class="btn-soft" id="add-project-btn">+ Add a project</button>
    </div>
  `);
  root.appendChild(projectsCard);
  renderProjectList();

  document.getElementById('add-project-btn').addEventListener('click', () => {
    working.projects = working.projects || [];
    working.projects.push({ name: '', tag: '', summary: '', details: '' });
    renderProjectList();
  });

  const expItemsCard = el(`
    <div class="admin-card">
      <h2>Work experience</h2>
      <p class="note">Jobs, clinical hours, volunteer work — shown in the "Research &amp; work" section alongside your projects.</p>
      <div id="exp-items-list"></div>
      <button type="button" class="btn-soft" id="add-exp-item-btn">+ Add experience</button>
    </div>
  `);
  root.appendChild(expItemsCard);
  renderExpItemsList();

  document.getElementById('add-exp-item-btn').addEventListener('click', () => {
    working.experience_items = working.experience_items || [];
    working.experience_items.push({ name: '', tag: 'Work experience', summary: '', details: '', logo: '' });
    renderExpItemsList();
  });

  const awardsCard = el(`
    <div class="admin-card">
      <h2>Awards &amp; honors</h2>
      <p class="note">Scholarships, dean's list, athletic awards — this section only shows on your site if you add something here. You can also upload a copy of the award.</p>
      <div id="awards-list"></div>
      <button type="button" class="btn-soft" id="add-award-btn">+ Add an award</button>
    </div>
  `);
  root.appendChild(awardsCard);
  renderAwardsList();

  document.getElementById('add-award-btn').addEventListener('click', () => {
    working.awards = working.awards || [];
    working.awards.push({ name: '', issuer: '', date: '', file: '' });
    renderAwardsList();
  });

  const socialCard = el(`
    <div class="admin-card">
      <h2>Social links</h2>
      <p class="note">Leave any of these blank to hide that icon at the bottom of your site. Only filled-in ones show.</p>
      <div class="field"><label>LinkedIn</label><input id="f-social-linkedin" value="${esc((working.social || {}).linkedin)}" placeholder="https://linkedin.com/in/..."></div>
      <div class="field"><label>Instagram</label><input id="f-social-instagram" value="${esc((working.social || {}).instagram)}" placeholder="https://instagram.com/..."></div>
      <div class="field"><label>Facebook</label><input id="f-social-facebook" value="${esc((working.social || {}).facebook)}" placeholder="https://facebook.com/..."></div>
      <div class="field"><label>X (Twitter)</label><input id="f-social-x" value="${esc((working.social || {}).x)}" placeholder="https://x.com/..."></div>
    </div>
  `);
  root.appendChild(socialCard);
  ['linkedin', 'instagram', 'facebook', 'x'].forEach(key => {
    const node = document.getElementById('f-social-' + key);
    node.addEventListener('input', () => {
      working.social = working.social || {};
      working.social[key] = node.value;
    });
  });

  setupDropzone('resume-dropzone', 'resume-upload-input', async (file) => {
    const statusEl = document.getElementById('resume-upload-status');
    statusEl.textContent = 'Uploading…';
    try {
      const url = await uploadAssetFile(file, 'resume');
      working.resume = url;
      statusEl.textContent = 'Uploaded!';
      renderForm();
    } catch (err) {
      statusEl.textContent = 'Upload failed: ' + (err && err.message ? err.message : String(err));
    }
  });

  // Wire up basic field listeners
  ['name','tagline','location','email','phone','linkedin','heroSub','about'].forEach(key => {
    const node = document.getElementById('f-' + key);
    if (node) node.addEventListener('input', () => { working[key] = node.value; });
  });
}

function renderPhotoList() {
  const list = document.getElementById('photo-list');
  list.innerHTML = '';
  (working.photos || []).forEach((path, i) => {
    const item = el(`
      <div class="cred-item" style="display:flex; align-items:center; gap:14px;">
        <img src="${esc(path)}" style="width:56px; height:56px; object-fit:cover; border-radius:10px; background:var(--accent-soft, #FBDCEA); flex-shrink:0;" onerror="this.style.opacity=0.3">
        <div style="flex:1; min-width:0;">
          <div style="font-size:13px; font-weight:600; color:var(--ink);">${i === 0 ? 'Headshot (shown first)' : 'Photo ' + (i + 1)}</div>
          <div style="font-size:12px; color:var(--muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(path)}</div>
        </div>
        <button type="button" class="remove-btn" data-i="${i}" style="position:static;">Remove ✕</button>
      </div>
    `);
    list.appendChild(item);
  });
  list.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.i);
      working.photos.splice(i, 1);
      renderPhotoList();
    });
  });
}

function renderStatsList() {
  const list = document.getElementById('stats-list');
  list.innerHTML = '';
  (working.stats || []).forEach((s, i) => {
    const item = el(`
      <div class="cred-item" style="display:flex; gap:14px; align-items:flex-end;">
        <div class="field" style="flex:0 0 100px; margin-bottom:0;"><label>Number</label><input data-sfield="num" data-i="${i}" value="${esc(s.num)}" placeholder="0"></div>
        <div class="field" style="flex:1; margin-bottom:0;"><label>Label</label><input data-sfield="label" data-i="${i}" value="${esc(s.label)}" placeholder="e.g. Clinical hours"></div>
        <button type="button" class="remove-btn" data-i="${i}" style="position:static; padding-bottom:11px;">Remove ✕</button>
      </div>
    `);
    list.appendChild(item);
  });
  list.querySelectorAll('[data-sfield]').forEach(input => {
    input.addEventListener('input', () => {
      const i = Number(input.dataset.i);
      working.stats[i][input.dataset.sfield] = input.value;
    });
  });
  list.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      working.stats.splice(Number(btn.dataset.i), 1);
      renderStatsList();
    });
  });
}

function renderEduList() {
  const list = document.getElementById('edu-list');
  list.innerHTML = '';
  (working.education || []).forEach((e, i) => {
    const item = el(`
      <div class="cred-item">
        <button type="button" class="remove-btn" data-i="${i}">Remove ✕</button>
        <div class="field"><label>Degree / program</label><input data-efield="degree" data-i="${i}" value="${esc(e.degree)}" placeholder="e.g. Doctor of Physical Therapy (DPT)"></div>
        <div class="row2">
          <div class="field"><label>School</label><input data-efield="school" data-i="${i}" value="${esc(e.school)}" placeholder="e.g. University of Illinois Chicago"></div>
          <div class="field"><label>Years</label><input data-efield="years" data-i="${i}" value="${esc(e.years)}" placeholder="e.g. 2024–2027"></div>
        </div>
        <div class="field"><label>Details (optional)</label><input data-efield="details" data-i="${i}" value="${esc(e.details)}" placeholder="A short note about this"></div>
      </div>
    `);
    list.appendChild(item);
  });
  list.querySelectorAll('[data-efield]').forEach(input => {
    input.addEventListener('input', () => {
      const i = Number(input.dataset.i);
      working.education[i][input.dataset.efield] = input.value;
    });
  });
  list.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      working.education.splice(Number(btn.dataset.i), 1);
      renderEduList();
    });
  });
}

function renderExpList() {
  const list = document.getElementById('exp-list');
  list.innerHTML = '';
  (working.experience || []).forEach((x, i) => {
    const item = el(`
      <div class="cred-item">
        <button type="button" class="remove-btn" data-i="${i}">Remove ✕</button>
        <div class="field"><label>Title / role</label><input data-xfield="title" data-i="${i}" value="${esc(x.title)}" placeholder="e.g. Physical Therapy Aide"></div>
        <div class="row2">
          <div class="field"><label>Organization</label><input data-xfield="organization" data-i="${i}" value="${esc(x.organization)}" placeholder="e.g. Dubuque Physical Therapy"></div>
          <div class="field"><label>Years</label><input data-xfield="years" data-i="${i}" value="${esc(x.years)}" placeholder="e.g. 2022–2023"></div>
        </div>
        <div class="field"><label>Details (optional)</label><input data-xfield="details" data-i="${i}" value="${esc(x.details)}" placeholder="A short note about this"></div>
      </div>
    `);
    list.appendChild(item);
  });
  list.querySelectorAll('[data-xfield]').forEach(input => {
    input.addEventListener('input', () => {
      const i = Number(input.dataset.i);
      working.experience[i][input.dataset.xfield] = input.value;
    });
  });
  list.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      working.experience.splice(Number(btn.dataset.i), 1);
      renderExpList();
    });
  });
}

function renderLangList() {
  const list = document.getElementById('lang-list');
  list.innerHTML = '';
  (working.languages || []).forEach((l, i) => {
    const item = el(`
      <div class="cred-item" style="display:flex; gap:14px; align-items:flex-end;">
        <div class="field" style="flex:1; margin-bottom:0;"><label>Language</label><input data-lfield="name" data-i="${i}" value="${esc(l.name)}" placeholder="e.g. Spanish"></div>
        <div class="field" style="flex:1; margin-bottom:0;"><label>Level</label><input data-lfield="level" data-i="${i}" value="${esc(l.level)}" placeholder="e.g. Native or bilingual proficiency"></div>
        <button type="button" class="remove-btn" data-i="${i}" style="position:static; padding-bottom:11px;">Remove ✕</button>
      </div>
    `);
    list.appendChild(item);
  });
  list.querySelectorAll('[data-lfield]').forEach(input => {
    input.addEventListener('input', () => {
      const i = Number(input.dataset.i);
      working.languages[i][input.dataset.lfield] = input.value;
    });
  });
  list.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      working.languages.splice(Number(btn.dataset.i), 1);
      renderLangList();
    });
  });
}

function renderExpItemsList() {
  const list = document.getElementById('exp-items-list');
  list.innerHTML = '';
  (working.experience_items || []).forEach((x, i) => {
    const item = el(`
      <div class="cred-item">
        <button type="button" class="remove-btn" data-i="${i}">Remove ✕</button>
        <div class="field"><label>Title / role</label><input data-xifield="name" data-i="${i}" value="${esc(x.name)}" placeholder="e.g. Physical Therapy Aide"></div>
        <div class="row2">
          <div class="field"><label>Organization / location</label><input data-xifield="summary" data-i="${i}" value="${esc(x.summary)}" placeholder="e.g. Dubuque Physical Therapy"></div>
          <div class="field"><label>Tag</label><input data-xifield="tag" data-i="${i}" value="${esc(x.tag)}" placeholder="e.g. Work experience"></div>
        </div>
        <div class="field"><label>Details (shown on hover)</label><textarea data-xifield="details" data-i="${i}" placeholder="What did you do there?">${esc(x.details)}</textarea></div>
        <div class="field">
          <label>Logo (optional)</label>
          ${x.logo ? `<img src="${esc(x.logo)}" style="height:28px;width:auto;display:block;margin-bottom:8px;object-fit:contain;">` : ''}
          <label class="btn-soft" for="xi-logo-${i}" style="cursor:pointer;font-size:12.5px;padding:8px 16px;display:inline-flex;">${x.logo ? 'Replace logo' : '+ Upload logo'}</label>
          <input type="file" id="xi-logo-${i}" data-xi-logo-i="${i}" accept="image/*" style="display:none;">
          <span class="xi-logo-status-${i} note" style="margin-left:8px;"></span>
        </div>
      </div>
    `);
    list.appendChild(item);
  });
  list.querySelectorAll('[data-xifield]').forEach(input => {
    input.addEventListener('input', () => {
      working.experience_items[Number(input.dataset.i)][input.dataset.xifield] = input.value;
    });
  });
  list.querySelectorAll('[data-xi-logo-i]').forEach(input => {
    input.addEventListener('change', async () => {
      const file = input.files[0]; if (!file) return;
      const i = Number(input.dataset.xiLogoI);
      const status = list.querySelector(`.xi-logo-status-${i}`);
      if (status) status.textContent = 'Uploading…';
      try {
        const url = await uploadAssetFile(file, 'logos');
        working.experience_items[i].logo = url;
        renderExpItemsList();
      } catch (err) { if (status) status.textContent = 'Failed: ' + (err && err.message ? err.message : err); }
    });
  });
  list.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => { working.experience_items.splice(Number(btn.dataset.i), 1); renderExpItemsList(); });
  });
}

function renderAwardsList() {
  const list = document.getElementById('awards-list');
  list.innerHTML = '';
  (working.awards || []).forEach((a, i) => {
    const item = el(`
      <div class="cred-item" draggable="true" data-award-i="${i}" style="cursor:grab;">
        <button type="button" class="remove-btn" data-i="${i}">Remove ✕</button>
        <div class="field"><label>Award name</label><input data-afield="name" data-i="${i}" value="${esc(a.name)}" placeholder="e.g. Dean's List"></div>
        <div class="row2">
          <div class="field"><label>Issuer</label><input data-afield="issuer" data-i="${i}" value="${esc(a.issuer)}" placeholder="e.g. Loras College"></div>
          <div class="field"><label>Date</label><input data-afield="date" data-i="${i}" value="${esc(a.date)}" placeholder="e.g. Spring 2024"></div>
        </div>
        <div class="field">
          <label>Copy of award (optional)</label>
          ${a.file ? `<a href="${esc(a.file)}" target="_blank" rel="noopener" style="display:block;font-size:13px;color:var(--accent);font-weight:600;word-break:break-all;margin-bottom:8px;">${esc(a.file)}</a>` : ''}
          <div class="dropzone" id="award-dz-${i}">
            <div class="dz-title">${a.file ? 'Drop to replace, or click to browse' : 'Drag a file here, or click to browse'}</div>
            <div class="dz-sub">PDF or image</div>
            <input type="file" id="award-file-${i}" data-award-file-i="${i}" accept=".pdf,image/*">
          </div>
          <div id="award-file-status-${i}" class="note" style="margin-top:6px;"></div>
        </div>
      </div>
    `);
    list.appendChild(item);
  });
  list.querySelectorAll('[data-afield]').forEach(input => {
    input.addEventListener('input', () => {
      working.awards[Number(input.dataset.i)][input.dataset.afield] = input.value;
    });
  });
  // Dropzones for award files
  (working.awards || []).forEach((_, i) => {
    setupDropzone(`award-dz-${i}`, `award-file-${i}`, async (file) => {
      const status = document.getElementById(`award-file-status-${i}`);
      if (status) status.textContent = 'Uploading…';
      try {
        const url = await uploadAssetFile(file, 'awards');
        working.awards[i].file = url;
        renderAwardsList();
      } catch (err) { if (status) status.textContent = 'Failed: ' + (err && err.message ? err.message : err); }
    });
  });
  // Drag to reorder
  let dragSrc = null;
  list.querySelectorAll('[data-award-i]').forEach(row => {
    row.addEventListener('dragstart', () => { dragSrc = Number(row.dataset.awardI); row.style.opacity = '0.4'; });
    row.addEventListener('dragend', () => { row.style.opacity = '1'; });
    row.addEventListener('dragover', (e) => { e.preventDefault(); row.style.background = 'var(--accent-soft)'; });
    row.addEventListener('dragleave', () => { row.style.background = ''; });
    row.addEventListener('drop', (e) => {
      e.preventDefault(); row.style.background = '';
      const target = Number(row.dataset.awardI);
      if (dragSrc === null || dragSrc === target) return;
      const moved = working.awards.splice(dragSrc, 1)[0];
      working.awards.splice(target, 0, moved);
      renderAwardsList();
    });
  });
  list.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => { working.awards.splice(Number(btn.dataset.i), 1); renderAwardsList(); });
  });
}

function renderProjectList() {
  const list = document.getElementById('project-list');
  list.innerHTML = '';
  (working.projects || []).forEach((p, i) => {
    const item = el(`
      <div class="cred-item">
        <button type="button" class="remove-btn" data-i="${i}">Remove ✕</button>
        <div class="field"><label>Project name</label><input data-pfield="name" data-i="${i}" value="${esc(p.name)}" placeholder="e.g. Concussion Recovery in Student Athletes"></div>
        <div class="row2">
          <div class="field"><label>Tag (optional)</label><input data-pfield="tag" data-i="${i}" value="${esc(p.tag)}" placeholder="e.g. Undergraduate research"></div>
          <div class="field"><label>Link (optional)</label><input data-pfield="link" data-i="${i}" value="${esc(p.link)}" placeholder="https://..."></div>
        </div>
        <div class="field"><label>Short summary (always visible)</label><input data-pfield="summary" data-i="${i}" value="${esc(p.summary)}" placeholder="One sentence shown on the card"></div>
        <div class="field"><label>Full details (shown on hover)</label><textarea data-pfield="details" data-i="${i}" placeholder="A longer paragraph about this project">${esc(p.details)}</textarea></div>
        <div class="field">
          <label>File (optional — PDF, image, etc.)</label>
          ${p.file ? `<a href="${esc(p.file)}" target="_blank" rel="noopener" style="display:block;font-size:13px;color:var(--accent);font-weight:600;word-break:break-all;margin-bottom:8px;">${esc(p.file)}</a>` : ''}
          <div class="dropzone" id="proj-dz-${i}">
            <div class="dz-title">${p.file ? 'Drop to replace, or click to browse' : 'Drag a file here, or click to browse'}</div>
            <div class="dz-sub">PDF or image</div>
            <input type="file" id="proj-file-${i}" data-proj-file-i="${i}" accept=".pdf,image/*,.doc,.docx">
          </div>
          <div id="proj-file-status-${i}" class="note" style="margin-top:6px;"></div>
        </div>
      </div>
    `);
    list.appendChild(item);
  });
  list.querySelectorAll('[data-pfield]').forEach(input => {
    input.addEventListener('input', () => {
      working.projects[Number(input.dataset.i)][input.dataset.pfield] = input.value;
    });
  });
  (working.projects || []).forEach((_, i) => {
    setupDropzone(`proj-dz-${i}`, `proj-file-${i}`, async (file) => {
      const status = document.getElementById(`proj-file-status-${i}`);
      if (status) status.textContent = 'Uploading…';
      try {
        const url = await uploadAssetFile(file, 'projects');
        working.projects[i].file = url;
        renderProjectList();
      } catch (err) { if (status) status.textContent = 'Failed: ' + (err && err.message ? err.message : err); }
    });
  });
  list.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      working.projects.splice(Number(btn.dataset.i), 1);
      renderProjectList();
    });
  });
}

function renderCredList() {
  const list = document.getElementById('cred-list');
  list.innerHTML = '';
  (working.certifications || []).forEach((cred, i) => {
    const item = el(`
      <div class="cred-item">
        <button type="button" class="remove-btn" data-i="${i}">Remove ✕</button>
        <div class="field"><label>Name</label><input data-field="name" data-i="${i}" value="${esc(cred.name)}" placeholder="e.g. Loras College Diploma"></div>
        <div class="row2">
          <div class="field"><label>Issuer</label><input data-field="issuer" data-i="${i}" value="${esc(cred.issuer)}" placeholder="e.g. Loras College"></div>
          <div class="field"><label>Date</label><input data-field="date" data-i="${i}" value="${esc(cred.date)}" placeholder="e.g. May 2025"></div>
        </div>
        <div class="field">
          <label>File ${cred.file ? '' : '(optional)'}</label>
          ${cred.file
            ? `<a href="${esc(cred.file)}" target="_blank" rel="noopener" style="font-size:13.5px; color:var(--accent); font-weight:600; word-break:break-all;">${esc(cred.file)}</a>`
            : `<label class="btn-soft" for="cred-file-${i}" style="cursor:pointer; font-size:12.5px; padding:8px 16px;">+ Add a file later</label><input type="file" id="cred-file-${i}" data-add-file-i="${i}" accept=".pdf,image/*" style="display:none;">`
          }
        </div>
      </div>
    `);
    list.appendChild(item);
  });

  list.querySelectorAll('[data-add-file-i]').forEach(input => {
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      const i = Number(input.dataset.addFileI);
      try {
        const url = await uploadAssetFile(file, 'certifications');
        working.certifications[i].file = url;
        renderCredList();
      } catch (err) {
        alert('Upload failed: ' + (err && err.message ? err.message : String(err)));
      }
    });
  });

  list.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
      const i = Number(input.dataset.i);
      const field = input.dataset.field;
      working.certifications[i][field] = input.value;
    });
  });
  list.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.i);
      working.certifications.splice(i, 1);
      renderCredList();
    });
  });
}

function esc(str) {
  return (str || '').toString().replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

// Wires a dropzone div + its hidden file input for both click-to-browse
// and real drag-and-drop. `onFile` is called with the chosen File.
function setupDropzone(zoneId, inputId, onFile) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  if (!zone || !input) return;

  zone.addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    if (input.files && input.files[0]) onFile(input.files[0]);
    input.value = '';
  });

  ['dragenter', 'dragover'].forEach(evt => {
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.add('dragover');
    });
  });
  ['dragleave', 'dragend'].forEach(evt => {
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.remove('dragover');
    });
  });
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    zone.classList.remove('dragover');
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) onFile(file);
  });
}

// ---------- Save / export ----------
document.getElementById('save-btn').addEventListener('click', async () => {
  const status = document.getElementById('save-status');
  status.textContent = 'Saving…';
  const merged = Object.assign({}, SITE_CONTENT, working);
  const ok = await saveSiteContentRow(merged);
  status.textContent = ok
    ? 'Saved! Changes are now live for everyone.'
    : "Couldn't save — check your connection and try again.";
  setTimeout(() => { status.textContent = 'Changes save live to your site instantly.'; }, 4000);
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  location.reload();
});

document.getElementById('download-btn').addEventListener('click', () => {
  const merged = Object.assign({}, SITE_CONTENT, working);
  const fileText = buildContentJs(merged);
  const blob = new Blob([fileText], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'content.js';
  a.click();
  URL.revokeObjectURL(url);
});

function buildContentJs(c) {
  return `/* ============================================================
   ANA'S WEBSITE CONTENT
   ============================================================
   This file was generated from the Edit page. You can keep editing
   it by hand too — everything in quotes " " is what shows up on
   the website.
   ============================================================ */

const SITE_CONTENT = ${JSON.stringify(c, null, 2)};
`;
}
