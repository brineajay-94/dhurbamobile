let currentAdminEmail = null;
let currentAdminName = null;
let currentAdminRole = null;
var autoSaveProductId = null, autoSaveProductTimer = null, autoSaveProductPending = null;
var autoSaveBannerId = null, autoSaveBannerTimer = null, autoSaveBannerPending = null;
var autoSaveSliderId = null, autoSaveSliderTimer = null, autoSaveSliderPending = null;
var autoSaveBrandId = null, autoSaveBrandTimer = null, autoSaveBrandPending = null;
var autoSavePromotionId = null, autoSavePromotionTimer = null, autoSavePromotionPending = null;
var autoSaveSubBannerId = null, autoSaveSubBannerTimer = null, autoSaveSubBannerPending = null;
var autoSaveUserId = null, autoSaveUserTimer = null, autoSaveUserPending = null;
var autoSaveRepairId = null, autoSaveRepairTimer = null, autoSaveRepairPending = null;

document.addEventListener('DOMContentLoaded', function () {
  const path = window.location.pathname;

  loadAdminTheme();
  loadAdminLogo();

  if (path.includes('login.html')) {
    checkAuthStateLogin();
    return;
  }

  setupSidebar();
  checkAuthState();

  if (path.includes('dashboard') || path.endsWith('index.html') || path.endsWith('/admin/') || path.endsWith('/admin')) { loadDashboard(); }
  if (path.includes('brands')) { loadBrandsTable(); }
  if (path.includes('sub-banners')) { loadSubBannersTable(); }
  if (path.includes('promotions')) { loadPromotionsTable(); }
  if (path.includes('banners')) { loadBannersTable(); }
  if (path.includes('sliders')) { loadSlidersTable(); }
  if (path.includes('products')) { loadProductsTable(); }
  if (path.includes('repairs')) { loadRepairsTable(); }
  if (path.includes('notifications')) { loadNotificationsTable(); }
  if (path.includes('settings')) { loadStoreSettings(); }
  if (path.includes('users')) { loadUsersTable(); }

  function getData(fieldMap) {
    var d = {};
    fieldMap.forEach(function (m) {
      var el = document.getElementById(m[0]);
      if (el) {
        if (el.type === 'checkbox') d[m[1]] = el.checked;
        else if (el.type === 'number') d[m[1]] = parseFloat(el.value) || 0;
        else d[m[1]] = el.value;
      }
    });
    return d;
  }
  var autoSaveConfig = [
    { form: 'bannerForm', idEl: 'bannerId', sheet: 'banners', saveFn: 'fb_save', state: 'banner', fields: [['bannerTitle','title'],['bannerSubtitle','subtitle'],['bannerBtnText','btnText'],['bannerLink','link'],['bannerImage','image'],['bannerOrder','order']] },
    { form: 'sliderForm', idEl: 'sliderId', sheet: 'sliders', saveFn: 'fb_save', state: 'slider', fields: [['sliderTitle','title'],['sliderImage','image'],['sliderOrder','order']] },
    { form: 'brandForm', idEl: 'brandId', sheet: 'brands', saveFn: 'fb_save', state: 'brand', fields: [['brandName','name'],['brandLogo','logo']] },
    { form: 'promotionForm', idEl: 'promotionId', sheet: 'promotions', saveFn: 'fb_save', state: 'promotion', fields: [['promotionTitle','title'],['promotionDescription','description'],['promotionImage','image'],['promotionLink','link'],['promotionOrder','order']] },
    { form: 'subBannerForm', idEl: 'subBannerId', sheet: 'subBanners', saveFn: 'fb_save', state: 'subBanner', fields: [['subBannerTitle','title'],['subBannerDescription','description'],['subBannerImage','image'],['subBannerOrder','order']] },
    { form: 'productForm', idEl: 'productId', sheet: 'products', saveFn: 'sheets_save', state: 'product', fields: [['productName','name'],['productBrand','brand'],['productCategory','category'],['productImage','image'],['productPrice','price'],['productOldPrice','oldPrice'],['productStock','stock'],['productFeatured','featured'],['productDescription','description'],['productUrl','url'],['productSpecs','specs']] },
    { form: 'repairForm', idEl: 'repairId', sheet: 'repairs', saveFn: 'sheets_save', state: 'repair', fields: [['repairPhone','phone'],['repairCustomer','customer'],['repairDevice','device'],['repairCost','cost'],['repairIssue','issue'],['repairStatus','status']] },
    { form: 'userForm', idEl: 'userId', sheet: 'users', saveFn: 'sheets_save', state: 'user', fields: [['userEmail','email'],['userRole','role'],['userName','name'],['userPhone','phone']] }
  ];
  autoSaveConfig.forEach(function (cfg) {
    var formEl = document.getElementById(cfg.form);
    if (!formEl) return;
    var idVar = 'autoSave' + cfg.state.charAt(0).toUpperCase() + cfg.state.slice(1) + 'Id';
    var timerVar = 'autoSave' + cfg.state.charAt(0).toUpperCase() + cfg.state.slice(1) + 'Timer';
    formEl.addEventListener('input', function () {
      var idEl = document.getElementById(cfg.idEl);
      if (!idEl) return;
      var id = idEl.value;
      var data = getData(cfg.fields);
      if (id) {
        if (window[timerVar]) clearTimeout(window[timerVar]);
        window[timerVar] = setTimeout(function () {
          window[cfg.saveFn](cfg.sheet, id, data);
        }, 1500);
      } else {
        var pendingVar = 'autoSave' + cfg.state.charAt(0).toUpperCase() + cfg.state.slice(1) + 'Pending';
        if (!window[pendingVar]) {
          window[pendingVar] = window[cfg.saveFn](cfg.sheet, null, data).then(function (res) {
            if (res && res.id) {
              idEl.value = res.id;
              window[idVar] = res.id;
            }
            window[pendingVar] = null;
          });
        }
      }
    });
  });
});

function checkAuthStateLogin() {
  sheets_verifyToken().then(function (res) {
    if (res && res.valid && res.role === 'admin') {
      window.location.href = 'dashboard.html';
    }
  });
}

function checkAuthState() {
  sheets_verifyToken().then(function (res) {
    if (!res || !res.valid) {
      window.location.href = 'login.html';
      return;
    }
    if (res.role !== 'admin') {
      window.location.href = 'login.html';
      return;
    }
    currentAdminEmail = res.email || getAdminEmail();
    currentAdminName = res.name || getAdminName();
    currentAdminRole = res.role || getAdminRole();
    const avatar = document.getElementById('adminAvatar');
    if (avatar) {
      var nameChar = currentAdminName ? currentAdminName[0].toUpperCase() : (currentAdminEmail ? currentAdminEmail[0].toUpperCase() : 'A');
      avatar.textContent = nameChar;
      avatar.title = currentAdminName || currentAdminEmail || 'Admin';
    }
  });
}

