/*
 * Dhurba Mobile â€” Google Sheets Backend
 * =======================================
 * 
 * SETUP:
 * 1. Go to https://sheets.new (creates a blank sheet)
 * 2. File â†’ Import â†’ Upload â†’ select Dhurba-sheet.xlsx â†’ Replace spreadsheet
 * 3. Extensions â†’ Apps Script â†’ paste this file â†’ save as "Dhurba Mobile API"
 * 4. Deploy â†’ New deployment â†’ Web app â†’ Execute as: Me â†’ Access: Anyone
 * 5. Copy the web app URL â†’ paste into sheets-api.js (replace APPS_SCRIPT_URL)
 *
 * UPDATE (if you change this code):
 *   Deploy â†’ Manage deployments â†’ Edit pencil â†’ New version â†’ Deploy
 *   The URL stays the same.
 */

// ===== READ ENDPOINTS (GET) =====
function doGet(e) {
  try {
    var action = e.parameter.action;
    var sheetName = e.parameter.sheet;
    
    if (action === 'getAll') {
      return jsonResponse(getAllData(sheetName));
    }
    if (action === 'getById') {
      var id = e.parameter.id;
      var data = getAllData(sheetName);
      var found = null;
      for (var i = 0; i < data.length; i++) {
        if (data[i].id === id) { found = data[i]; break; }
      }
      return jsonResponse(found || { error: 'Not found' });
    }
    if (action === 'getSetting') {
      var key = e.parameter.key;
      var settings = getAllData('settings');
      for (var i = 0; i < settings.length; i++) {
        if (settings[i].key === key) return jsonResponse(settings[i].value || '');
      }
      return jsonResponse('');
    }
    if (action === 'auth') {
      return jsonResponse(handleLogin(e.parameter.email, e.parameter.password));
    }
    if (action === 'verifyToken') {
      var token = e.parameter.token;
      var stored = PropertiesService.getScriptProperties().getProperty('token_' + token);
      return jsonResponse({ valid: !!stored });
    }
    if (action === 'getAllSiteData') {
      return jsonResponse({
        banners: getAllData('banners'),
        products: getAllData('products'),
        brands: getAllData('brands'),
        promotions: getAllData('promotions'),
        subBanners: getAllData('subBanners'),
        notifications: getAllData('notifications'),
        settings: getAllData('settings')
      });
    }
    
    return jsonResponse({ error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

// ===== WRITE ENDPOINTS (POST) =====
function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    var action = params.action;
    
    // Verify token for write operations
    if (action === 'save' || action === 'delete') {
      if (!verifyToken(params.token)) {
        return jsonResponse({ error: 'Unauthorized. Please login again.' });
      }
    }
    
    if (action === 'save') {
      return jsonResponse(handleSave(params.sheet, params.id, params.data));
    }
    if (action === 'delete') {
      return jsonResponse(handleDelete(params.sheet, params.id));
    }
    if (action === 'auth') {
      return jsonResponse(handleLogin(params.email, params.password));
    }
    
    return jsonResponse({ error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

// ===== DATA HELPERS =====
function getSheet(name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error('Sheet "' + name + '" not found. Make sure tabs are named correctly.');
  return sheet;
}

var CACHE_TTL = 300; // 5 minutes

function getCachedData(sheetName) {
  var cache = CacheService.getScriptCache();
  var cached = cache.get('d_' + sheetName);
  if (cached) return JSON.parse(cached);
  return null;
}

function setCachedData(sheetName, data) {
  var cache = CacheService.getScriptCache();
  cache.put('d_' + sheetName, JSON.stringify(data), CACHE_TTL);
}

function clearAllCache() {
  var cache = CacheService.getScriptCache();
  ['banners','products','brands','promotions','subBanners','notifications','settings','users','repairs'].forEach(function(n) {
    cache.remove('d_' + n);
  });
}

function getAllData(sheetName) {
  var cached = getCachedData(sheetName);
  if (cached) return cached;
  
  var sheet = getSheet(sheetName);
  var rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  var headers = rows[0];
  var result = [];
  for (var i = 1; i < rows.length; i++) {
    var obj = {};
    var hasValue = false;
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = rows[i][j];
      if (rows[i][j] !== '') hasValue = true;
    }
    if (hasValue) result.push(obj);
  }
  setCachedData(sheetName, result);
  return result;
}

function findRowIndex(sheet, id) {
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] == id) return i + 1; // 1-indexed for getRange
  }
  return -1;
}

function getHeaders(sheet) {
  return sheet.getDataRange().getValues()[0];
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== AUTH =====
function handleLogin(email, password) {
  var users = getAllData('users');
  for (var i = 0; i < users.length; i++) {
    var storedPw = users[i].password || users[i].passwordHash || '';
    if (users[i].email === email && storedPw === password) {
      var token = Utilities.getUuid();
      PropertiesService.getScriptProperties().setProperty('token_' + token, email);
      return { success: true, token: token, email: email };
    }
  }
  return { success: false, error: 'Invalid email or password' };
}

function verifyToken(token) {
  if (!token) return false;
  return !!PropertiesService.getScriptProperties().getProperty('token_' + token);
}

// ===== CRUD OPERATIONS =====
function handleSave(sheetName, id, data) {
  var sheet = getSheet(sheetName);
  var headers = getHeaders(sheet);
  var now = new Date().getTime();
  
  if (id) {
    // UPDATE existing row
    var rowIdx = findRowIndex(sheet, id);
    if (rowIdx === -1) return { error: 'Item not found' };
    
    for (var j = 0; j < headers.length; j++) {
      var val = data[headers[j]];
      if (val !== undefined) {
        sheet.getRange(rowIdx, j + 1).setValue(val);
      }
    }
    clearAllCache();
    return { success: true, id: id };
    
  } else {
    // CREATE new row
    var newId = sheetName.charAt(0).toUpperCase() + '_' + now + '_' + Math.floor(Math.random() * 1000);
    var newRow = [];
    for (var j = 0; j < headers.length; j++) {
      if (headers[j] === 'id') {
        newRow.push(newId);
      } else if (headers[j] === 'createdAt' && data.createdAt === undefined) {
        newRow.push(now);
      } else {
        newRow.push(data[headers[j]] !== undefined ? data[headers[j]] : '');
      }
    }
    sheet.appendRow(newRow);
    clearAllCache();
    return { success: true, id: newId };
  }
}

function handleDelete(sheetName, id) {
  var sheet = getSheet(sheetName);
  var rowIdx = findRowIndex(sheet, id);
  if (rowIdx === -1) return { error: 'Not found' };
  sheet.deleteRow(rowIdx);
  clearAllCache();
  return { success: true };
}
