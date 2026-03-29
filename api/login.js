
const { DEFAULT_USER, DEFAULT_PASS, authConfigured, createSessionToken, authCookie, readJsonBody, sendJson } = require('../lib/server-utils');

module.exports = async function handler(req, res){
  if(req.method !== 'POST'){
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  if(!authConfigured()){
    return sendJson(res, 503, { error: 'Admin authentication is not configured on this deployment.' }, { 'Cache-Control': 'no-store' });
  }

  let body = {};
  try {
    body = await readJsonBody(req);
  } catch (error) {
    return sendJson(res, 400, { error: 'Invalid JSON body.' });
  }

  if(body.username !== DEFAULT_USER || body.password !== DEFAULT_PASS){
    return sendJson(res, 401, { error: 'Invalid username or password.' });
  }

  const token = createSessionToken(body.username);
  return sendJson(res, 200, { ok: true }, { 'Set-Cookie': authCookie(token), 'Cache-Control': 'no-store' });
};