function loadAdminLogo() {
  var imgEls = document.querySelectorAll('.logo-img');
  var iconEls = document.querySelectorAll('.sidebar-logo-icon, .login-logo-icon');
  fb_getOnce('settings', function (settings) {
    if (!settings) return;
    var url = settings.logo || '';
    imgEls.forEach(function (el) { el.src = url || ''; });
    iconEls.forEach(function (el) {
      if (url) el.classList.add('has-image'); else el.classList.remove('has-image');
    });
  });
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const btn = document.getElementById('loginBtn');
  const error = document.getElementById('loginError');

  btn.disabled = true;
  btn.textContent = 'Signing in...';
  error.classList.remove('show');

  sheets_login(email, password).then(function (res) {
    if (res.success) {
      if (res.role !== 'admin') {
        sheets_logout();
        error.textContent = 'Access denied. Admin only.';
        error.classList.add('show');
        btn.disabled = false;
        btn.textContent = 'Sign in';
        return;
      }
      setAdminRole(res.role);
      setAdminName(res.name);
      window.location.href = 'dashboard.html';
    } else {
      error.textContent = res.error || 'Invalid email or password';
      error.classList.add('show');
      btn.disabled = false;
      btn.textContent = 'Sign in';
    }
  }).catch(function (err) {
    error.textContent = err.message || 'Login failed';
    error.classList.add('show');
    btn.disabled = false;
    btn.textContent = 'Sign in';
  });
}

function handleLogout() {
  sheets_logout();
  window.location.href = 'login.html';
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!sidebar) return;
  var isOpen = sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('show', isOpen);
}

function setupSidebar() {
  if (document.getElementById('sidebarOverlay')) return;
  var overlay = document.createElement('div');
  overlay.id = 'sidebarOverlay';
  overlay.className = 'sidebar-overlay';
  overlay.onclick = function () {
    document.getElementById('sidebar').classList.remove('open');
    overlay.classList.remove('show');
  };
  document.body.appendChild(overlay);

  var links = document.querySelectorAll('.sidebar-link');
  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener('click', function (e) {
      if (window.innerWidth <= 768) {
        var sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('open');
        var o = document.getElementById('sidebarOverlay');
        if (o) o.classList.remove('show');
      }
    });
  }
}

function toggleAdminTheme() {
  var isLight = document.documentElement.classList.toggle('light');
  localStorage.setItem('adminTheme', isLight ? 'light' : 'dark');
  updateAdminThemeIcon(isLight);
}

function loadAdminTheme() {
  var saved = localStorage.getItem('adminTheme') || 'dark';
  if (saved === 'light') {
    document.documentElement.classList.add('light');
  }
  updateAdminThemeIcon(saved === 'light');
}

