
const { clearAuthCookie, sendJson } = require('../lib/server-utils');

module.exports = async function handler(req, res){
  if(req.method !== 'POST'){
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }
  return sendJson(res, 200, { ok: true }, { 'Set-Cookie': clearAuthCookie(), 'Cache-Control': 'no-store' });
};
