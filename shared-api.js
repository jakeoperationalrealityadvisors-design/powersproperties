(function(){
  const STORAGE_KEY = 'powersData';
  const SESSION_KEY = 'powersAdminSession';

  function persistDataLocally(data){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Could not write local cache', error);
    }
  }

  function dispatchDataUpdated(data, { persist = true } = {}){
    if(persist){
      persistDataLocally(data);
    }
    try {
      window.dispatchEvent(new CustomEvent('powersDataUpdated', { detail: data }));
    } catch (error) {}
  }

  async function readResponseJson(response){
    const text = await response.text();
    if(!text) return {};
    try {
      return JSON.parse(text);
    } catch (error) {
      return { message: text };
    }
  }

  async function fetchJson(url, options = {}){
    const response = await fetch(url, {
      cache: 'no-store',
      credentials: 'include',
      headers: { 'Accept': 'application/json', ...(options.headers || {}) },
      ...options
    });
    const payload = await readResponseJson(response);
    if(!response.ok){
      const details = payload?.details ? ` ${payload.details}` : '';
      throw new Error(payload?.error || payload?.message || `Request failed with status ${response.status}.${details}`);
    }
    return payload;
  }

  async function getSiteData(options = {}){
    const {
      allowBrowserCache = false,
      allowSeedFallback = true
    } = options || {};

    try {
      const data = await fetchJson(`/api/site-data?ts=${Date.now()}`);
      persistDataLocally(data);
      return data;
    } catch (error) {
      console.warn('API site-data fetch failed.', error);
    }

    if(allowBrowserCache){
      const local = localStorage.getItem(STORAGE_KEY);
      if(local){
        try {
          return JSON.parse(local);
        } catch (error) {
          console.warn('Could not parse browser cache.', error);
        }
      }
    }

    if(allowSeedFallback){
      try {
        const data = await fetchJson(`data.json?ts=${Date.now()}`, { credentials: 'same-origin' });
        persistDataLocally(data);
        return data;
      } catch (error) {
        console.warn('Seed data fetch failed.', error);
      }
    }

    throw new Error('Could not load site data from the live API.');
  }

  async function saveSiteData(data){
    if(!data || typeof data !== 'object'){
      throw new Error('Cannot save empty site data payload.');
    }

    const payload = await fetchJson('/api/site-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    });

    const saved = payload && payload.data ? payload.data : data;
    dispatchDataUpdated(saved, { persist: true });
    return saved;
  }

  async function login(username, password){
    try {
      await fetchJson('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ username: username, password: password })
      });
      sessionStorage.setItem(SESSION_KEY, 'ok');
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message || 'Login failed.' };
    }
  }

  async function logout(){
    sessionStorage.removeItem(SESSION_KEY);
    try {
      await fetchJson('/api/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Remote logout failed.', error);
    }
  }

  async function hasSession(){
    try {
      const payload = await fetchJson(`/api/session?ts=${Date.now()}`);
      if(payload && payload.authenticated){
        sessionStorage.setItem(SESSION_KEY, 'ok');
        return true;
      }
      sessionStorage.removeItem(SESSION_KEY);
      return false;
    } catch (error) {
      sessionStorage.removeItem(SESSION_KEY);
      return false;
    }
  }

  async function uploadImage(dataUrl, filename){
    if(!dataUrl){
      throw new Error('Missing image data.');
    }

    const payload = await fetchJson('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ dataUrl: dataUrl, filename: filename || 'image.png' })
    });

    if(!payload.url){
      throw new Error('Upload finished without a file URL.');
    }
    return payload.url;
  }

  window.PowersAPI = {
    STORAGE_KEY,
    SESSION_KEY,
    getSiteData,
    saveSiteData,
    login,
    logout,
    hasSession,
    uploadImage
  };
})();