function updateAdminThemeIcon(isLight) {
  var btns = document.querySelectorAll('.theme-btn-admin');
  btns.forEach(function (btn) {
    btn.innerHTML = isLight
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  });
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function showToast(message, type) {
  if (type === undefined) type = 'info';
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(function () { toast.remove(); }, 3500);
}

var confirmModalResolve = null;

function initConfirmModal() {
  if (document.getElementById('confirmModal')) return;
  var div = document.createElement('div');
  div.id = 'confirmModal';
  div.className = 'modal-overlay';
  div.innerHTML = '<div class="modal" style="max-width:420px;padding:28px;text-align:center;"><div class="modal-icon" style="width:48px;height:48px;border-radius:50%;background:rgba(239,68,68,0.12);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg></div><h3 id="confirmTitle" style="margin:0 0 8px;font-size:17px;font-weight:600;color:var(--on-surface);">Are you sure?</h3><p id="confirmMessage" style="margin:0 0 24px;font-size:14px;color:var(--on-surface-variant);line-height:1.5;"></p><div style="display:flex;gap:10px;justify-content:center;"><button id="confirmCancelBtn" class="btn btn-secondary" style="min-width:100px;">Cancel</button><button id="confirmOkBtn" class="btn btn-danger" style="min-width:100px;">Delete</button></div></div>';
  document.body.appendChild(div);
  document.getElementById('confirmCancelBtn').onclick = function () { closeConfirmModal(false); };
  document.getElementById('confirmOkBtn').onclick = function () { closeConfirmModal(true); };
}

function showConfirmModal(message, confirmText) {
  initConfirmModal();
  var modal = document.getElementById('confirmModal');
  document.getElementById('confirmMessage').textContent = message;
  var okBtn = document.getElementById('confirmOkBtn');
  okBtn.textContent = confirmText || 'Delete';
  modal.classList.add('open');
  return new Promise(function (resolve) {
    confirmModalResolve = resolve;
  });
}

function closeConfirmModal(result) {
  var modal = document.getElementById('confirmModal');
  if (modal) modal.classList.remove('open');
  if (confirmModalResolve) { confirmModalResolve(result); confirmModalResolve = null; }
}

function logActivity(action, entity, itemName) {
  var now = new Date();
  var adminEmail = currentAdminEmail || getAdminEmail() || 'Unknown';
  var adminName = currentAdminName || getAdminName() || (adminEmail ? adminEmail.split('@')[0] : 'Unknown');
  var data = {
    action: action,
    entity: entity,
    name: itemName || '',
    admin: adminName,
    time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    date: now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    timestamp: Date.now()
  };
  sheets_save('activity', null, data).catch(function (err) { console.log('Activity log error:', err); });
}

function loadRecentActivities() {
  var container = document.getElementById('recentActivities');
  if (!container) return;
  sheets_getAll('activity').then(function (data) {
    if (!data || data.length === 0) {
      container.innerHTML = '<div class="empty-state"><h3>No recent activities</h3><p>Activities will appear here</p></div>';
      return;
    }
    var sorted = data.slice().sort(function (a, b) { return (b.timestamp || 0) - (a.timestamp || 0); });
    var recent = sorted.slice(0, 10);
    container.innerHTML = recent.map(function (a) {
      var icon = a.action === 'added' ? 'plus' : a.action === 'updated' ? 'edit' : 'trash-2';
      var color = a.action === 'deleted' ? 'var(--error)' : 'var(--primary)';
      return '<div class="activity-item"><div class="activity-icon" style="background:' + color + '15;color:' + color + ';"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="' + (a.action === 'added' ? 'M12 5v14M5 12h14' : a.action === 'updated' ? 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' : 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2') + '"/></svg></div><div class="activity-text"><strong>' + ucfirst(a.action) + '</strong> ' + a.entity + (a.name ? ' \u2014 ' + a.name : '') + '<span class="activity-admin">' + (a.admin || '') + '</span></div><div class="activity-time">' + a.time + '</div></div>';
    }).join('');
  });
}

function ucfirst(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

async function clearAllActivities() {
  if (!await showConfirmModal('Clear all activity history?', 'Clear')) return;
  sheets_getAll('activity').then(function (data) {
    if (!data || data.length === 0) { showToast('No activities to clear', 'info'); return; }
    var promises = data.map(function (item) { return sheets_delete('activity', item.id); });
    return Promise.all(promises);
  }).then(function () {
    showToast('Activity history cleared', 'success');
  }).catch(function (err) { showToast(err.message || 'Error clearing activities', 'error'); });
}

function loadDashboard() {
  Promise.all([
    sheets_getAll('products'),
    sheets_getAll('repairs'),
    new Promise(function (resolve) { fb_getOnce('notifications', function (d) { resolve(d || []); }); }),
    new Promise(function (resolve) { fb_getOnce('banners', function (d) { resolve(d || []); }); }),
    new Promise(function (resolve) { fb_getOnce('brands', function (d) { resolve(d || []); }); })
  ]).then(function (results) {
    var products = results[0] || [];
    var repairs = results[1] || [];
    var notifications = results[2] || [];
    var banners = results[3] || [];
    var brands = results[4] || [];

    var totalProducts = products.length;
    var totalRepairs = repairs.length;
    var pendingRepairs = repairs.filter(function (r) { return r.status === 'Pending' || r.status === 'Diagnosing' || r.status === 'Under Repair'; }).length;
    var deliveredRepairs = repairs.filter(function (r) { return r.status === 'Delivered'; }).length;
    var totalNotifs = notifications.length;
    var totalBanners = banners.length;
    var totalBrands = brands.length;

    var grid = document.getElementById('statsGrid');
    grid.innerHTML = '\
      <div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Total Products</span><div class="stat-card-icon" style="background:rgba(255,107,0,0.15);color:#ff6b00;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div></div><div class="stat-card-value">' + totalProducts + '</div></div>\
      <div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Total Repairs</span><div class="stat-card-icon" style="background:rgba(59,130,246,0.15);color:#3b82f6;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div></div><div class="stat-card-value">' + totalRepairs + '</div></div>\
      <div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Pending Repairs</span><div class="stat-card-icon" style="background:rgba(234,179,8,0.15);color:#eab308;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div></div><div class="stat-card-value">' + pendingRepairs + '</div></div>\
      <div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Delivered</span><div class="stat-card-icon" style="background:rgba(34,197,94,0.15);color:#22c55e;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div></div><div class="stat-card-value">' + deliveredRepairs + '</div></div>\
      <div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Notifications</span><div class="stat-card-icon" style="background:rgba(139,92,246,0.15);color:#8b5cf6;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/></svg></div></div><div class="stat-card-value">' + totalNotifs + '</div></div>\
      <div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Banners</span><div class="stat-card-icon" style="background:rgba(236,72,153,0.15);color:#ec4899;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div></div><div class="stat-card-value">' + totalBanners + '</div></div>\
    ';

    loadRecentRepairs(repairs.slice(0, 5));
    loadRecentActivities();
  });
}

function loadRecentRepairs(recent) {
  const container = document.getElementById('recentRepairs');
  if (!container) return;
  if (recent.length === 0) {
    container.innerHTML = '<div class="empty-state"><h3>No recent repairs</h3></div>';
    return;
  }
  container.innerHTML = recent.map(function (r) {
    const statusClass = r.status ? r.status.toLowerCase().replace(' ', '-') : '';
    return '<div class="repair-card" style="padding: 12px 0; border: none; border-bottom: 1px solid var(--border-light); border-radius: 0;">\
      <div class="repair-info">\
        <h3 style="font-size: 14px;">' + (r.device || '') + '</h3>\
        <p style="font-size: 12px;">' + (r.customer || '') + ' &middot; ' + (r.phone || '') + '</p>\
      </div>\
      <span class="repair-status status-' + statusClass + '" style="font-size: 11px;">' + (r.status || 'Pending') + '</span>\
    </div>';
  }).join('');
}

var bannersData = [];
function loadBannersTable() {
  const tbody = document.getElementById('bannersTableBody');
  if (!tbody) return;
  fb_on('banners', function (data) {
    bannersData = data || [];
    var sorted = bannersData.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    if (sorted.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><h3>No banners added yet</h3><p>Click "Add Banner" to create your first banner</p></div></td></tr>';
      return;
    }
    tbody.innerHTML = sorted.map(function (b) {
      return '<tr>\
        <td><img class="table-img" src="' + (b.image || '') + '" alt="" loading="lazy" onerror="this.src=\'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Crect fill=%22%23f3f4f6%22 width=%2240%22 height=%2240%22/%3E%3C/svg%3E\'"></td>\
        <td>' + (b.title || '') + '</td>\
        <td>' + (b.subtitle || '') + '</td>\
        <td>' + (b.btnText || '') + '</td>\
        <td>' + (b.order || 0) + '</td>\
        <td>\
          <div class="table-actions">\
            <button class="btn btn-ghost btn-sm" onclick="editBanner(\'' + b.id + '\')">Edit</button>\
            <button class="btn btn-danger btn-sm" onclick="deleteBanner(\'' + b.id + '\')">Delete</button>\
          </div>\
        </td>\
      </tr>';
    }).join('');
  });
}

function findBannerById(id) {
  for (var i = 0; i < bannersData.length; i++) {
    if (bannersData[i].id === id) return bannersData[i];
  }
  return null;
}

function cancelBannerModal() { if (autoSaveBannerPending) { autoSaveBannerPending.then(function () { if (autoSaveBannerId) fb_delete('banners', autoSaveBannerId); autoSaveBannerId = null; }); autoSaveBannerPending = null; } else if (autoSaveBannerId) { fb_delete('banners', autoSaveBannerId); autoSaveBannerId = null; } closeModal('bannerModal'); }

function openBannerModal() {
  document.getElementById('bannerForm').reset();
  document.getElementById('bannerId').value = '';
  autoSaveBannerId = null;
  document.getElementById('bannerModalTitle').textContent = 'Add Banner';
  document.getElementById('bannerSubmitBtn').textContent = 'Save';
  openModal('bannerModal');
}

function editBanner(id) {
  var b = findBannerById(id);
  if (!b) return;
  document.getElementById('bannerId').value = id;
  document.getElementById('bannerTitle').value = b.title || '';
  document.getElementById('bannerSubtitle').value = b.subtitle || '';
  document.getElementById('bannerBtnText').value = b.btnText || '';
  document.getElementById('bannerLink').value = b.link || '';
  document.getElementById('bannerImage').value = b.image || '';
  document.getElementById('bannerOrder').value = b.order || 0;
  document.getElementById('bannerModalTitle').textContent = 'Edit Banner';
  document.getElementById('bannerSubmitBtn').textContent = 'Update';
  openModal('bannerModal');
}

function saveBanner(e) {
  e.preventDefault();
  const id = document.getElementById('bannerId').value;
  if (id && id === autoSaveBannerId) { closeModal('bannerModal'); showToast('Banner added!', 'success'); logActivity('added', 'Banner', document.getElementById('bannerTitle').value); return; }
  if (!id && autoSaveBannerPending) { autoSaveBannerPending.then(function () { closeModal('bannerModal'); showToast('Banner added!', 'success'); logActivity('added', 'Banner', document.getElementById('bannerTitle').value); }); return; }
  const data = {
    title: document.getElementById('bannerTitle').value,
    subtitle: document.getElementById('bannerSubtitle').value,
    btnText: document.getElementById('bannerBtnText').value,
    link: document.getElementById('bannerLink').value,
    image: document.getElementById('bannerImage').value,
    order: parseInt(document.getElementById('bannerOrder').value) || 0
  };
  var saveId = id || null;
  fb_save('banners', saveId, data).then(function () {
    closeModal('bannerModal');
    showToast(id ? 'Banner updated!' : 'Banner added!', 'success');
    logActivity(id ? 'updated' : 'added', 'Banner', data.title);
  }).catch(function (err) { showToast(err.message || 'Error saving banner', 'error'); });
}

async function deleteBanner(id) {
  if (!await showConfirmModal('Delete this banner?')) return;
  var b = findBannerById(id);
  var name = b ? b.title : '';
  fb_delete('banners', id).then(function () { showToast('Banner deleted', 'success'); logActivity('deleted', 'Banner', name); }).catch(function (err) { showToast(err.message || 'Error deleting banner', 'error'); });
}

var slidersData = [];
function findSliderById(id) {
  for (var i = 0; i < slidersData.length; i++) {
    if (slidersData[i].id === id) return slidersData[i];
  }
  return null;
}

function loadSlidersTable() {
  const tbody = document.getElementById('slidersTableBody');
  if (!tbody) return;
  fb_on('sliders', function (data) {
    slidersData = data || [];
    var sorted = slidersData.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    if (sorted.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state"><h3>No sliders added yet</h3></div></td></tr>';
      return;
    }
    tbody.innerHTML = sorted.map(function (s) {
      return '<tr>\
        <td><img class="table-img" src="' + (s.image || '') + '" alt="" loading="lazy" onerror="this.src=\'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Crect fill=%22%23f3f4f6%22 width=%2240%22 height=%2240%22/%3E%3C/svg%3E\'"></td>\
        <td>' + (s.title || '') + '</td>\
        <td>' + (s.order || 0) + '</td>\
        <td>\
          <div class="table-actions">\
            <button class="btn btn-ghost btn-sm" onclick="editSlider(\'' + s.id + '\')">Edit</button>\
            <button class="btn btn-danger btn-sm" onclick="deleteSlider(\'' + s.id + '\')">Delete</button>\
          </div>\
        </td>\
      </tr>';
    }).join('');
  });
}

function cancelSliderModal() { if (autoSaveSliderPending) { autoSaveSliderPending.then(function () { if (autoSaveSliderId) fb_delete('sliders', autoSaveSliderId); autoSaveSliderId = null; }); autoSaveSliderPending = null; } else if (autoSaveSliderId) { fb_delete('sliders', autoSaveSliderId); autoSaveSliderId = null; } closeModal('sliderModal'); }

function openSliderModal() {
  document.getElementById('sliderForm').reset();
  document.getElementById('sliderId').value = '';
  autoSaveSliderId = null;
  document.getElementById('sliderModalTitle').textContent = 'Add Slider';
  document.getElementById('sliderSubmitBtn').textContent = 'Save';
  openModal('sliderModal');
}

function editSlider(id) {
  var s = findSliderById(id);
  if (!s) return;
  document.getElementById('sliderId').value = id;
  document.getElementById('sliderTitle').value = s.title || '';
  document.getElementById('sliderImage').value = s.image || '';
  document.getElementById('sliderOrder').value = s.order || 0;
  document.getElementById('sliderModalTitle').textContent = 'Edit Slider';
  document.getElementById('sliderSubmitBtn').textContent = 'Update';
  openModal('sliderModal');
}

function saveSlider(e) {
  e.preventDefault();
  const id = document.getElementById('sliderId').value;
  if (id && id === autoSaveSliderId) { closeModal('sliderModal'); showToast('Slider added!', 'success'); logActivity('added', 'Slider', document.getElementById('sliderTitle').value); return; }
  if (!id && autoSaveSliderPending) { autoSaveSliderPending.then(function () { closeModal('sliderModal'); showToast('Slider added!', 'success'); logActivity('added', 'Slider', document.getElementById('sliderTitle').value); }); return; }
  const data = {
    title: document.getElementById('sliderTitle').value,
    image: document.getElementById('sliderImage').value,
    order: parseInt(document.getElementById('sliderOrder').value) || 0
  };
  var saveId = id || null;
  fb_save('sliders', saveId, data).then(function () {
    closeModal('sliderModal');
    showToast(id ? 'Slider updated!' : 'Slider added!', 'success');
    logActivity(id ? 'updated' : 'added', 'Slider', data.title);
  }).catch(function (err) { showToast(err.message || 'Error saving slider', 'error'); });
}

async function deleteSlider(id) {
  if (!await showConfirmModal('Delete this slider?')) return;
  var s = findSliderById(id);
  var name = s ? s.title : '';
  fb_delete('sliders', id).then(function () { showToast('Slider deleted', 'success'); logActivity('deleted', 'Slider', name); }).catch(function (err) { showToast(err.message || 'Error deleting slider', 'error'); });
}

var promotionsData = [];
function findPromotionById(id) {
  for (var i = 0; i < promotionsData.length; i++) {
    if (promotionsData[i].id === id) return promotionsData[i];
  }
  return null;
}

function loadPromotionsTable() {
  const tbody = document.getElementById('promotionsTableBody');
  if (!tbody) return;
  fb_on('promotions', function (data) {
    promotionsData = data || [];
    var sorted = promotionsData.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    if (sorted.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><h3>No promotions added yet</h3><p>Click "Add Promotion" to create your first promotion</p></div></td></tr>';
      return;
    }
    tbody.innerHTML = sorted.map(function (p) {
      return '<tr>\
        <td><img class="table-img" src="' + (p.image || '') + '" alt="" loading="lazy" onerror="this.src=\'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Crect fill=%22%23f3f4f6%22 width=%2240%22 height=%2240%22/%3E%3C/svg%3E\'"></td>\
        <td style="font-weight: 600;">' + (p.title || '') + '</td>\
        <td>' + (p.description || '') + '</td>\
        <td>' + (p.order || 0) + '</td>\
        <td>\
          <div class="table-actions">\
            <button class="btn btn-ghost btn-sm" onclick="editPromotion(\'' + p.id + '\')">Edit</button>\
            <button class="btn btn-danger btn-sm" onclick="deletePromotion(\'' + p.id + '\')">Delete</button>\
          </div>\
        </td>\
      </tr>';
    }).join('');
  });
}

function cancelPromotionModal() { if (autoSavePromotionPending) { autoSavePromotionPending.then(function () { if (autoSavePromotionId) fb_delete('promotions', autoSavePromotionId); autoSavePromotionId = null; }); autoSavePromotionPending = null; } else if (autoSavePromotionId) { fb_delete('promotions', autoSavePromotionId); autoSavePromotionId = null; } closeModal('promotionModal'); }

function openPromotionModal() {
  document.getElementById('promotionForm').reset();
  document.getElementById('promotionId').value = '';
  autoSavePromotionId = null;
  document.getElementById('promotionModalTitle').textContent = 'Add Promotion';
  document.getElementById('promotionSubmitBtn').textContent = 'Save';
  openModal('promotionModal');
}

function editPromotion(id) {
  var p = findPromotionById(id);
  if (!p) return;
  document.getElementById('promotionId').value = id;
  document.getElementById('promotionTitle').value = p.title || '';
  document.getElementById('promotionDescription').value = p.description || '';
  document.getElementById('promotionImage').value = p.image || '';
  document.getElementById('promotionLink').value = p.link || '';
  document.getElementById('promotionOrder').value = p.order || 0;
  document.getElementById('promotionModalTitle').textContent = 'Edit Promotion';
  document.getElementById('promotionSubmitBtn').textContent = 'Update';
  openModal('promotionModal');
}

function savePromotion(e) {
  e.preventDefault();
  const id = document.getElementById('promotionId').value;
  if (id && id === autoSavePromotionId) { closeModal('promotionModal'); showToast('Promotion added!', 'success'); logActivity('added', 'Promotion', document.getElementById('promotionTitle').value); return; }
  if (!id && autoSavePromotionPending) { autoSavePromotionPending.then(function () { closeModal('promotionModal'); showToast('Promotion added!', 'success'); logActivity('added', 'Promotion', document.getElementById('promotionTitle').value); }); return; }
  const data = {
    title: document.getElementById('promotionTitle').value,
    description: document.getElementById('promotionDescription').value,
    image: document.getElementById('promotionImage').value,
    link: document.getElementById('promotionLink').value,
    order: parseInt(document.getElementById('promotionOrder').value) || 0
  };
  var saveId = id || null;
  fb_save('promotions', saveId, data).then(function () {
    closeModal('promotionModal');
    showToast(id ? 'Promotion updated!' : 'Promotion added!', 'success');
    logActivity(id ? 'updated' : 'added', 'Promotion', data.title);
  }).catch(function (err) { showToast(err.message || 'Error saving promotion', 'error'); });
}

async function deletePromotion(id) {
  if (!await showConfirmModal('Delete this promotion?')) return;
  var p = findPromotionById(id);
  var name = p ? p.title : '';
  fb_delete('promotions', id).then(function () { showToast('Promotion deleted', 'success'); logActivity('deleted', 'Promotion', name); }).catch(function (err) { showToast(err.message || 'Error deleting promotion', 'error'); });
}

var brandsData = [];
function findBrandById(id) {
  for (var i = 0; i < brandsData.length; i++) {
    if (brandsData[i].id === id) return brandsData[i];
  }
  return null;
}

function cancelBrandModal() { if (autoSaveBrandPending) { autoSaveBrandPending.then(function () { if (autoSaveBrandId) fb_delete('brands', autoSaveBrandId); autoSaveBrandId = null; }); autoSaveBrandPending = null; } else if (autoSaveBrandId) { fb_delete('brands', autoSaveBrandId); autoSaveBrandId = null; } closeModal('brandModal'); }

function openBrandModal() {
  document.getElementById('brandForm').reset();
  document.getElementById('brandId').value = '';
  autoSaveBrandId = null;
  document.getElementById('brandModalTitle').textContent = 'Add Brand';
  document.getElementById('brandSubmitBtn').textContent = 'Save';
  openModal('brandModal');
}

function loadBrandsTable() {
  const tbody = document.getElementById('brandsTableBody');
  if (!tbody) return;
  fb_on('brands', function (data) {
    brandsData = data || [];
    if (brandsData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3"><div class="empty-state"><h3>No brands added yet</h3></div></td></tr>';
      return;
    }
    tbody.innerHTML = brandsData.map(function (b) {
      return '<tr>\
        <td>' + (b.logo ? '<img class="table-img" src="' + b.logo + '" alt="' + (b.name || '') + '" onerror="this.style.display=\'none\'">' : '<span style="color:var(--text-muted);font-size:24px;">&lt;/&gt;</span>') + '</td>\
        <td style="font-weight: 600;">' + (b.name || '') + '</td>\
        <td>\
          <div class="table-actions">\
            <button class="btn btn-ghost btn-sm" onclick="editBrand(\'' + b.id + '\')">Edit</button>\
            <button class="btn btn-danger btn-sm" onclick="deleteBrand(\'' + b.id + '\')">Delete</button>\
          </div>\
        </td>\
      </tr>';
    }).join('');
  });
}

function editBrand(id) {
  var b = findBrandById(id);
  if (!b) return;
  document.getElementById('brandId').value = id;
  document.getElementById('brandName').value = b.name || '';
  document.getElementById('brandLogo').value = b.logo || '';
  document.getElementById('brandModalTitle').textContent = 'Edit Brand';
  document.getElementById('brandSubmitBtn').textContent = 'Update';
  openModal('brandModal');
}

function saveBrand(e) {
  e.preventDefault();
  const id = document.getElementById('brandId').value;
  if (id && id === autoSaveBrandId) { closeModal('brandModal'); showToast('Brand added!', 'success'); logActivity('added', 'Brand', document.getElementById('brandName').value); return; }
  if (!id && autoSaveBrandPending) { autoSaveBrandPending.then(function () { closeModal('brandModal'); showToast('Brand added!', 'success'); logActivity('added', 'Brand', document.getElementById('brandName').value); }); return; }
  const data = {
    name: document.getElementById('brandName').value,
    logo: document.getElementById('brandLogo').value
  };
  var saveId = id || null;
  fb_save('brands', saveId, data).then(function () {
    closeModal('brandModal');
    showToast(id ? 'Brand updated!' : 'Brand added!', 'success');
    logActivity(id ? 'updated' : 'added', 'Brand', data.name);
  }).catch(function (err) { showToast(err.message || 'Error saving brand', 'error'); });
}

async function deleteBrand(id) {
  if (!await showConfirmModal('Delete this brand?')) return;
  var b = findBrandById(id);
  var name = b ? b.name : '';
  fb_delete('brands', id).then(function () { showToast('Brand deleted', 'success'); logActivity('deleted', 'Brand', name); }).catch(function (err) { showToast(err.message || 'Error deleting brand', 'error'); });
}

var subBannersData = [];
function findSubBannerById(id) {
  for (var i = 0; i < subBannersData.length; i++) {
    if (subBannersData[i].id === id) return subBannersData[i];
  }
  return null;
}

function loadSubBannersTable() {
  const tbody = document.getElementById('subBannersTableBody');
  if (!tbody) return;
  fb_on('subBanners', function (data) {
    subBannersData = data || [];
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><h3>No sub banners yet</h3></div></td></tr>';
      return;
    }
    tbody.innerHTML = data.map(function (sb) {
      var statusHtml = sb.active === false
        ? '<span class="badge badge-inactive">Inactive</span>'
        : '<span class="badge badge-active">Active</span>';
      return '<tr><td>' + (sb.image ? '<img src="' + sb.image + '" alt="" class="table-thumb">' : '\u2014') + '</td><td style="font-weight:600;">' + (sb.title || '') + '</td><td style="color:var(--on-surface-variant);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (sb.description || '') + '</td><td>' + statusHtml + '</td><td>' + (sb.order || 0) + '</td><td><div class="table-actions"><button class="btn btn-sm btn-outline" onclick="editSubBanner(\'' + sb.id + '\')">Edit</button><button class="btn btn-sm ' + (sb.active === false ? 'btn-success' : 'btn-warning') + '" onclick="toggleSubBanner(\'' + sb.id + '\')">' + (sb.active === false ? 'Activate' : 'Deactivate') + '</button><button class="btn btn-sm btn-danger" onclick="deleteSubBanner(\'' + sb.id + '\')">Delete</button></div></td></tr>';
    }).join('');
  });
}

function cancelSubBannerModal() { if (autoSaveSubBannerPending) { autoSaveSubBannerPending.then(function () { if (autoSaveSubBannerId) fb_delete('subBanners', autoSaveSubBannerId); autoSaveSubBannerId = null; }); autoSaveSubBannerPending = null; } else if (autoSaveSubBannerId) { fb_delete('subBanners', autoSaveSubBannerId); autoSaveSubBannerId = null; } closeModal('subBannerModal'); }

function openSubBannerModal() {
  document.getElementById('subBannerForm').reset();
  document.getElementById('subBannerId').value = '';
  autoSaveSubBannerId = null;
  document.getElementById('subBannerModalTitle').textContent = 'Add Sub Banner';
  document.getElementById('subBannerSubmitBtn').textContent = 'Save';
  document.getElementById('subBannerActive').checked = true;
  document.getElementById('subBannerActiveLabel').textContent = 'Active';
  document.getElementById('subBannerPreviewWrap').classList.remove('has-image');
  openModal('subBannerModal');
}

function editSubBanner(id) {
  var sb = findSubBannerById(id);
  if (!sb) return;
  document.getElementById('subBannerId').value = id;
  document.getElementById('subBannerTitle').value = sb.title || '';
  document.getElementById('subBannerDescription').value = sb.description || '';
  document.getElementById('subBannerImage').value = sb.image || '';
  document.getElementById('subBannerOrder').value = sb.order || 0;
  document.getElementById('subBannerActive').checked = sb.active !== false;
  document.getElementById('subBannerActiveLabel').textContent = sb.active !== false ? 'Active' : 'Inactive';
  if (sb.image) {
    const wrap = document.getElementById('subBannerPreviewWrap');
    const img = document.getElementById('subBannerPreviewImg');
    img.src = sb.image;
    wrap.classList.add('has-image');
  }
  document.getElementById('subBannerModalTitle').textContent = 'Edit Sub Banner';
  document.getElementById('subBannerSubmitBtn').textContent = 'Update';
  openModal('subBannerModal');
}

function saveSubBanner(e) {
  e.preventDefault();
  const id = document.getElementById('subBannerId').value;
  if (id && id === autoSaveSubBannerId) { closeModal('subBannerModal'); showToast('Sub banner added!', 'success'); logActivity('added', 'Sub Banner', document.getElementById('subBannerTitle').value); return; }
  if (!id && autoSaveSubBannerPending) { autoSaveSubBannerPending.then(function () { closeModal('subBannerModal'); showToast('Sub banner added!', 'success'); logActivity('added', 'Sub Banner', document.getElementById('subBannerTitle').value); }); return; }
  const data = {
    title: document.getElementById('subBannerTitle').value,
    description: document.getElementById('subBannerDescription').value,
    image: document.getElementById('subBannerImage').value,
    active: document.getElementById('subBannerActive').checked,
    order: parseInt(document.getElementById('subBannerOrder').value) || 0
  };
  var saveId = id || null;
  fb_save('subBanners', saveId, data).then(function () {
    closeModal('subBannerModal');
    showToast(id ? 'Sub banner updated!' : 'Sub banner added!', 'success');
    logActivity(id ? 'updated' : 'added', 'Sub Banner', data.title);
  }).catch(function (err) { showToast(err.message || 'Error saving sub banner', 'error'); });
}

function toggleSubBanner(id) {
  var sb = findSubBannerById(id);
  if (!sb) return;
  var newActive = sb.active === false ? true : false;
  var updateData = JSON.parse(JSON.stringify(sb));
  updateData.active = newActive;
  fb_save('subBanners', id, updateData).then(function () {
    showToast(newActive ? 'Sub banner activated' : 'Sub banner deactivated', 'success');
    logActivity(newActive ? 'activated' : 'deactivated', 'Sub Banner', sb.title);
  }).catch(function (err) { showToast(err.message || 'Error toggling sub banner', 'error'); });
}

async function deleteSubBanner(id) {
  if (!await showConfirmModal('Delete this sub banner?')) return;
  var sb = findSubBannerById(id);
  var name = sb ? sb.title : '';
  fb_delete('subBanners', id).then(function () { showToast('Sub banner deleted', 'success'); logActivity('deleted', 'Sub Banner', name); }).catch(function (err) { showToast(err.message || 'Error deleting sub banner', 'error'); });
}

var productsData = [];
function findProductById(id) {
  for (var i = 0; i < productsData.length; i++) {
    if (productsData[i].id === id) return productsData[i];
  }
  return null;
}

function loadProductsTable() {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;
  sheets_getAll('products').then(function (data) {
    productsData = data || [];
    filterProductsTable();
  });
}

function filterProductsTable() {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;
  const search = (document.getElementById('productSearchInput') ? document.getElementById('productSearchInput').value : '').toLowerCase();
  const catFilter = document.getElementById('productCategoryFilter') ? document.getElementById('productCategoryFilter').value : 'all';
  var filtered = productsData.filter(function (p) {
    if (catFilter !== 'all' && p.category !== catFilter) return false;
    if (search && !(p.name ? p.name.toLowerCase().includes(search) : false) && !(p.brand ? p.brand.toLowerCase().includes(search) : false)) return false;
    return true;
  });
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9"><div class="empty-state"><h3>No products found</h3></div></td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map(function (p) {
    return '<tr>\
      <td><img class="table-img" src="' + (p.image || '') + '" alt="" loading="lazy" onerror="this.src=\'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Crect fill=%22%23f3f4f6%22 width=%2240%22 height=%2240%22/%3E%3C/svg%3E\'"></td>\
      <td style="font-weight: 600;">' + (p.name || '') + '</td>\
      <td>' + (p.brand || '') + '</td>\
      <td><span class="badge badge-orange">' + (p.category || '') + '</span></td>\
      <td>\u20b9' + Number(p.price || 0).toLocaleString() + '</td>\
      <td><span class="badge ' + (p.stock === 'In Stock' ? 'badge-green' : 'badge-red') + '">' + (p.stock || '') + '</span></td>\
      <td>' + (p.featured === 'yes' ? '<span class="badge badge-blue">Featured</span>' : '') + '</td>\
      <td>' + (p.url ? '<a href="' + p.url + '" target="_blank" class="badge badge-blue" style="text-decoration:none;">Link</a>' : '') + '</td>\
      <td>\
        <div class="table-actions">\
          <button class="btn btn-ghost btn-sm" onclick="editProduct(\'' + p.id + '\')">Edit</button>\
          <button class="btn btn-danger btn-sm" onclick="deleteProduct(\'' + p.id + '\')">Delete</button>\
        </div>\
      </td>\
    </tr>';
  }).join('');
}

