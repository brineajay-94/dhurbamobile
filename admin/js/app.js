let currentUser = null;

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
});

function checkAuthStateLogin() {
  auth.onAuthStateChanged(user => {
    if (user) {
      window.location.href = 'dashboard.html';
    }
  });
}

function checkAuthState() {
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    currentUser = user;
    const avatar = document.getElementById('adminAvatar');
    if (avatar) {
      avatar.textContent = user.email ? user.email[0].toUpperCase() : 'A';
    }
  });
}

function loadAdminLogo() {
  db.ref('settings/logo').once('value', snap => {
    const url = snap.val();
    document.querySelectorAll('.logo-img').forEach(el => { el.src = url || ''; });
    document.querySelectorAll('.sidebar-logo-icon, .login-logo-icon').forEach(el => {
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

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = 'dashboard.html';
    })
    .catch(err => {
      error.textContent = err.message;
      error.classList.add('show');
      btn.disabled = false;
      btn.textContent = 'Sign in';
    });
}

function handleLogout() {
  auth.signOut().then(() => {
    window.location.href = 'login.html';
  });
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

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 3500);
}

// ===== CONFIRM MODAL =====
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

// ===== ACTIVITY LOG =====
function logActivity(action, entity, itemName) {
  var now = new Date();
  var adminEmail = currentUser ? currentUser.email : 'Unknown';
  var adminName = adminEmail ? adminEmail.split('@')[0] : 'Unknown';
  var data = {
    action: action,
    entity: entity,
    name: itemName || '',
    admin: adminName,
    time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    date: now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    timestamp: Date.now()
  };
  db.ref('activity').push(data).catch(function (err) { console.log('Activity log error:', err); });
}

function loadRecentActivities() {
  var container = document.getElementById('recentActivities');
  if (!container) return;
  db.ref('activity').orderByChild('timestamp').limitToLast(10).on('value', function (snap) {
    var data = snap.val();
    if (!data) {
      container.innerHTML = '<div class="empty-state"><h3>No recent activities</h3><p>Activities will appear here</p></div>';
      return;
    }
    var entries = Object.entries(data).reverse();
    container.innerHTML = entries.map(function (e) {
      var a = e[1];
      var icon = a.action === 'added' ? 'plus' : a.action === 'updated' ? 'edit' : 'trash-2';
      var color = a.action === 'deleted' ? 'var(--error)' : 'var(--primary)';
      return '<div class="activity-item"><div class="activity-icon" style="background:' + color + '15;color:' + color + ';"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="' + (a.action === 'added' ? 'M12 5v14M5 12h14' : a.action === 'updated' ? 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' : 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2') + '"/></svg></div><div class="activity-text"><strong>' + ucfirst(a.action) + '</strong> ' + a.entity + (a.name ? ' — ' + a.name : '') + '<span class="activity-admin">' + (a.admin || '') + '</span></div><div class="activity-time">' + a.time + '</div></div>';
    }).join('');
  });
}

function ucfirst(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

async function clearAllActivities() {
  if (!await showConfirmModal('Clear all activity history?', 'Clear')) return;
  db.ref('activity').remove().then(function () {
    showToast('Activity history cleared', 'success');
  }).catch(function (err) { showToast(err.message, 'error'); });
}

// ===== DASHBOARD =====
function loadDashboard() {
  const promises = [
    db.ref('products').once('value'),
    db.ref('repairs').once('value'),
    db.ref('notifications').once('value'),
    db.ref('banners').once('value'),
    db.ref('brands').once('value')
  ];

  Promise.all(promises).then(([productsSnap, repairsSnap, notifSnap, bannersSnap, brandsSnap]) => {
    const products = productsSnap.val();
    const repairs = repairsSnap.val();
    const notifications = notifSnap.val();
    const banners = bannersSnap.val();
    const brands = brandsSnap.val();

    const totalProducts = products ? Object.keys(products).length : 0;
    const totalRepairs = repairs ? Object.keys(repairs).length : 0;
    const repairsArr = repairs ? Object.values(repairs) : [];
    const pendingRepairs = repairsArr.filter(r => r.status === 'Pending' || r.status === 'Diagnosing' || r.status === 'Under Repair').length;
    const deliveredRepairs = repairsArr.filter(r => r.status === 'Delivered').length;
    const totalNotifs = notifications ? Object.keys(notifications).length : 0;
    const totalBanners = banners ? Object.keys(banners).length : 0;
    const totalBrands = brands ? Object.keys(brands).length : 0;

    const grid = document.getElementById('statsGrid');
    grid.innerHTML = `
      <div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Total Products</span><div class="stat-card-icon" style="background:rgba(255,107,0,0.15);color:#ff6b00;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div></div><div class="stat-card-value">${totalProducts}</div></div>
      <div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Total Repairs</span><div class="stat-card-icon" style="background:rgba(59,130,246,0.15);color:#3b82f6;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div></div><div class="stat-card-value">${totalRepairs}</div></div>
      <div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Pending Repairs</span><div class="stat-card-icon" style="background:rgba(234,179,8,0.15);color:#eab308;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div></div><div class="stat-card-value">${pendingRepairs}</div></div>
      <div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Delivered</span><div class="stat-card-icon" style="background:rgba(34,197,94,0.15);color:#22c55e;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div></div><div class="stat-card-value">${deliveredRepairs}</div></div>
      <div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Notifications</span><div class="stat-card-icon" style="background:rgba(139,92,246,0.15);color:#8b5cf6;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/></svg></div></div><div class="stat-card-value">${totalNotifs}</div></div>
      <div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Banners</span><div class="stat-card-icon" style="background:rgba(236,72,153,0.15);color:#ec4899;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div></div><div class="stat-card-value">${totalBanners}</div></div>
    `;

    loadRecentRepairs(repairsArr.slice(0, 5));
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
  container.innerHTML = recent.map(r => {
    const statusClass = r.status?.toLowerCase().replace(' ', '-');
    return `<div class="repair-card" style="padding: 12px 0; border: none; border-bottom: 1px solid var(--border-light); border-radius: 0;">
      <div class="repair-info">
        <h3 style="font-size: 14px;">${r.device || ''}</h3>
        <p style="font-size: 12px;">${r.customer || ''} &middot; ${r.phone || ''}</p>
      </div>
      <span class="repair-status status-${statusClass}" style="font-size: 11px;">${r.status || 'Pending'}</span>
    </div>`;
  }).join('');
}

// ===== BANNERS =====
let bannersData = {};
function loadBannersTable() {
  const tbody = document.getElementById('bannersTableBody');
  if (!tbody) return;
  db.ref('banners').on('value', snap => {
    const data = snap.val();
    bannersData = data || {};
    const entries = Object.entries(bannersData).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
    if (entries.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><h3>No banners added yet</h3><p>Click "Add Banner" to create your first banner</p></div></td></tr>';
      return;
    }
    tbody.innerHTML = entries.map(([id, b]) => `
      <tr>
        <td><img class="table-img" src="${b.image || ''}" alt="" loading="lazy" ${b.cropW && b.cropH ? 'style="object-fit:cover;object-position:' + ((b.cropX||0) + (b.cropW||100)/2).toFixed(1) + '% ' + ((b.cropY||0) + (b.cropH||100)/2).toFixed(1) + '%;"' : ''} onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Crect fill=%22%23f3f4f6%22 width=%2240%22 height=%2240%22/%3E%3C/svg%3E'"></td>
        <td>${b.title || ''}</td>
        <td>${b.subtitle || ''}</td>
        <td>${b.btnText || ''}</td>
        <td>${b.order || 0}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-ghost btn-sm" onclick="editBanner('${id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteBanner('${id}')">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  });
}

function openBannerModal() {
  document.getElementById('bannerForm').reset();
  document.getElementById('bannerId').value = '';
  if (document.getElementById('bannerCropX')) {
    document.getElementById('bannerCropX').value = '';
    document.getElementById('bannerCropY').value = '';
    document.getElementById('bannerCropW').value = '';
    document.getElementById('bannerCropH').value = '';
  }
  document.getElementById('bannerModalTitle').textContent = 'Add Banner';
  document.getElementById('bannerSubmitBtn').textContent = 'Save';
  openModal('bannerModal');
  setTimeout(function () { initImagePreview('bannerImage', 'bannerPreviewWrap', 'bannerPreviewImg', 'bannerCropBtn', 'bannerCrop'); }, 100);
}

function editBanner(id) {
  const b = bannersData[id];
  if (!b) return;
  document.getElementById('bannerId').value = id;
  document.getElementById('bannerTitle').value = b.title || '';
  document.getElementById('bannerSubtitle').value = b.subtitle || '';
  document.getElementById('bannerBtnText').value = b.btnText || '';
  document.getElementById('bannerLink').value = b.link || '';
  document.getElementById('bannerImage').value = b.image || '';
  document.getElementById('bannerOrder').value = b.order || 0;
  if (document.getElementById('bannerCropX')) {
    document.getElementById('bannerCropX').value = b.cropX || '';
    document.getElementById('bannerCropY').value = b.cropY || '';
    document.getElementById('bannerCropW').value = b.cropW || '';
    document.getElementById('bannerCropH').value = b.cropH || '';
  }
  document.getElementById('bannerModalTitle').textContent = 'Edit Banner';
  document.getElementById('bannerSubmitBtn').textContent = 'Update';
  openModal('bannerModal');
  setTimeout(function () { initImagePreview('bannerImage', 'bannerPreviewWrap', 'bannerPreviewImg', 'bannerCropBtn', 'bannerCrop'); }, 100);
}

function saveBanner(e) {
  e.preventDefault();
  const id = document.getElementById('bannerId').value;
  const data = {
    title: document.getElementById('bannerTitle').value,
    subtitle: document.getElementById('bannerSubtitle').value,
    btnText: document.getElementById('bannerBtnText').value,
    link: document.getElementById('bannerLink').value,
    image: document.getElementById('bannerImage').value,
    order: parseInt(document.getElementById('bannerOrder').value) || 0
  };
  if (document.getElementById('bannerCropX')) {
    const cx = document.getElementById('bannerCropX').value;
    const cy = document.getElementById('bannerCropY').value;
    const cw = document.getElementById('bannerCropW').value;
    const ch = document.getElementById('bannerCropH').value;
    if (cx && cy && cw && ch) {
      data.cropX = parseFloat(cx);
      data.cropY = parseFloat(cy);
      data.cropW = parseFloat(cw);
      data.cropH = parseFloat(ch);
    }
  }
  const ref = id ? db.ref('banners/' + id) : db.ref('banners').push();
  ref.set(data).then(() => {
    closeModal('bannerModal');
    showToast(id ? 'Banner updated!' : 'Banner added!', 'success');
    logActivity(id ? 'updated' : 'added', 'Banner', data.title);
  }).catch(err => showToast(err.message, 'error'));
}

async function deleteBanner(id) {
  if (!await showConfirmModal('Delete this banner?')) return;
  var name = bannersData[id] ? bannersData[id].title : '';
  db.ref('banners/' + id).remove().then(function () { showToast('Banner deleted', 'success'); logActivity('deleted', 'Banner', name); }).catch(function (err) { showToast(err.message, 'error'); });
}

// ===== SLIDERS =====
let slidersData = {};
function loadSlidersTable() {
  const tbody = document.getElementById('slidersTableBody');
  if (!tbody) return;
  db.ref('sliders').on('value', snap => {
    const data = snap.val();
    slidersData = data || {};
    const entries = Object.entries(slidersData).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
    if (entries.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state"><h3>No sliders added yet</h3></div></td></tr>';
      return;
    }
    tbody.innerHTML = entries.map(([id, s]) => `
      <tr>
        <td><img class="table-img" src="${s.image || ''}" alt="" loading="lazy" ${s.cropW && s.cropH ? 'style="object-fit:cover;object-position:' + ((s.cropX||0) + (s.cropW||100)/2).toFixed(1) + '% ' + ((s.cropY||0) + (s.cropH||100)/2).toFixed(1) + '%;"' : ''} onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Crect fill=%22%23f3f4f6%22 width=%2240%22 height=%2240%22/%3E%3C/svg%3E'"></td>
        <td>${s.title || ''}</td>
        <td>${s.order || 0}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-ghost btn-sm" onclick="editSlider('${id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteSlider('${id}')">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  });
}

function openSliderModal() {
  document.getElementById('sliderForm').reset();
  document.getElementById('sliderId').value = '';
  if (document.getElementById('sliderCropX')) {
    document.getElementById('sliderCropX').value = '';
    document.getElementById('sliderCropY').value = '';
    document.getElementById('sliderCropW').value = '';
    document.getElementById('sliderCropH').value = '';
  }
  document.getElementById('sliderModalTitle').textContent = 'Add Slider';
  document.getElementById('sliderSubmitBtn').textContent = 'Save';
  openModal('sliderModal');
  setTimeout(function () { initImagePreview('sliderImage', 'sliderPreviewWrap', 'sliderPreviewImg', 'sliderCropBtn', 'sliderCrop'); }, 100);
}

function editSlider(id) {
  const s = slidersData[id];
  if (!s) return;
  document.getElementById('sliderId').value = id;
  document.getElementById('sliderTitle').value = s.title || '';
  document.getElementById('sliderImage').value = s.image || '';
  document.getElementById('sliderOrder').value = s.order || 0;
  if (document.getElementById('sliderCropX')) {
    document.getElementById('sliderCropX').value = s.cropX || '';
    document.getElementById('sliderCropY').value = s.cropY || '';
    document.getElementById('sliderCropW').value = s.cropW || '';
    document.getElementById('sliderCropH').value = s.cropH || '';
  }
  document.getElementById('sliderModalTitle').textContent = 'Edit Slider';
  document.getElementById('sliderSubmitBtn').textContent = 'Update';
  openModal('sliderModal');
  setTimeout(function () { initImagePreview('sliderImage', 'sliderPreviewWrap', 'sliderPreviewImg', 'sliderCropBtn', 'sliderCrop'); }, 100);
}

function saveSlider(e) {
  e.preventDefault();
  const id = document.getElementById('sliderId').value;
  const data = {
    title: document.getElementById('sliderTitle').value,
    image: document.getElementById('sliderImage').value,
    order: parseInt(document.getElementById('sliderOrder').value) || 0
  };
  if (document.getElementById('sliderCropX')) {
    const cx = document.getElementById('sliderCropX').value;
    const cy = document.getElementById('sliderCropY').value;
    const cw = document.getElementById('sliderCropW').value;
    const ch = document.getElementById('sliderCropH').value;
    if (cx && cy && cw && ch) {
      data.cropX = parseFloat(cx);
      data.cropY = parseFloat(cy);
      data.cropW = parseFloat(cw);
      data.cropH = parseFloat(ch);
    }
  }
  const ref = id ? db.ref('sliders/' + id) : db.ref('sliders').push();
  ref.set(data).then(() => {
    closeModal('sliderModal');
    showToast(id ? 'Slider updated!' : 'Slider added!', 'success');
    logActivity(id ? 'updated' : 'added', 'Slider', data.title);
  }).catch(err => showToast(err.message, 'error'));
}

async function deleteSlider(id) {
  if (!await showConfirmModal('Delete this slider?')) return;
  var name = slidersData[id] ? slidersData[id].title : '';
  db.ref('sliders/' + id).remove().then(function () { showToast('Slider deleted', 'success'); logActivity('deleted', 'Slider', name); }).catch(function (err) { showToast(err.message, 'error'); });
}

// ===== PROMOTIONS =====
let promotionsData = {};
function loadPromotionsTable() {
  const tbody = document.getElementById('promotionsTableBody');
  if (!tbody) return;
  db.ref('promotions').on('value', snap => {
    const data = snap.val();
    promotionsData = data || {};
    const entries = Object.entries(promotionsData).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
    if (entries.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><h3>No promotions added yet</h3><p>Click "Add Promotion" to create your first promotion</p></div></td></tr>';
      return;
    }
    tbody.innerHTML = entries.map(([id, p]) => `
      <tr>
        <td><img class="table-img" src="${p.image || ''}" alt="" loading="lazy" ${p.cropW && p.cropH ? 'style="object-fit:cover;object-position:' + ((p.cropX||0) + (p.cropW||100)/2).toFixed(1) + '% ' + ((p.cropY||0) + (p.cropH||100)/2).toFixed(1) + '%;"' : ''} onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Crect fill=%22%23f3f4f6%22 width=%2240%22 height=%2240%22/%3E%3C/svg%3E'"></td>
        <td style="font-weight: 600;">${p.title || ''}</td>
        <td>${p.description || ''}</td>
        <td>${p.order || 0}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-ghost btn-sm" onclick="editPromotion('${id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deletePromotion('${id}')">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  });
}

function openPromotionModal() {
  document.getElementById('promotionForm').reset();
  document.getElementById('promotionId').value = '';
  if (document.getElementById('promotionCropX')) {
    document.getElementById('promotionCropX').value = '';
    document.getElementById('promotionCropY').value = '';
    document.getElementById('promotionCropW').value = '';
    document.getElementById('promotionCropH').value = '';
  }
  document.getElementById('promotionModalTitle').textContent = 'Add Promotion';
  document.getElementById('promotionSubmitBtn').textContent = 'Save';
  openModal('promotionModal');
  setTimeout(function () { initImagePreview('promotionImage', 'promotionPreviewWrap', 'promotionPreviewImg', 'promotionCropBtn', 'promotionCrop'); }, 100);
}

function editPromotion(id) {
  const p = promotionsData[id];
  if (!p) return;
  document.getElementById('promotionId').value = id;
  document.getElementById('promotionTitle').value = p.title || '';
  document.getElementById('promotionDescription').value = p.description || '';
  document.getElementById('promotionImage').value = p.image || '';
  document.getElementById('promotionLink').value = p.link || '';
  document.getElementById('promotionOrder').value = p.order || 0;
  if (document.getElementById('promotionCropX')) {
    document.getElementById('promotionCropX').value = p.cropX || '';
    document.getElementById('promotionCropY').value = p.cropY || '';
    document.getElementById('promotionCropW').value = p.cropW || '';
    document.getElementById('promotionCropH').value = p.cropH || '';
  }
  document.getElementById('promotionModalTitle').textContent = 'Edit Promotion';
  document.getElementById('promotionSubmitBtn').textContent = 'Update';
  openModal('promotionModal');
  setTimeout(function () { initImagePreview('promotionImage', 'promotionPreviewWrap', 'promotionPreviewImg', 'promotionCropBtn', 'promotionCrop'); }, 100);
}

function savePromotion(e) {
  e.preventDefault();
  const id = document.getElementById('promotionId').value;
  const data = {
    title: document.getElementById('promotionTitle').value,
    description: document.getElementById('promotionDescription').value,
    image: document.getElementById('promotionImage').value,
    link: document.getElementById('promotionLink').value,
    order: parseInt(document.getElementById('promotionOrder').value) || 0
  };
  if (document.getElementById('promotionCropX')) {
    const cx = document.getElementById('promotionCropX').value;
    const cy = document.getElementById('promotionCropY').value;
    const cw = document.getElementById('promotionCropW').value;
    const ch = document.getElementById('promotionCropH').value;
    if (cx && cy && cw && ch) {
      data.cropX = parseFloat(cx);
      data.cropY = parseFloat(cy);
      data.cropW = parseFloat(cw);
      data.cropH = parseFloat(ch);
    }
  }
  const ref = id ? db.ref('promotions/' + id) : db.ref('promotions').push();
  ref.set(data).then(() => {
    closeModal('promotionModal');
    showToast(id ? 'Promotion updated!' : 'Promotion added!', 'success');
    logActivity(id ? 'updated' : 'added', 'Promotion', data.title);
  }).catch(err => showToast(err.message, 'error'));
}

async function deletePromotion(id) {
  if (!await showConfirmModal('Delete this promotion?')) return;
  var name = promotionsData[id] ? promotionsData[id].title : '';
  db.ref('promotions/' + id).remove().then(function () { showToast('Promotion deleted', 'success'); logActivity('deleted', 'Promotion', name); }).catch(function (err) { showToast(err.message, 'error'); });
}

// ===== BRANDS =====
let brandsData = {};
function openBrandModal() {
  document.getElementById('brandForm').reset();
  document.getElementById('brandId').value = '';
  if (document.getElementById('brandCropX')) {
    document.getElementById('brandCropX').value = '';
    document.getElementById('brandCropY').value = '';
    document.getElementById('brandCropW').value = '';
    document.getElementById('brandCropH').value = '';
  }
  document.getElementById('brandModalTitle').textContent = 'Add Brand';
  document.getElementById('brandSubmitBtn').textContent = 'Save';
  openModal('brandModal');
  setTimeout(function () { initImagePreview('brandLogo', 'brandPreviewWrap', 'brandPreviewImg', 'brandCropBtn', 'brandCrop'); }, 100);
}

function loadBrandsTable() {
  const tbody = document.getElementById('brandsTableBody');
  if (!tbody) return;
  db.ref('brands').on('value', snap => {
    const data = snap.val();
    brandsData = data || {};
    const entries = Object.entries(brandsData);
    if (entries.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3"><div class="empty-state"><h3>No brands added yet</h3></div></td></tr>';
      return;
    }
    tbody.innerHTML = entries.map(([id, b]) => `
      <tr>
        <td>${b.logo ? `<img class="table-img" src="${b.logo}" alt="${b.name}" ${b.cropW && b.cropH ? 'style="object-fit:cover;object-position:' + ((b.cropX||0) + (b.cropW||100)/2).toFixed(1) + '% ' + ((b.cropY||0) + (b.cropH||100)/2).toFixed(1) + '%;"' : ''} onerror="this.style.display='none'">` : '<span style="color:var(--text-muted);font-size:24px;">&lt;/&gt;</span>'}</td>
        <td style="font-weight: 600;">${b.name || ''}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-ghost btn-sm" onclick="editBrand('${id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteBrand('${id}')">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  });
}

function editBrand(id) {
  const b = brandsData[id];
  if (!b) return;
  document.getElementById('brandId').value = id;
  document.getElementById('brandName').value = b.name || '';
  document.getElementById('brandLogo').value = b.logo || '';
  if (document.getElementById('brandCropX')) {
    document.getElementById('brandCropX').value = b.cropX || '';
    document.getElementById('brandCropY').value = b.cropY || '';
    document.getElementById('brandCropW').value = b.cropW || '';
    document.getElementById('brandCropH').value = b.cropH || '';
  }
  document.getElementById('brandModalTitle').textContent = 'Edit Brand';
  document.getElementById('brandSubmitBtn').textContent = 'Update';
  openModal('brandModal');
  setTimeout(function () { initImagePreview('brandLogo', 'brandPreviewWrap', 'brandPreviewImg', 'brandCropBtn', 'brandCrop'); }, 100);
}

function saveBrand(e) {
  e.preventDefault();
  const id = document.getElementById('brandId').value;
  const data = {
    name: document.getElementById('brandName').value,
    logo: document.getElementById('brandLogo').value
  };
  if (document.getElementById('brandCropX')) {
    const cx = document.getElementById('brandCropX').value;
    const cy = document.getElementById('brandCropY').value;
    const cw = document.getElementById('brandCropW').value;
    const ch = document.getElementById('brandCropH').value;
    if (cx && cy && cw && ch) {
      data.cropX = parseFloat(cx);
      data.cropY = parseFloat(cy);
      data.cropW = parseFloat(cw);
      data.cropH = parseFloat(ch);
    }
  }
  const ref = id ? db.ref('brands/' + id) : db.ref('brands').push();
  ref.set(data).then(() => {
    closeModal('brandModal');
    showToast(id ? 'Brand updated!' : 'Brand added!', 'success');
    logActivity(id ? 'updated' : 'added', 'Brand', data.name);
  }).catch(err => showToast(err.message, 'error'));
}

async function deleteBrand(id) {
  if (!await showConfirmModal('Delete this brand?')) return;
  var name = brandsData[id] ? brandsData[id].name : '';
  db.ref('brands/' + id).remove().then(function () { showToast('Brand deleted', 'success'); logActivity('deleted', 'Brand', name); }).catch(function (err) { showToast(err.message, 'error'); });
}

// ===== SUB BANNERS =====
let subBannersData = {};
function loadSubBannersTable() {
  const tbody = document.getElementById('subBannersTableBody');
  if (!tbody) return;
  db.ref('subBanners').on('value', snap => {
    const data = snap.val();
    subBannersData = data || {};
    if (!data) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><h3>No sub banners yet</h3></div></td></tr>';
      return;
    }
    const entries = Object.entries(data);
    tbody.innerHTML = entries.map(([id, sb]) => {
      const cropStyle = sb.cropW && sb.cropH ? ' style="object-fit:cover;object-position:' + ((sb.cropX || 0) + (sb.cropW || 100) / 2).toFixed(1) + '% ' + ((sb.cropY || 0) + (sb.cropH || 100) / 2).toFixed(1) + '%;"' : '';
      const statusHtml = sb.active === false
        ? '<span class="badge badge-inactive">Inactive</span>'
        : '<span class="badge badge-active">Active</span>';
      return '<tr><td>' + (sb.image ? '<img src="' + sb.image + '" alt="" class="table-thumb"' + cropStyle + '>' : '—') + '</td><td style="font-weight:600;">' + (sb.title || '') + '</td><td style="color:var(--on-surface-variant);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (sb.description || '') + '</td><td>' + statusHtml + '</td><td>' + (sb.order || 0) + '</td><td><div class="table-actions"><button class="btn btn-sm btn-outline" onclick="editSubBanner(\'' + id + '\')">Edit</button><button class="btn btn-sm ' + (sb.active === false ? 'btn-success' : 'btn-warning') + '" onclick="toggleSubBanner(\'' + id + '\')">' + (sb.active === false ? 'Activate' : 'Deactivate') + '</button><button class="btn btn-sm btn-danger" onclick="deleteSubBanner(\'' + id + '\')">Delete</button></div></td></tr>';
    }).join('');
  });
}

function openSubBannerModal() {
  document.getElementById('subBannerForm').reset();
  document.getElementById('subBannerId').value = '';
  document.getElementById('subBannerModalTitle').textContent = 'Add Sub Banner';
  document.getElementById('subBannerSubmitBtn').textContent = 'Save';
  document.getElementById('subBannerActive').checked = true;
  document.getElementById('subBannerActiveLabel').textContent = 'Active';
  document.getElementById('subBannerPreviewWrap').classList.remove('has-image');
  openModal('subBannerModal');
}

function editSubBanner(id) {
  const sb = subBannersData[id];
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
  const data = {
    title: document.getElementById('subBannerTitle').value,
    description: document.getElementById('subBannerDescription').value,
    image: document.getElementById('subBannerImage').value,
    active: document.getElementById('subBannerActive').checked,
    order: parseInt(document.getElementById('subBannerOrder').value) || 0
  };
  if (document.getElementById('subBannerCropX')) {
    const cx = document.getElementById('subBannerCropX').value;
    const cy = document.getElementById('subBannerCropY').value;
    const cw = document.getElementById('subBannerCropW').value;
    const ch = document.getElementById('subBannerCropH').value;
    if (cx && cy && cw && ch) {
      data.cropX = parseFloat(cx);
      data.cropY = parseFloat(cy);
      data.cropW = parseFloat(cw);
      data.cropH = parseFloat(ch);
    }
  }
  const ref = id ? db.ref('subBanners/' + id) : db.ref('subBanners').push();
  ref.set(data).then(() => {
    closeModal('subBannerModal');
    showToast(id ? 'Sub banner updated!' : 'Sub banner added!', 'success');
    logActivity(id ? 'updated' : 'added', 'Sub Banner', data.title);
  }).catch(err => showToast(err.message, 'error'));
}

function toggleSubBanner(id) {
  const sb = subBannersData[id];
  if (!sb) return;
  const newActive = sb.active === false ? true : false;
  db.ref('subBanners/' + id + '/active').set(newActive).then(function () {
    showToast(newActive ? 'Sub banner activated' : 'Sub banner deactivated', 'success');
    logActivity(newActive ? 'activated' : 'deactivated', 'Sub Banner', sb.title);
  }).catch(function (err) { showToast(err.message, 'error'); });
}

async function deleteSubBanner(id) {
  if (!await showConfirmModal('Delete this sub banner?')) return;
  var name = subBannersData[id] ? subBannersData[id].title : '';
  db.ref('subBanners/' + id).remove().then(function () { showToast('Sub banner deleted', 'success'); logActivity('deleted', 'Sub Banner', name); }).catch(function (err) { showToast(err.message, 'error'); });
}

// ===== PRODUCTS =====
let productsData = {};
function loadProductsTable() {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;
  db.ref('products').on('value', snap => {
    const data = snap.val();
    productsData = data || {};
    filterProductsTable();
  });
}

function filterProductsTable() {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;
  const search = (document.getElementById('productSearchInput')?.value || '').toLowerCase();
  const catFilter = document.getElementById('productCategoryFilter')?.value || 'all';
  const entries = Object.entries(productsData).filter(([id, p]) => {
    if (catFilter !== 'all' && p.category !== catFilter) return false;
    if (search && !p.name?.toLowerCase().includes(search) && !p.brand?.toLowerCase().includes(search)) return false;
    return true;
  });
  if (entries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9"><div class="empty-state"><h3>No products found</h3></div></td></tr>';
    return;
  }
  tbody.innerHTML = entries.map(([id, p]) => `
    <tr>
      <td><img class="table-img" src="${p.image || ''}" alt="" loading="lazy" ${p.cropW && p.cropH ? 'style="object-fit:cover;object-position:' + ((p.cropX||0) + (p.cropW||100)/2).toFixed(1) + '% ' + ((p.cropY||0) + (p.cropH||100)/2).toFixed(1) + '%;"' : ''} onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Crect fill=%22%23f3f4f6%22 width=%2240%22 height=%2240%22/%3E%3C/svg%3E'"></td>
      <td style="font-weight: 600;">${p.name || ''}</td>
      <td>${p.brand || ''}</td>
      <td><span class="badge badge-orange">${p.category || ''}</span></td>
      <td>₹${Number(p.price || 0).toLocaleString()}</td>
      <td><span class="badge ${p.stock === 'In Stock' ? 'badge-green' : 'badge-red'}">${p.stock || ''}</span></td>
      <td>${p.featured === 'yes' ? '<span class="badge badge-blue">Featured</span>' : ''}</td>
      <td>${p.url ? '<a href="' + p.url + '" target="_blank" class="badge badge-blue" style="text-decoration:none;">Link</a>' : ''}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-ghost btn-sm" onclick="editProduct('${id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct('${id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openProductModal() {
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';
  if (document.getElementById('productCropX')) {
    document.getElementById('productCropX').value = '';
    document.getElementById('productCropY').value = '';
    document.getElementById('productCropW').value = '';
    document.getElementById('productCropH').value = '';
  }
  document.getElementById('productModalTitle').textContent = 'Add Product';
  document.getElementById('productSubmitBtn').textContent = 'Save';
  openModal('productModal');
  setTimeout(function () { initImagePreview('productImage', 'productPreviewWrap', 'productPreviewImg', 'productCropBtn', 'productCrop'); }, 100);
}

function editProduct(id) {
  const p = productsData[id];
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
  if (document.getElementById('productCropX')) {
    document.getElementById('productCropX').value = p.cropX || '';
    document.getElementById('productCropY').value = p.cropY || '';
    document.getElementById('productCropW').value = p.cropW || '';
    document.getElementById('productCropH').value = p.cropH || '';
  }
  document.getElementById('productModalTitle').textContent = 'Edit Product';
  document.getElementById('productSubmitBtn').textContent = 'Update';
  openModal('productModal');
  setTimeout(function () { initImagePreview('productImage', 'productPreviewWrap', 'productPreviewImg', 'productCropBtn', 'productCrop'); }, 100);
}

function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('productId').value;
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
  if (document.getElementById('productCropX')) {
    const cx = document.getElementById('productCropX').value;
    const cy = document.getElementById('productCropY').value;
    const cw = document.getElementById('productCropW').value;
    const ch = document.getElementById('productCropH').value;
    if (cx && cy && cw && ch) {
      data.cropX = parseFloat(cx);
      data.cropY = parseFloat(cy);
      data.cropW = parseFloat(cw);
      data.cropH = parseFloat(ch);
    }
  }
  if (!id) data.createdAt = Date.now();
  const ref = id ? db.ref('products/' + id) : db.ref('products').push();
  ref.set(data).then(() => {
    closeModal('productModal');
    showToast(id ? 'Product updated!' : 'Product added!', 'success');
    logActivity(id ? 'updated' : 'added', 'Product', data.name);
  }).catch(err => showToast(err.message, 'error'));
}

async function deleteProduct(id) {
  if (!await showConfirmModal('Delete this product?')) return;
  var name = productsData[id] ? productsData[id].name : '';
  db.ref('products/' + id).remove().then(function () { showToast('Product deleted', 'success'); logActivity('deleted', 'Product', name); }).catch(function (err) { showToast(err.message, 'error'); });
}

// ===== REPAIRS =====
let repairsData = {};
function loadRepairsTable() {
  const tbody = document.getElementById('repairsTableBody');
  if (!tbody) return;
  db.ref('repairs').on('value', snap => {
    const data = snap.val();
    repairsData = data || {};
    filterRepairs();
  });
}

function filterRepairs() {
  const tbody = document.getElementById('repairsTableBody');
  if (!tbody) return;
  const search = (document.getElementById('repairSearchInput')?.value || '').toLowerCase();
  const entries = Object.entries(repairsData).filter(([id, r]) => {
    if (search && !r.phone?.includes(search) && !r.customer?.toLowerCase().includes(search)) return false;
    return true;
  }).reverse();
  if (entries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><h3>No repairs found</h3></div></td></tr>';
    return;
  }
  tbody.innerHTML = entries.map(([id, r]) => {
    const statusClass = r.status?.toLowerCase().replace(' ', '-');
    return `
      <tr>
        <td style="font-weight: 600;">${r.phone || ''}</td>
        <td>${r.customer || ''}</td>
        <td>${r.device || ''}</td>
        <td>${r.issue || ''}</td>
        <td>₹${Number(r.cost || 0).toLocaleString()}</td>
        <td><span class="badge badge-orange">${r.status || 'Pending'}</span></td>
        <td style="font-size: 12px; color: var(--text-muted);">${r.lastUpdated || ''}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-ghost btn-sm" onclick="editRepair('${id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteRepair('${id}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openRepairModal() {
  document.getElementById('repairForm').reset();
  document.getElementById('repairId').value = '';
  document.getElementById('repairModalTitle').textContent = 'Add Repair';
  document.getElementById('repairSubmitBtn').textContent = 'Save';
  openModal('repairModal');
}

function editRepair(id) {
  const r = repairsData[id];
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
  const ref = id ? db.ref('repairs/' + id) : db.ref('repairs').push();
  ref.set(data).then(() => {
    closeModal('repairModal');
    showToast(id ? 'Repair updated!' : 'Repair added!', 'success');
    logActivity(id ? 'updated' : 'added', 'Repair', data.customer);
  }).catch(err => showToast(err.message, 'error'));
}

async function deleteRepair(id) {
  if (!await showConfirmModal('Delete this repair record?')) return;
  var name = repairsData[id] ? repairsData[id].customer : '';
  db.ref('repairs/' + id).remove().then(function () { showToast('Repair deleted', 'success'); logActivity('deleted', 'Repair', name); }).catch(function (err) { showToast(err.message, 'error'); });
}

// ===== NOTIFICATIONS =====
function loadNotificationsTable() {
  const tbody = document.getElementById('notificationsTableBody');
  if (!tbody) return;
  db.ref('notifications').on('value', snap => {
    const data = snap.val();
    if (!data) {
      tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state"><h3>No notifications sent yet</h3></div></td></tr>';
      return;
    }
    const entries = Object.entries(data).reverse();
    tbody.innerHTML = entries.map(([id, n]) => `
      <tr>
        <td style="font-weight: 600;">${n.title || ''}</td>
        <td>${n.message || ''}</td>
        <td style="font-size: 12px; color: var(--text-muted);">${n.date || ''} ${n.time || ''}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-danger btn-sm" onclick="deleteNotification('${id}')">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
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
  db.ref('notifications').push(data).then(function () {
    document.getElementById('notifPushTitle').value = '';
    document.getElementById('notifPushMessage').value = '';
    showToast('Notification sent!', 'success');
    logActivity('sent', 'Notification', title);
    btn.disabled = false;
    btn.textContent = 'Send Notification';
  }).catch(function (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Send Notification';
  });
}

async function deleteNotification(id) {
  if (!await showConfirmModal('Delete this notification?')) return;
  db.ref('notifications/' + id).remove().then(function () { showToast('Notification deleted', 'success'); logActivity('deleted', 'Notification', ''); }).catch(function (err) { showToast(err.message, 'error'); });
}

// ===== STORE SETTINGS =====
function loadStoreSettings() {
  db.ref('settings').once('value', snap => {
    const s = snap.val();
    if (!s) return;
    if (s.name) document.getElementById('storeName').value = s.name;
    if (s.logo) document.getElementById('storeLogo').value = s.logo;
    if (s.phone) document.getElementById('storePhone').value = s.phone;
    if (s.email) document.getElementById('storeEmail').value = s.email;
    if (s.address) document.getElementById('storeAddress').value = s.address;
    if (s.map) document.getElementById('storeMap').value = s.map;
    if (s.hours) document.getElementById('storeHours').value = s.hours;
    if (s.primaryColor) document.getElementById('primaryColor').value = s.primaryColor;
    if (s.secondaryColor) document.getElementById('secondaryColor').value = s.secondaryColor;
  });
}

function saveStoreSettings(e) {
  e.preventDefault();
  const data = {
    name: document.getElementById('storeName').value,
    logo: document.getElementById('storeLogo').value,
    phone: document.getElementById('storePhone').value,
    email: document.getElementById('storeEmail').value,
    address: document.getElementById('storeAddress').value,
    map: document.getElementById('storeMap').value,
    hours: document.getElementById('storeHours').value
  };
  db.ref('settings').update(data).then(() => {
    loadAdminLogo();
    showToast('Settings saved!', 'success');
    logActivity('updated', 'Store Settings', '');
  }).catch(err => showToast(err.message, 'error'));
}

function saveThemeSettings(e) {
  e.preventDefault();
  const data = {
    primaryColor: document.getElementById('primaryColor').value,
    secondaryColor: document.getElementById('secondaryColor').value
  };
  db.ref('settings').update(data).then(() => {
    showToast('Theme settings saved!', 'success');
    logActivity('updated', 'Theme Settings', '');
  }).catch(err => showToast(err.message, 'error'));
}

// ===== IMAGE PREVIEW & CROP TOOL =====
// cropState shared across all crop instances
const cropState = {
  active: false,
  startX: 0, startY: 0,
  currentX: 0, currentY: 0,
  img: null,
  imgNaturalW: 0, imgNaturalH: 0,
  imgDisplayW: 0, imgDisplayH: 0,
  imgOffsetX: 0, imgOffsetY: 0,
  onApply: null,
  cropDataId: null,
  dragging: false,
  dragMode: null,  // 'move', 'nw', 'ne', 'sw', 'se'
  dragOrigX: 0, dragOrigY: 0,
  selOrigX: 0, selOrigY: 0, selOrigW: 0, selOrigH: 0,
  ratioLock: 0   // 0 = free, 16/9 = 16:9 locked
};

function initImagePreview(inputId, previewWrapId, previewImgId, cropBtnId, cropDataPrefix, loadCropFn) {
  const input = document.getElementById(inputId);
  const wrap = document.getElementById(previewWrapId);
  const img = document.getElementById(previewImgId);
  if (!input || !wrap || !img) return;

  function updatePreview() {
    const url = input.value.trim();
    if (url) {
      img.src = url;
      wrap.classList.add('has-image');
      if (loadCropFn) loadCropFn();
    } else {
      img.removeAttribute('src');
      wrap.classList.remove('has-image');
    }
  }

  input.addEventListener('input', updatePreview);
  updatePreview();

  if (cropBtnId) {
    const btn = document.getElementById(cropBtnId);
    if (btn) {
      btn.addEventListener('click', function () {
        const url = input.value.trim();
        if (!url) { showToast('Enter an image URL first', 'error'); return; }
        openCropTool(url, cropDataPrefix, function (data) {
          setCropData(cropDataPrefix, data);
          showToast('Crop applied', 'success');
        });
      });
    }
  }
}

function setCropData(prefix, data) {
  if (!data) {
    const xEl = document.getElementById(prefix + 'X');
    const yEl = document.getElementById(prefix + 'Y');
    const wEl = document.getElementById(prefix + 'W');
    const hEl = document.getElementById(prefix + 'H');
    if (xEl) xEl.value = '';
    if (yEl) yEl.value = '';
    if (wEl) wEl.value = '';
    if (hEl) hEl.value = '';
    return;
  }
  const xEl = document.getElementById(prefix + 'X');
  const yEl = document.getElementById(prefix + 'Y');
  const wEl = document.getElementById(prefix + 'W');
  const hEl = document.getElementById(prefix + 'H');
  if (xEl) xEl.value = data.x !== undefined ? data.x : '';
  if (yEl) yEl.value = data.y !== undefined ? data.y : '';
  if (wEl) wEl.value = data.w !== undefined ? data.w : '';
  if (hEl) hEl.value = data.h !== undefined ? data.h : '';
}

function getCropData(prefix) {
  const x = parseFloat(document.getElementById(prefix + 'X')?.value);
  const y = parseFloat(document.getElementById(prefix + 'Y')?.value);
  const w = parseFloat(document.getElementById(prefix + 'W')?.value);
  const h = parseFloat(document.getElementById(prefix + 'H')?.value);
  if (isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h)) return null;
  return { x, y, w, h };
}

function cropStyle(prefix) {
  const data = getCropData(prefix);
  if (!data || !data.w || !data.h) return '';
  const cx = data.x + data.w / 2;
  const cy = data.y + data.h / 2;
  return 'style="object-fit:cover;object-position:' + cx.toFixed(1) + '% ' + cy.toFixed(1) + '%;"';
}

function cropContainerStyle(prefix) {
  const data = getCropData(prefix);
  if (!data || !data.w || !data.h) return '';
  const padX = (100 / data.w - 1) / 2 * 100;
  const padY = (100 / data.h - 1) / 2 * 100;
  const cx = data.x + data.w / 2;
  const cy = data.y + data.h / 2;
  var px = (50 - cx * (100 / data.w)) / (1 + padX / 50) + 50;
  var py = (50 - cy * (100 / data.h)) / (1 + padY / 50) + 50;
  return 'style="overflow:hidden;background-size:0;"';
}

function initCropOverlay() {
  if (document.getElementById('cropOverlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'cropOverlay';
  overlay.className = 'crop-overlay';
  overlay.innerHTML = `
    <div class="crop-modal">
      <div class="crop-modal-header">
        <span class="crop-modal-title">Crop Image</span>
        <button class="crop-modal-close" onclick="closeCropTool()" aria-label="Close" type="button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="crop-modal-body" id="cropBody">
        <img id="cropImg" src="" alt="Crop preview" draggable="false">
        <div class="crop-selection" id="cropSelection">
          <div class="crop-selection-handle nw"></div>
          <div class="crop-selection-handle ne"></div>
          <div class="crop-selection-handle sw"></div>
          <div class="crop-selection-handle se"></div>
        </div>
      </div>
      <div class="crop-modal-footer">
        <div class="crop-info" id="cropInfo">Click & drag to select crop area</div>
        <div class="crop-actions">
          <button class="btn btn-ghost btn-ratio" type="button" id="ratioLockBtn" onclick="toggleRatioLock()">16:9</button>
          <button class="btn btn-ghost" type="button" onclick="resetCropSelection()">Reset</button>
          <button class="btn btn-primary" type="button" onclick="applyCrop()">Apply Crop</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const body = document.getElementById('cropBody');
  const sel = document.getElementById('cropSelection');

  body.addEventListener('mousedown', function (e) {
    if (e.button !== 0) return;
    const rect = body.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (cropState.active && isInsideSelection(mx, my)) {
      startDragMove(e);
    } else {
      if (e.target.closest('.crop-selection-handle')) return;
      startNewSelection(e);
    }
  });

  document.addEventListener('mousemove', function (e) {
    if (!cropState.dragging) return;
    const rect = body.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (cropState.dragMode === 'new') {
      dragNewSelection(mx, my);
    } else {
      dragExistingSelection(mx, my);
    }
  });

  document.addEventListener('mouseup', function () {
    if (cropState.dragging) {
      cropState.dragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });

  body.addEventListener('mousedown', function (e) {
    const handle = e.target.closest('.crop-selection-handle');
    if (handle) {
      e.preventDefault();
      e.stopPropagation();
      const cls = handle.className;
      if (cls.includes('nw')) startResize(e, 'nw');
      else if (cls.includes('ne')) startResize(e, 'ne');
      else if (cls.includes('sw')) startResize(e, 'sw');
      else if (cls.includes('se')) startResize(e, 'se');
    }
  });
}

function openCropTool(imageUrl, cropDataId, onApply) {
  initCropOverlay();
  const overlay = document.getElementById('cropOverlay');
  const img = document.getElementById('cropImg');
  const sel = document.getElementById('cropSelection');

  cropState.onApply = onApply;
  cropState.cropDataId = cropDataId;
  cropState.active = false;
  sel.style.display = 'none';

  img.onload = function () {
    cropState.img = img;
    cropState.imgNaturalW = img.naturalWidth;
    cropState.imgNaturalH = img.naturalHeight;
    updateCropImageMetrics();

    var existingData = getCropData(cropDataId);
    if (existingData && existingData.w > 0 && existingData.h > 0) {
      var selW = existingData.w / 100 * cropState.imgDisplayW;
      var selH = existingData.h / 100 * cropState.imgDisplayH;
      var selX = cropState.imgOffsetX + existingData.x / 100 * cropState.imgDisplayW;
      var selY = cropState.imgOffsetY + existingData.y / 100 * cropState.imgDisplayH;
      showSelection(selX, selY, selW, selH);
    }

    document.getElementById('cropInfo').textContent = 'Click & drag to select crop area';
  };

  img.src = imageUrl;
  overlay.classList.add('open');
}

function updateCropImageMetrics() {
  const img = cropState.img;
  const body = document.getElementById('cropBody');
  if (!img || !body) return;
  const bodyRect = body.getBoundingClientRect();
  const imgRect = img.getBoundingClientRect();
  cropState.imgDisplayW = imgRect.width;
  cropState.imgDisplayH = imgRect.height;
  cropState.imgOffsetX = imgRect.left - bodyRect.left;
  cropState.imgOffsetY = imgRect.top - bodyRect.top;
}

function closeCropTool() {
  const overlay = document.getElementById('cropOverlay');
  if (overlay) overlay.classList.remove('open');
  cropState.active = false;
  cropState.dragging = false;
  cropState.onApply = null;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
}

function isInsideSelection(mx, my) {
  const sel = document.getElementById('cropSelection');
  if (!sel || sel.style.display === 'none') return false;
  var r = sel.getBoundingClientRect();
  var body = document.getElementById('cropBody');
  var bodyRect = body.getBoundingClientRect();
  var sx = r.left - bodyRect.left;
  var sy = r.top - bodyRect.top;
  var sw = r.width;
  var sh = r.height;
  var pad = 8;
  return mx >= sx - pad && mx <= sx + sw + pad && my >= sy - pad && my <= sy + sh + pad;
}

function startNewSelection(e) {
  const body = document.getElementById('cropBody');
  const rect = body.getBoundingClientRect();
  cropState.startX = e.clientX - rect.left;
  cropState.startY = e.clientY - rect.top;
  cropState.dragging = true;
  cropState.dragMode = 'new';
  cropState.active = true;
  document.body.style.cursor = 'crosshair';
  document.body.style.userSelect = 'none';
}

function toggleRatioLock() {
  cropState.ratioLock = cropState.ratioLock ? 0 : 16 / 9;
  var btn = document.getElementById('ratioLockBtn');
  if (btn) {
    btn.classList.toggle('active', cropState.ratioLock > 0);
    btn.textContent = cropState.ratioLock ? '16:9 ✓' : '16:9';
  }
  if (cropState.active && cropState.ratioLock) {
    // Re-apply ratio to existing selection
    var sel = document.getElementById('cropSelection');
    if (sel && sel.style.display !== 'none') {
      var r = sel.getBoundingClientRect();
      var body = document.getElementById('cropBody');
      if (body) {
        var bodyRect = body.getBoundingClientRect();
        var sx = r.left - bodyRect.left;
        var sy = r.top - bodyRect.top;
        constrainSelectionToRatio(sx, sy, r.width, r.height);
      }
    }
  }
}

function constrainSelectionToRatio(x, y, w, h) {
  var ratio = cropState.ratioLock;
  if (!ratio) return;
  updateCropImageMetrics();
  var iw = cropState.imgDisplayW;
  var ih = cropState.imgDisplayH;
  if (iw <= 0) return;
  // Center within current selection
  if (w / h > ratio) {
    var newH = w / ratio;
    y = y + (h - newH) / 2;
    h = newH;
  } else {
    var newW = h * ratio;
    x = x + (w - newW) / 2;
    w = newW;
  }
  showSelection(x, y, w, h);
}

function dragNewSelection(mx, my) {
  var x = Math.min(cropState.startX, mx);
  var y = Math.min(cropState.startY, my);
  var w = Math.abs(mx - cropState.startX);
  var h = Math.abs(my - cropState.startY);
  w = Math.max(w, 20);
  h = Math.max(h, 20);
  if (cropState.ratioLock) {
    var ratio = cropState.ratioLock;
    if (w / h >= ratio) {
      h = w / ratio;
    } else {
      w = h * ratio;
    }
    if (mx < cropState.startX) x = cropState.startX - w;
    if (my < cropState.startY) y = cropState.startY - h;
  }
  showSelection(x, y, w, h);
}

function startDragMove(e) {
  const sel = document.getElementById('cropSelection');
  const r = sel.getBoundingClientRect();
  const body = document.getElementById('cropBody');
  const bodyRect = body.getBoundingClientRect();
  cropState.dragging = true;
  cropState.dragMode = 'move';
  cropState.dragOrigX = e.clientX;
  cropState.dragOrigY = e.clientY;
  cropState.selOrigX = r.left - bodyRect.left;
  cropState.selOrigY = r.top - bodyRect.top;
  cropState.selOrigW = r.width;
  cropState.selOrigH = r.height;
  document.body.style.cursor = 'move';
  document.body.style.userSelect = 'none';
}

function startResize(e, corner) {
  e.preventDefault();
  e.stopPropagation();
  const sel = document.getElementById('cropSelection');
  const r = sel.getBoundingClientRect();
  const body = document.getElementById('cropBody');
  const bodyRect = body.getBoundingClientRect();
  cropState.dragging = true;
  cropState.dragMode = corner;
  cropState.dragOrigX = e.clientX;
  cropState.dragOrigY = e.clientY;
  cropState.selOrigX = r.left - bodyRect.left;
  cropState.selOrigY = r.top - bodyRect.top;
  cropState.selOrigW = r.width;
  cropState.selOrigH = r.height;
  document.body.style.cursor = corner + '-resize';
  document.body.style.userSelect = 'none';
}

function dragExistingSelection(mx, my) {
  var dx = mx - cropState.dragOrigX;
  var dy = my - cropState.dragOrigY;

  if (cropState.dragMode === 'move') {
    var newX = cropState.selOrigX + dx;
    var newY = cropState.selOrigY + dy;
    showSelection(newX, newY, cropState.selOrigW, cropState.selOrigH);
    return;
  }

  var x = cropState.selOrigX, y = cropState.selOrigY, w = cropState.selOrigW, h = cropState.selOrigH;

  if (cropState.ratioLock) {
    var ratio = cropState.ratioLock;
    switch (cropState.dragMode) {
      case 'se':
        w = Math.max(20, cropState.selOrigW + dx);
        h = w / ratio;
        break;
      case 'ne':
        w = Math.max(20, cropState.selOrigW + dx);
        h = w / ratio;
        y = cropState.selOrigY + cropState.selOrigH - h;
        break;
      case 'sw':
        w = Math.max(20, cropState.selOrigW - dx);
        h = w / ratio;
        x = cropState.selOrigX + cropState.selOrigW - w;
        break;
      case 'nw':
        w = Math.max(20, cropState.selOrigW - dx);
        h = w / ratio;
        x = cropState.selOrigX + cropState.selOrigW - w;
        y = cropState.selOrigY + cropState.selOrigH - h;
        break;
    }
  } else {
    if (cropState.dragMode === 'nw' || cropState.dragMode === 'ne' || cropState.dragMode === 'sw') {
      if (cropState.dragMode === 'nw') { x = cropState.selOrigX + dx; y = cropState.selOrigY + dy; w = cropState.selOrigW - dx; h = cropState.selOrigH - dy; }
      if (cropState.dragMode === 'ne') { y = cropState.selOrigY + dy; w = cropState.selOrigW + dx; h = cropState.selOrigH - dy; }
      if (cropState.dragMode === 'sw') { x = cropState.selOrigX + dx; w = cropState.selOrigW - dx; h = cropState.selOrigH + dy; }
    } else if (cropState.dragMode === 'se') {
      w = cropState.selOrigW + dx;
      h = cropState.selOrigH + dy;
    }
  }

  if (w < 20) { if (cropState.dragMode === 'nw' || cropState.dragMode === 'sw') x = cropState.selOrigX + cropState.selOrigW - 20; w = 20; }
  if (h < 20) { if (cropState.dragMode === 'nw' || cropState.dragMode === 'ne') y = cropState.selOrigY + cropState.selOrigH - 20; h = 20; }

  showSelection(x, y, w, h);
}

function showSelection(x, y, w, h) {
  const sel = document.getElementById('cropSelection');
  const body = document.getElementById('cropBody');
  if (!sel || !body) return;
  updateCropImageMetrics();
  var iw = cropState.imgDisplayW;
  var ih = cropState.imgDisplayH;
  var ox = cropState.imgOffsetX;
  var oy = cropState.imgOffsetY;

  if (isNaN(iw) || iw <= 0) return;

  x = Math.max(ox, Math.min(ox + iw - w, x));
  y = Math.max(oy, Math.min(oy + ih - h, y));
  w = Math.min(w, iw);
  h = Math.min(h, ih);

  sel.style.left = x + 'px';
  sel.style.top = y + 'px';
  sel.style.width = w + 'px';
  sel.style.height = h + 'px';
  sel.style.display = 'block';
  cropState.active = true;

  var pX = ((x - ox) / iw * 100).toFixed(1);
  var pY = ((y - oy) / ih * 100).toFixed(1);
  var pW = (w / iw * 100).toFixed(1);
  var pH = (h / ih * 100).toFixed(1);
  document.getElementById('cropInfo').textContent = 'Selection: ' + pW + '% × ' + pH + '%; Position: ' + pX + '%, ' + pY + '%';
}

function resetCropSelection() {
  const sel = document.getElementById('cropSelection');
  sel.style.display = 'none';
  cropState.active = false;
  document.getElementById('cropInfo').textContent = 'Click & drag to select crop area';
  setCropData(cropState.cropDataId, null);
}

function applyCrop() {
  if (!cropState.active) {
    showToast('Please select a crop area first', 'error');
    return;
  }
  const sel = document.getElementById('cropSelection');
  const body = document.getElementById('cropBody');
  updateCropImageMetrics();
  var iw = cropState.imgDisplayW;
  var ih = cropState.imgDisplayH;
  var ox = cropState.imgOffsetX;
  var oy = cropState.imgOffsetY;

  if (isNaN(iw) || iw <= 0) { showToast('Error calculating crop', 'error'); return; }

  var rect = sel.getBoundingClientRect();
  var bodyRect = body.getBoundingClientRect();
  var sx = rect.left - bodyRect.left - ox;
  var sy = rect.top - bodyRect.top - oy;

  var data = {
    x: Math.max(0, sx / iw * 100),
    y: Math.max(0, sy / ih * 100),
    w: Math.min(100, rect.width / iw * 100),
    h: Math.min(100, rect.height / ih * 100)
  };

  if (data.w < 1 || data.h < 1) { showToast('Crop area too small', 'error'); return; }

  if (cropState.onApply) cropState.onApply(data);
  closeCropTool();
}
