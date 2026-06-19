/* ============================================================
   SUPABASE CONFIG
   ============================================================
   These are safe to be public — the anon/publishable key only
   allows what your Row Level Security policies permit (public
   read, authenticated-only write), it is not a secret.
   ============================================================ */

const SUPABASE_URL = "https://bycvzrslgkkyiuxtdctz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_T9TdW5g7AqBiOUPo3-MxrQ_loDP9_tc";

let supabaseClient;
try {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
  console.error('Failed to create Supabase client:', e);
}

const CONTENT_ROW_ID = "ana-site"; // the id of the row in site_content holding this site's data

// Fetches the saved content row. Returns null if nothing's been saved yet.
async function fetchSiteContentRow() {
  const { data, error } = await supabaseClient
    .from('site_content')
    .select('data')
    .eq('id', CONTENT_ROW_ID)
    .maybeSingle();
  if (error) {
    console.error('Supabase fetch error:', error);
    return null;
  }
  return data ? data.data : null;
}

// Saves (upserts) the content row. Requires the visitor to be logged in
// (enforced by the "Authenticated can write" policy on the table).
async function saveSiteContentRow(contentObj) {
  const { error } = await supabaseClient
    .from('site_content')
    .upsert({ id: CONTENT_ROW_ID, data: contentObj, updated_at: new Date().toISOString() });
  if (error) {
    console.error('Supabase save error:', error);
    return false;
  }
  return true;
}

// Uploads a file to the public "site-assets" storage bucket and returns
// its public URL. `folder` should be "photos" or "certifications".
async function uploadAssetFile(file, folder) {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${folder}/${Date.now()}-${safeName}`;
  const { error } = await supabaseClient.storage.from('site-assets').upload(path, file);
  if (error) throw error;
  const { data } = supabaseClient.storage.from('site-assets').getPublicUrl(path);
  return data.publicUrl;
}
