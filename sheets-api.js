var SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbwQkLPvSVset7NEdEltuIzEAnPTp8D_pIZPW66UHGTVurICiqJqgGnyXbF4bWfz49XY/exec';

function getToken() {
  return localStorage.getItem('adminToken');
}

function setToken(token) {
  if (token) localStorage.setItem('adminToken', token);
  else localStorage.removeItem('adminToken');
}

function getAdminEmail() {
  return localStorage.getItem('adminEmail');
}

function setAdminEmail(email) {
  if (email) localStorage.setItem('adminEmail', email);
  else localStorage.removeItem('adminEmail');
}

function getAdminRole() {
  return localStorage.getItem('adminRole') || '';
}

function setAdminRole(role) {
  if (role) localStorage.setItem('adminRole', role);
  else localStorage.removeItem('adminRole');
}

function getAdminName() {
  return localStorage.getItem('adminName') || '';
}

function setAdminName(name) {
  if (name) localStorage.setItem('adminName', name);
  else localStorage.removeItem('adminName');
}

function fetchTimeout(url, ms, opts) {
  return Promise.race([
    opts ? fetch(url, opts) : fetch(url),
    new Promise(function (_, reject) {
      setTimeout(function () { reject(new Error('Request timed out')); }, ms || 15000);
    })
  ]);
}

function sheets_getAll(sheetName) {
  return fetchTimeout(SHEETS_API_URL + '?action=getAll&sheet=' + encodeURIComponent(sheetName) + '&_=' + Date.now())
    .then(function (r) { return r.json(); });
}

function sheets_getById(sheetName, id) {
  return fetchTimeout(SHEETS_API_URL + '?action=getById&sheet=' + encodeURIComponent(sheetName) + '&id=' + encodeURIComponent(id))
    .then(function (r) { return r.json(); });
}

function sheets_getSetting(key) {
  return fetchTimeout(SHEETS_API_URL + '?action=getSetting&key=' + encodeURIComponent(key))
    .then(function (r) { return r.text(); })
    .then(function (t) { return t ? JSON.parse(t) : ''; });
}

function sheets_save(sheetName, id, data) {
  return fetchTimeout(SHEETS_API_URL, 20000, {
    method: 'POST',
    body: JSON.stringify({ action: 'save', sheet: sheetName, id: id, data: data, token: getToken() })
  }).then(function (r) { return r.json(); });
}

function sheets_delete(sheetName, id) {
  return fetchTimeout(SHEETS_API_URL, 20000, {
    method: 'POST',
    body: JSON.stringify({ action: 'delete', sheet: sheetName, id: id, token: getToken() })
  }).then(function (r) { return r.json(); });
}

function sheets_login(email, password) {
  return fetchTimeout(SHEETS_API_URL + '?action=auth&email=' + encodeURIComponent(email) + '&password=' + encodeURIComponent(password))
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (res.success) {
        setToken(res.token);
        setAdminEmail(res.email);
        setAdminRole(res.role);
        setAdminName(res.name);
      }
      return res;
    });
}

function sheets_verifyToken() {
  var token = getToken();
  if (!token) return Promise.resolve(false);
  return fetchTimeout(SHEETS_API_URL + '?action=verifyToken&token=' + encodeURIComponent(token))
    .then(function (r) { return r.json(); })
    .then(function (res) { return res; });
}

function sheets_logout() {
  setToken(null);
  setAdminEmail(null);
  setAdminRole(null);
  setAdminName(null);
}

var sheets_cache = {};

function sheets_getCached(sheetName) {
  return sheets_cache[sheetName] || [];
}

function sheets_setCache(sheetName, data) {
  sheets_cache[sheetName] = data;
}