function cancelProductModal() { if (autoSaveProductPending) { autoSaveProductPending.then(function () { if (autoSaveProductId) sheets_delete('products', autoSaveProductId); autoSaveProductId = null; }); autoSaveProductPending = null; } else if (autoSaveProductId) { sheets_delete('products', autoSaveProductId); autoSaveProductId = null; } closeModal('productModal'); }

function openProductModal() {
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';
  autoSaveProductId = null;
  document.getElementById('productModalTitle').textContent = 'Add Product';
  document.getElementById('productSubmitBtn').textContent = 'Save';
  openModal('productModal');
}

function editProduct(id) {
  var p = findProductById(id);
  if (!p) return;
  document.getElementById('productId').value = id;
  document.getElementById('productName').value = p.name || '';
  document.getElementById('productBrand').value = p.brand || '';
  document.getElementById('productCategory').value = p.category || '';
  document.getElementById('productImage').value = p.image || '';
  document.getElementById('productPrice').value = p.price || '';
  document.getElementById('productOldPrice').value = p.oldPrice || '';
  document.getElementById('productStock').value = p.stock || 'In Stock';
  document.getElementById('productFeatured').value = p.featured || 'no';
  document.getElementById('productDescription').value = p.description || '';
  document.getElementById('productUrl').value = p.url || '';
  document.getElementById('productSpecs').value = p.specs || '';
  document.getElementById('productModalTitle').textContent = 'Edit Product';
  document.getElementById('productSubmitBtn').textContent = 'Update';
  openModal('productModal');
}

