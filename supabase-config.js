const SUPABASE_URL = "https://zbgdpzyvmtgjmfuikmdk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZ2Rwenl2bXRnam1mdWlrbWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MjEwNzEsImV4cCI6MjA5ODA5NzA3MX0.LhWBvgBsVDKQRcWSYGCamefkpvb3D6xxEde83B8d7R4";

let supabaseClient;
try {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
  console.error('Failed to create Supabase client:', e);
}

const CONTENT_ROW_ID = "ana-site";

async function fetchSiteContentRow() {
  const { data, error } = await supabaseClient
    .from('site_content')
    .select('data')
    .eq('id', CONTENT_ROW_ID)
    .maybeSingle();
  if (error) { console.error('Supabase fetch error:', error); return null; }
  return data ? data.data : null;
}

async function saveSiteContentRow(contentObj) {
  const { error } = await supabaseClient
    .from('site_content')
    .upsert({ id: CONTENT_ROW_ID, data: contentObj, updated_at: new Date().toISOString() });
  if (error) { console.error('Supabase save error:', error); return false; }
  return true;
}

async function uploadAssetFile(file, folder) {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${folder}/${Date.now()}-${safeName}`;
  const { error } = await supabaseClient.storage.from('site-assets').upload(path, file);
  if (error) throw error;
  const { data } = supabaseClient.storage.from('site-assets').getPublicUrl(path);
  return data.publicUrl;
}
