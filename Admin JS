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
  errorEl.textContent = '';

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    errorEl.textContent = "Couldn't log in — check your email and password.";
    return;
  }
  await enterAdmin();
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
      <div class="field"><label>Résumé file (in assets/resume)</label><input id="f-resume" value="${esc(working.resume)}"></div>
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
      <p class="note">First photo is your headshot and shows by default on the site. Upload image files to GitHub under <strong>assets/photos</strong> first, then list the file names here — visitors can click an arrow to see more.</p>
      <div id="photo-list"></div>
      <button type="button" class="btn-soft" id="add-photo-btn">+ Add a photo</button>
    </div>
  `);
  root.appendChild(photosCard);
  renderPhotoList();

  document.getElementById('add-photo-btn').addEventListener('click', () => {
    working.photos = working.photos || [];
    working.photos.push('assets/photos/');
    renderPhotoList();
  });

  const credCard = el(`
    <div class="admin-card">
      <h2>Credentials &amp; documents</h2>
      <p class="note">Certifications, your diploma, transcript, licenses — anything you want visitors to be able to view. Upload the actual PDF or image file to GitHub under <strong>assets/certifications</strong> first, then add it here with the exact file name.</p>
      <div id="cred-list"></div>
      <button type="button" class="btn-soft" id="add-cred-btn">+ Add a credential</button>
    </div>
  `);
  root.appendChild(credCard);
  renderCredList();

  document.getElementById('add-cred-btn').addEventListener('click', () => {
    working.certifications = working.certifications || [];
    working.certifications.push({ name: '', issuer: '', date: '', file: 'assets/certifications/' });
    renderCredList();
  });

  // Wire up basic field listeners
  ['name','tagline','location','email','phone','linkedin','resume','about'].forEach(key => {
    const node = document.getElementById('f-' + key);
    if (node) node.addEventListener('input', () => { working[key] = node.value; });
  });
}

function renderPhotoList() {
  const list = document.getElementById('photo-list');
  list.innerHTML = '';
  (working.photos || []).forEach((path, i) => {
    const item = el(`
      <div class="cred-item">
        <button type="button" class="remove-btn" data-i="${i}">Remove ✕</button>
        <div class="field"><label>${i === 0 ? 'Headshot (shown first)' : 'Photo ' + (i + 1)}</label><input data-photo-i="${i}" value="${esc(path)}" placeholder="assets/photos/your-file.jpg"></div>
      </div>
    `);
    list.appendChild(item);
  });
  list.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
      const i = Number(input.dataset.photoI);
      working.photos[i] = input.value;
    });
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
        <div class="field"><label>File name (in assets/certifications)</label><input data-field="file" data-i="${i}" value="${esc(cred.file)}" placeholder="assets/certifications/loras-diploma.pdf"></div>
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