function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  if (id && id === autoSaveProductId) { closeModal('productModal'); showToast('Product added!', 'success'); logActivity('added', 'Product', document.getElementById('productName').value); loadProductsTable(); return; }
  if (!id && autoSaveProductPending) { autoSaveProductPending.then(function () { closeModal('productModal'); showToast('Product added!', 'success'); logActivity('added', 'Product', document.getElementById('productName').value); loadProductsTable(); }); return; }
  const data = {
    name: document.getElementById('productName').value,
    brand: document.getElementById('productBrand').value,
    category: document.getElementById('productCategory').value,
    image: document.getElementById('productImage').value,
    price: parseFloat(document.getElementById('productPrice').value) || 0,
    oldPrice: parseFloat(document.getElementById('productOldPrice').value) || 0,
    stock: document.getElementById('productStock').value,
    featured: document.getElementById('productFeatured').value,
    description: document.getElementById('productDescription').value,
    url: document.getElementById('productUrl').value || '',
    specs: document.getElementById('productSpecs').value || ''
  };
  if (!id) data.createdAt = Date.now();
  var saveId = id || null;
  sheets_save('products', saveId, data).then(function () {
    closeModal('productModal');
    showToast(id ? 'Product updated!' : 'Product added!', 'success');
    logActivity(id ? 'updated' : 'added', 'Product', data.name);
    loadProductsTable();
  }).catch(function (err) { showToast(err.message || 'Error saving product', 'error'); });
}

