import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ecjqqkrwtpdqejuwvorc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TivuQrZboUvSyd-LZumHfg_2UeA1Rky';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ── Table names (same as web) ──────────────────────────────────────────────────
export const TABLES = {
  projects:    'forge_projects',
  tasks:       'forge_tasks',
  notes:       'forge_notes',
  folders:     'forge_folders',
  files:       'forge_files',
  timeEntries: 'forge_time_entries',
  meta:        'forge_meta',
  deleted:     'forge_deleted',
};

// ── Pull all records for a table ──────────────────────────────────────────────
export async function pullAll(table) {
  const { data, error } = await supabase
    .from(table)
    .select('data')
    .order('updated_at', { ascending: true });
  if (error) { console.warn('[sync] pullAll', table, error.message); return []; }
  return data.map(r => r.data);
}

// ── Pull records newer than cursor ─────────────────────────────────────────────
export async function pullSince(table, since = 0) {
  const { data, error } = await supabase
    .from(table)
    .select('data, updated_at')
    .gt('updated_at', since)
    .order('updated_at', { ascending: true });
  if (error) { console.warn('[sync] pullSince', table, error.message); return []; }
  return data.map(r => r.data);
}

// ── Upsert a record ────────────────────────────────────────────────────────────
export async function upsertRecord(table, record) {
  const { error } = await supabase.from(table).upsert({
    id:         record.id,
    data:       record,
    updated_at: record.updatedAt ?? record.createdAt ?? Date.now(),
  }, { onConflict: 'id' });
  if (error) console.warn('[sync] upsert', table, error.message);
  return !error;
}

// ── Upsert many ───────────────────────────────────────────────────────────────
export async function upsertMany(table, records) {
  if (!records.length) return true;
  const rows = records.map(r => ({
    id:         r.id,
    data:       r,
    updated_at: r.updatedAt ?? r.createdAt ?? Date.now(),
  }));
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
  if (error) console.warn('[sync] upsertMany', table, error.message);
  return !error;
}

// ── Record deletion ────────────────────────────────────────────────────────────
export async function recordDeletion(tableName, id) {
  await supabase.from(TABLES.deleted).upsert({
    id:         `${tableName}:${id}`,
    table_name: tableName,
    record_id:  id,
    deleted_at: Date.now(),
  }, { onConflict: 'id' });
}

// ── Pull meta ──────────────────────────────────────────────────────────────────
export async function pullMeta(key) {
  const { data } = await supabase.from(TABLES.meta).select('data').eq('id', key).single();
  return data?.data?.value ?? null;
}

export async function pushMeta(key, value) {
  await supabase.from(TABLES.meta).upsert({ id: key, data: { value }, updated_at: Date.now() }, { onConflict: 'id' });
}

// ── Upload photo to Supabase Storage ──────────────────────────────────────────
export async function uploadPhoto(uri, bucket = 'forge-photos') {
  const filename  = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const response  = await fetch(uri);
  const blob      = await response.blob();
  const arrayBuf  = await blob.arrayBuffer();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, arrayBuf, { contentType: 'image/jpeg', upsert: false });

  if (error) { console.warn('[storage] upload failed:', error.message); return null; }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename);
  return urlData.publicUrl;
}
