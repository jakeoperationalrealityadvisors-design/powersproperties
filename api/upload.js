
const { createClient } = require('@supabase/supabase-js');
const { isAuthenticated, readJsonBody, sendJson } = require('../lib/server-utils');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'SITE-MEDIA';

function dataUrlToBuffer(dataUrl){
  const match = String(dataUrl || '').match(/^data:(.+?);base64,(.+)$/);
  if(!match) throw new Error('Invalid data URL.');
  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], 'base64')
  };
}

function sanitizeFilename(filename){
  const safe = String(filename || 'image')
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\.+/, '')
    .replace(/^-+|-+$/g, '');
  return safe || 'image';
}

function sanitizePathSegment(segment, fallback = 'misc'){
  const safe = String(segment || '')
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/(^\/|\/$)/g, '')
    .replace(/-+/g, '-');
  return safe || fallback;
}

function inferExtension(contentType, filename){
  const name = String(filename || '').toLowerCase();
  if(/\.(png|jpg|jpeg|webp|gif|svg)$/.test(name)){
    return name.match(/\.(png|jpg|jpeg|webp|gif|svg)$/)[0];
  }
  if(contentType.includes('png')) return '.png';
  if(contentType.includes('webp')) return '.webp';
  if(contentType.includes('gif')) return '.gif';
  if(contentType.includes('svg')) return '.svg';
  return '.jpg';
}

function buildStoragePath({ target, filename, contentType }){
  const extension = inferExtension(contentType, filename);
  const baseName = sanitizeFilename(filename || `image${extension}`).replace(/\.(png|jpg|jpeg|webp|gif|svg)$/i, '') || 'image';
  const targetPath = sanitizePathSegment(target || 'site-media/uploads', 'site-media/uploads');
  return `${targetPath}/${Date.now()}-${baseName}${extension}`;
}

function getSupabaseAdmin(){
  if(!SUPABASE_URL) throw new Error('Missing SUPABASE_URL.');
  if(!SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY.');
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

module.exports = async function handler(req, res){
  if(req.method !== 'POST'){
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  if(!isAuthenticated(req)){
    return sendJson(res, 401, { error: 'Unauthorized' });
  }

  let body = {};
  try {
    body = await readJsonBody(req);
  } catch (error) {
    return sendJson(res, 400, { error: 'Invalid JSON body.' });
  }

  if(!body.dataUrl){
    return sendJson(res, 400, { error: 'Missing image data.' });
  }

  try {
    const { contentType, buffer } = dataUrlToBuffer(body.dataUrl);
    const path = buildStoragePath({
      target: body.target,
      filename: body.filename,
      contentType
    });

    const supabase = getSupabaseAdmin();
    const { error: uploadError } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .upload(path, buffer, {
        contentType,
        upsert: true,
        cacheControl: '31536000'
      });

    if(uploadError){
      throw uploadError;
    }

    const { data: publicData } = supabase
      .storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);

    if(!publicData?.publicUrl){
      throw new Error('Supabase did not return a public URL.');
    }

    return sendJson(res, 200, {
      ok: true,
      url: publicData.publicUrl,
      bucket: STORAGE_BUCKET,
      path
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: 'Image upload failed.',
      details: error?.message || 'Unknown upload error.'
    });
  }
};