async function deleteProduct(id) {
  if (!await showConfirmModal('Delete this product?')) return;
  var p = findProductById(id);
  var name = p ? p.name : '';
  sheets_delete('products', id).then(function () { showToast('Product deleted', 'success'); logActivity('deleted', 'Product', name); loadProductsTable(); }).catch(function (err) { showToast(err.message || 'Error deleting product', 'error'); });
}

var repairsData = [];
function findRepairById(id) {
  for (var i = 0; i < repairsData.length; i++) {
    if (repairsData[i].id === id) return repairsData[i];
  }
  return null;
}

function loadRepairsTable() {
  const tbody = document.getElementById('repairsTableBody');
  if (!tbody) return;
  sheets_getAll('repairs').then(function (data) {
    repairsData = data || [];
    filterRepairs();
  });
}

function filterRepairs() {
  const tbody = document.getElementById('repairsTableBody');
  if (!tbody) return;
  const search = (document.getElementById('repairSearchInput') ? document.getElementById('repairSearchInput').value : '').toLowerCase();
  var filtered = repairsData.filter(function (r) {
    if (search && !(r.phone ? r.phone.includes(search) : false) && !(r.customer ? r.customer.toLowerCase().includes(search) : false)) return false;
    return true;
  });
  filtered = filtered.slice().reverse();
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><h3>No repairs found</h3></div></td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map(function (r) {
    var statusClass = r.status ? r.status.toLowerCase().replace(' ', '-') : '';
    return '<tr>\
      <td style="font-weight: 600;">' + (r.phone || '') + '</td>\
      <td>' + (r.customer || '') + '</td>\
      <td>' + (r.device || '') + '</td>\
      <td>' + (r.issue || '') + '</td>\
      <td>\u20b9' + Number(r.cost || 0).toLocaleString() + '</td>\
      <td><span class="badge badge-orange">' + (r.status || 'Pending') + '</span></td>\
      <td style="font-size: 12px; color: var(--text-muted);">' + (r.lastUpdated || '') + '</td>\
      <td>\
        <div class="table-actions">\
          <button class="btn btn-ghost btn-sm" onclick="editRepair(\'' + r.id + '\')">Edit</button>\
          <button class="btn btn-danger btn-sm" onclick="deleteRepair(\'' + r.id + '\')">Delete</button>\
        </div>\
      </td>\
    </tr>';
  }).join('');
}

