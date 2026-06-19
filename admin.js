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
      <h2>About</h2>
      <div class="field"><label>Intro paragraph</label><textarea id="f-about">${esc(working.about)}</textarea></div>
    </div>
  `));

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
    </div>
  `);
  root.appendChild(credCard);
  renderCredList();

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
  ['name','tagline','location','email','phone','linkedin','about'].forEach(key => {
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
          <label>File</label>
          <a href="${esc(cred.file)}" target="_blank" rel="noopener" style="font-size:13.5px; color:var(--accent); font-weight:600; word-break:break-all;">${esc(cred.file)}</a>
        </div>
      </div>
    `);
    list.appendChild(item);
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
