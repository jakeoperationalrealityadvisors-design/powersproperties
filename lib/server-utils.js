const crypto = require('crypto');

const DEFAULT_USER = process.env.ADMIN_USERNAME || '';
const DEFAULT_PASS = process.env.ADMIN_PASSWORD || '';
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || '';
const SESSION_COOKIE = 'powers_admin_session';

function parseCookies(header = ''){
  return String(header || '').split(';').reduce((acc, part) => {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if(!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rawValue.join('=') || '');
    return acc;
  }, {});
}

function authConfigured(){
  return !!(DEFAULT_USER && DEFAULT_PASS && SESSION_SECRET);
}

function createSessionToken(username){
  const timestamp = String(Date.now());
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = `${username}|${timestamp}|${nonce}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}|${signature}`).toString('base64url');
}

function verifySessionToken(token){
  if(!authConfigured() || !token) return false;
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split('|');
    if(parts.length !== 4) return false;
    const [username, timestamp, nonce, signature] = parts;
    const payload = `${username}|${timestamp}|${nonce}`;
    const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
    if(signature !== expected) return false;
    const ageMs = Date.now() - Number(timestamp || 0);
    if(!Number.isFinite(ageMs) || ageMs < 0 || ageMs > 1000 * 60 * 60 * 24 * 14) return false;
    return username === DEFAULT_USER;
  } catch (error) {
    return false;
  }
}

function readJsonBody(req){
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text ? JSON.parse(text) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, payload, headers = {}){
  res.statusCode = status;
  Object.entries({ 'Content-Type': 'application/json; charset=utf-8', ...headers }).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  res.end(JSON.stringify(payload));
}

function isAuthenticated(req){
  const cookies = parseCookies(req.headers.cookie || '');
  return verifySessionToken(cookies[SESSION_COOKIE]);
}

function cookieSecuritySuffix(){
  return process.env.NODE_ENV === 'production' ? '; Secure' : '';
}

function authCookie(token){
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 14}${cookieSecuritySuffix()}`;
}

function clearAuthCookie(){
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${cookieSecuritySuffix()}`;
}

function normalizeData(source){
  const settings = source && typeof source.settings === 'object' ? source.settings : {};
  return {
    rentals: Array.isArray(source?.rentals) ? source.rentals : [],
    projects: Array.isArray(source?.projects) ? source.projects : [],
    content: Array.isArray(source?.content) ? source.content : [],
    settings
  };
}

module.exports = {
  DEFAULT_USER,
  DEFAULT_PASS,
  authConfigured,
  parseCookies,
  createSessionToken,
  verifySessionToken,
  readJsonBody,
  sendJson,
  isAuthenticated,
  authCookie,
  clearAuthCookie,
  normalizeData
};