function cancelRepairModal() { if (autoSaveRepairPending) { autoSaveRepairPending.then(function () { if (autoSaveRepairId) sheets_delete('repairs', autoSaveRepairId); autoSaveRepairId = null; }); autoSaveRepairPending = null; } else if (autoSaveRepairId) { sheets_delete('repairs', autoSaveRepairId); autoSaveRepairId = null; } closeModal('repairModal'); }

function openRepairModal() {
  document.getElementById('repairForm').reset();
  document.getElementById('repairId').value = '';
  autoSaveRepairId = null;
  document.getElementById('repairModalTitle').textContent = 'Add Repair';
  document.getElementById('repairSubmitBtn').textContent = 'Save';
  openModal('repairModal');
}

function editRepair(id) {
  var r = findRepairById(id);
  if (!r) return;
  document.getElementById('repairId').value = id;
  document.getElementById('repairPhone').value = r.phone || '';
  document.getElementById('repairCustomer').value = r.customer || '';
  document.getElementById('repairDevice').value = r.device || '';
  document.getElementById('repairCost').value = r.cost || '';
  document.getElementById('repairIssue').value = r.issue || '';
  document.getElementById('repairStatus').value = r.status || 'Pending';
  document.getElementById('repairModalTitle').textContent = 'Edit Repair';
  document.getElementById('repairSubmitBtn').textContent = 'Update';
  openModal('repairModal');
}

function saveRepair(e) {
  e.preventDefault();
  const id = document.getElementById('repairId').value;
  if (id && id === autoSaveRepairId) { closeModal('repairModal'); showToast('Repair added!', 'success'); logActivity('added', 'Repair', document.getElementById('repairCustomer').value); loadRepairsTable(); return; }
  if (!id && autoSaveRepairPending) { autoSaveRepairPending.then(function () { closeModal('repairModal'); showToast('Repair added!', 'success'); logActivity('added', 'Repair', document.getElementById('repairCustomer').value); loadRepairsTable(); }); return; }
  const now = new Date();
  const data = {
    phone: document.getElementById('repairPhone').value,
    customer: document.getElementById('repairCustomer').value,
    device: document.getElementById('repairDevice').value,
    cost: parseFloat(document.getElementById('repairCost').value) || 0,
    issue: document.getElementById('repairIssue').value,
    status: document.getElementById('repairStatus').value,
    lastUpdated: now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  };
  var saveId = id || null;
  sheets_save('repairs', saveId, data).then(function () {
    closeModal('repairModal');
    showToast(id ? 'Repair updated!' : 'Repair added!', 'success');
    logActivity(id ? 'updated' : 'added', 'Repair', data.customer);
    loadRepairsTable();
  }).catch(function (err) { showToast(err.message || 'Error saving repair', 'error'); });
}

async function deleteRepair(id) {
  if (!await showConfirmModal('Delete this repair record?')) return;
  var r = findRepairById(id);
  var name = r ? r.customer : '';
  sheets_delete('repairs', id).then(function () { showToast('Repair deleted', 'success'); logActivity('deleted', 'Repair', name); loadRepairsTable(); }).catch(function (err) { showToast(err.message || 'Error deleting repair', 'error'); });
}

function loadNotificationsTable() {
  const tbody = document.getElementById('notificationsTableBody');
  if (!tbody) return;
  fb_on('notifications', function (data) {
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state"><h3>No notifications sent yet</h3></div></td></tr>';
      return;
    }
    var reversed = data.slice().reverse();
    tbody.innerHTML = reversed.map(function (n) {
      return '<tr>\
        <td style="font-weight: 600;">' + (n.title || '') + '</td>\
        <td>' + (n.message || '') + '</td>\
        <td style="font-size: 12px; color: var(--text-muted);">' + (n.date || '') + ' ' + (n.time || '') + '</td>\
        <td>\
          <div class="table-actions">\
            <button class="btn btn-danger btn-sm" onclick="deleteNotification(\'' + n.id + '\')">Delete</button>\
          </div>\
        </td>\
      </tr>';
    }).join('');
  });
}

