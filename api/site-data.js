const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { readJsonBody, sendJson, isAuthenticated, normalizeData } = require('../lib/server-utils');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'SITE-MEDIA';
const DATA_STORAGE_PATH = process.env.SITE_DATA_STORAGE_PATH || 'site/powers-data.json';

function getSupabaseAdmin(){
  if(!SUPABASE_URL) throw new Error('Missing SUPABASE_URL.');
  if(!SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY.');
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

async function readSeed(){
  const filePath = path.join(process.cwd(), 'data.json');
  try {
    const raw = await fs.promises.readFile(filePath, 'utf8');
    return normalizeData(JSON.parse(raw));
  } catch (error) {
    return normalizeData({ rentals: [], projects: [], content: [], settings: {} });
  }
}

async function readStoredData(){
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(DATA_STORAGE_PATH);
    if(error || !data){
      return readSeed();
    }
    const text = await data.text();
    return normalizeData(JSON.parse(text || '{}'));
  } catch (error) {
    return readSeed();
  }
}

module.exports = async function handler(req, res){
  if(req.method === 'GET'){
    const data = await readStoredData();
    return sendJson(res, 200, data, { 'Cache-Control': 'no-store' });
  }

  if(req.method === 'POST'){
    if(!isAuthenticated(req)){
      return sendJson(res, 401, { error: 'Unauthorized' }, { 'Cache-Control': 'no-store' });
    }

    let body = {};
    try {
      body = await readJsonBody(req);
    } catch (error) {
      return sendJson(res, 400, { error: 'Invalid JSON body.' }, { 'Cache-Control': 'no-store' });
    }

    const data = normalizeData(body || {});
    try {
      const supabase = getSupabaseAdmin();
      const payload = JSON.stringify(data, null, 2);
      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(DATA_STORAGE_PATH, Buffer.from(payload, 'utf8'), {
        contentType: 'application/json; charset=utf-8',
        cacheControl: '0',
        upsert: true
      });

      if(error){
        throw error;
      }

      return sendJson(res, 200, { ok: true, data }, { 'Cache-Control': 'no-store' });
    } catch (error) {
      return sendJson(res, 500, {
        error: 'Could not write site data.',
        details: error?.message || 'Unknown storage error.'
      }, { 'Cache-Control': 'no-store' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return sendJson(res, 405, { error: 'Method not allowed.' }, { 'Cache-Control': 'no-store' });
};
