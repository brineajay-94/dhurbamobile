/*
 * Dhurba Mobile â€” Frontend API Wrapper for Google Sheets
 * =======================================================
 *
 * 1. Deploy apps-script.gs as a Google Apps Script Web App
 * 2. Paste the web app URL below
 */

var SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbw1AxJPahPXPGsGfPyq0LmsIYBnx9uEJ24ngJZAeg0-v_bK08-oTzVSf1s47Tk2LOmG5A/exec';

// ===== TOKEN MANAGEMENT =====
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

// ===== READ OPERATIONS =====
function fetchTimeout(url, ms, opts) {
  return Promise.race([
    opts ? fetch(url, opts) : fetch(url),
    new Promise(function (_, reject) {
      setTimeout(function () { reject(new Error('Request timed out')); }, ms || 15000);
    })
  ]);
}

function sheets_getAll(sheetName) {
  return fetchTimeout(SHEETS_API_URL + '?action=getAll&sheet=' + encodeURIComponent(sheetName))
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

// ===== WRITE OPERATIONS =====
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

// ===== AUTH =====
function sheets_login(email, password) {
  return fetchTimeout(SHEETS_API_URL + '?action=auth&email=' + encodeURIComponent(email) + '&password=' + encodeURIComponent(password))
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (res.success) {
        setToken(res.token);
        setAdminEmail(res.email);
      }
      return res;
    });
}

function sheets_verifyToken() {
  var token = getToken();
  if (!token) return Promise.resolve(false);
  return fetchTimeout(SHEETS_API_URL + '?action=verifyToken&token=' + encodeURIComponent(token))
    .then(function (r) { return r.json(); })
    .then(function (res) { return res.valid === true; });
}

function sheets_logout() {
  setToken(null);
  setAdminEmail(null);
}

// ===== BATCH + CACHING =====

var sheets_cache = {};

function sheets_getCached(sheetName) {
  return sheets_cache[sheetName] || [];
}

function sheets_setCache(sheetName, data) {
  sheets_cache[sheetName] = data;
}

function sheets_refresh(sheetName) {
  if (sheets_cache[sheetName]) {
    return Promise.resolve(sheets_cache[sheetName]);
  }
  return sheets_getAll(sheetName).then(function (data) {
    sheets_cache[sheetName] = data;
    return data;
  });
}

function sheets_getAllSiteData() {
  return fetch(SHEETS_API_URL + '?action=getAllSiteData')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      sheets_cache['banners'] = data.banners || [];
      sheets_cache['products'] = data.products || [];
      sheets_cache['brands'] = data.brands || [];
      sheets_cache['promotions'] = data.promotions || [];
      sheets_cache['subBanners'] = data.subBanners || [];
      sheets_cache['notifications'] = data.notifications || [];
      sheets_cache['settings'] = data.settings || [];
      return data;
    });
}