function sendPushNotification(e) {
  e.preventDefault();
  const title = document.getElementById('notifPushTitle').value;
  const message = document.getElementById('notifPushMessage').value;
  const btn = document.getElementById('pushNotifBtn');
  const now = new Date();
  const data = {
    title: title,
    message: message,
    date: now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now()
  };
  btn.disabled = true;
  btn.textContent = 'Sending...';
  fb_save('notifications', null, data).then(function () {
    document.getElementById('notifPushTitle').value = '';
    document.getElementById('notifPushMessage').value = '';
    showToast('Notification sent!', 'success');
    logActivity('sent', 'Notification', title);
    btn.disabled = false;
    btn.textContent = 'Send Notification';
  }).catch(function (err) {
    showToast(err.message || 'Error sending notification', 'error');
    btn.disabled = false;
    btn.textContent = 'Send Notification';
  });
}

async function deleteNotification(id) {
  if (!await showConfirmModal('Delete this notification?')) return;
  fb_delete('notifications', id).then(function () { showToast('Notification deleted', 'success'); logActivity('deleted', 'Notification', ''); }).catch(function (err) { showToast(err.message || 'Error deleting notification', 'error'); });
}

function loadStoreSettings() {
  fb_getOnce('settings', function (settings) {
    if (!settings) return;
    if (document.getElementById('storeName')) document.getElementById('storeName').value = settings.storeName || '';
    if (document.getElementById('storeLogo')) document.getElementById('storeLogo').value = settings.logo || '';
    if (document.getElementById('storePhone')) document.getElementById('storePhone').value = settings.phone || '';
    if (document.getElementById('storeEmail')) document.getElementById('storeEmail').value = settings.email || '';
    if (document.getElementById('storeAddress')) document.getElementById('storeAddress').value = settings.address || '';
    if (document.getElementById('storeMap')) document.getElementById('storeMap').value = settings.map || '';
    if (document.getElementById('storeHours')) document.getElementById('storeHours').value = settings.hours || '';
    if (document.getElementById('primaryColor')) document.getElementById('primaryColor').value = settings.primaryColor || '#ff6b00';
    if (document.getElementById('secondaryColor')) document.getElementById('secondaryColor').value = settings.secondaryColor || '#1a1a2e';
  });
}

function saveStoreSettings(e) {
  e.preventDefault();
  var data = {
    storeName: document.getElementById('storeName').value,
    logo: document.getElementById('storeLogo').value,
    phone: document.getElementById('storePhone').value,
    email: document.getElementById('storeEmail').value,
    address: document.getElementById('storeAddress').value,
    map: document.getElementById('storeMap').value,
    hours: document.getElementById('storeHours').value
  };
  db.ref('settings').update(data).then(function () {
    loadAdminLogo();
    showToast('Settings saved!', 'success');
    logActivity('updated', 'Store Settings', '');
  }).catch(function (err) { showToast(err.message || 'Error saving settings', 'error'); });
}

function saveThemeSettings(e) {
  e.preventDefault();
  var data = {
    primaryColor: document.getElementById('primaryColor').value,
    secondaryColor: document.getElementById('secondaryColor').value
  };
  db.ref('settings').update(data).then(function () {
    showToast('Theme settings saved!', 'success');
    logActivity('updated', 'Theme Settings', '');
  }).catch(function (err) { showToast(err.message || 'Error saving theme', 'error'); });
}

var usersData = [];
function findUserById(id) {
  for (var i = 0; i < usersData.length; i++) {
    if (usersData[i].id === id) return usersData[i];
  }
  return null;
}

function loadUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;
  sheets_getAll('users').then(function (data) {
    usersData = data || [];
    if (usersData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><h3>No users found</h3><p>Click "Add User" to create the first user</p></div></td></tr>';
      return;
    }
    tbody.innerHTML = usersData.map(function (u) {
      var roleBadge = 'badge-gray';
      if (u.role === 'admin') roleBadge = 'badge-orange';
      else if (u.role === 'repair_tech') roleBadge = 'badge-blue';
      else if (u.role === 'user') roleBadge = 'badge-green';
      return '<tr>\
        <td style="font-weight: 600;">' + (u.email || '') + '</td>\
        <td><span class="badge ' + roleBadge + '">' + (u.role || 'user') + '</span></td>\
        <td>' + (u.name || '') + '</td>\
        <td>' + (u.phone || '') + '</td>\
        <td>\
          <div class="table-actions">\
            <button class="btn btn-ghost btn-sm" onclick="editUser(\'' + u.id + '\')">Edit</button>\
            <button class="btn btn-danger btn-sm" onclick="deleteUser(\'' + u.id + '\')">Delete</button>\
          </div>\
        </td>\
      </tr>';
    }).join('');
  });
}

function cancelUserModal() { if (autoSaveUserPending) { autoSaveUserPending.then(function () { if (autoSaveUserId) sheets_delete('users', autoSaveUserId); autoSaveUserId = null; }); autoSaveUserPending = null; } else if (autoSaveUserId) { sheets_delete('users', autoSaveUserId); autoSaveUserId = null; } closeModal('userModal'); }

function openUserModal() {
  document.getElementById('userForm').reset();
  document.getElementById('userId').value = '';
  autoSaveUserId = null;
  document.getElementById('userPassword').required = true;
  document.getElementById('userPassword').style.display = '';
  document.getElementById('userPasswordLabel').style.display = '';
  document.getElementById('userModalTitle').textContent = 'Add User';
  document.getElementById('userSubmitBtn').textContent = 'Save';
  openModal('userModal');
}

function editUser(id) {
  var u = findUserById(id);
  if (!u) return;
  document.getElementById('userId').value = id;
  document.getElementById('userEmail').value = u.email || '';
  document.getElementById('userPassword').value = '';
  document.getElementById('userPassword').required = false;
  document.getElementById('userPassword').style.display = 'none';
  document.getElementById('userPasswordLabel').style.display = 'none';
  document.getElementById('userRole').value = u.role || 'user';
  document.getElementById('userName').value = u.name || '';
  document.getElementById('userPhone').value = u.phone || '';
  document.getElementById('userModalTitle').textContent = 'Edit User';
  document.getElementById('userSubmitBtn').textContent = 'Update';
  openModal('userModal');
}

function saveUser(e) {
  e.preventDefault();
  const id = document.getElementById('userId').value;
  if (id && id === autoSaveUserId) { closeModal('userModal'); showToast('User added!', 'success'); logActivity('added', 'User', document.getElementById('userEmail').value); loadUsersTable(); return; }
  if (!id && autoSaveUserPending) { autoSaveUserPending.then(function () { closeModal('userModal'); showToast('User added!', 'success'); logActivity('added', 'User', document.getElementById('userEmail').value); loadUsersTable(); }); return; }
  var data = {
    email: document.getElementById('userEmail').value,
    role: document.getElementById('userRole').value,
    name: document.getElementById('userName').value,
    phone: document.getElementById('userPhone').value
  };
  var password = document.getElementById('userPassword').value;
  if (password) {
    data.password = password;
  }
  var saveId = id || null;
  sheets_save('users', saveId, data).then(function () {
    closeModal('userModal');
    showToast(id ? 'User updated!' : 'User added!', 'success');
    logActivity(id ? 'updated' : 'added', 'User', data.email);
    loadUsersTable();
  }).catch(function (err) { showToast(err.message || 'Error saving user', 'error'); });
}

async function deleteUser(id) {
  if (!await showConfirmModal('Delete this user?')) return;
  var u = findUserById(id);
  var email = u ? u.email : '';
  sheets_delete('users', id).then(function () { showToast('User deleted', 'success'); logActivity('deleted', 'User', email); loadUsersTable(); }).catch(function (err) { showToast(err.message || 'Error deleting user', 'error'); });
}


