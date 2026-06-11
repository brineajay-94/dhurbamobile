let allProducts = [];
let allBrands = [];
let currentCategory = 'Mobile Phones';
let selectedBrand = null;
let sliderInterval;

document.addEventListener('DOMContentLoaded', function () {
  loadTheme();
  loadSettings();
  loadBanners();
  loadTrending();
  loadBrands();
  loadProducts();
  loadPromotions();
  loadSubBanners();
  loadNotifications();
  loadFooterSettings();

  const path = window.location.pathname;
  if (path.includes('repairs')) { loadAllRepairs(); }
  if (path.includes('about')) { loadAboutSettings(); }
  if (path.includes('notifications')) { loadNotificationsPage(); }

  setupCarouselDrag();
  setTimeout(autoRequestNotification, 3000);
});

// ===== CROP HELPER =====
function cropImgStyle(item) {
  if (item && item.cropW && item.cropH) {
    var cx = ((item.cropX || 0) + (item.cropW || 100) / 2).toFixed(1);
    var cy = ((item.cropY || 0) + (item.cropH || 100) / 2).toFixed(1);
    return ' style="object-fit:cover;object-position:' + cx + '% ' + cy + '%;"';
  }
  return '';
}

// ===== THEME =====
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  const themeIcon = document.getElementById('themeIcon');
  if (isDark) {
    themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  } else {
    themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  }
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function loadTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved === 'dark' || (saved === 'auto' && prefersDark);
  if (isDark) document.documentElement.classList.add('dark');
  updateThemeUI(saved);
}

function setThemeMode(mode) {
  localStorage.setItem('theme', mode);
  if (mode === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (mode === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', prefersDark);
  }
  document.querySelectorAll('.theme-option').forEach(el => el.classList.toggle('active', el.dataset.theme === mode));
  updateThemeIcon();
}

function updateThemeUI(mode) {
  document.querySelectorAll('.theme-option').forEach(el => el.classList.toggle('active', el.dataset.theme === mode));
  updateThemeIcon();
}

function updateThemeIcon() {
  const icon = document.getElementById('themeIcon');
  if (!icon) return;
  const isDark = document.documentElement.classList.contains('dark');
  icon.innerHTML = isDark
    ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
    : '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
}

function setAccentColor(color) {
  document.documentElement.style.setProperty('--primary', color);
  document.documentElement.style.setProperty('--primary-light', color + '33');
  document.documentElement.style.setProperty('--primary-dark', color + '99');
  document.documentElement.style.setProperty('--primary-bg', color + '14');
  localStorage.setItem('accentColor', color);
  document.querySelectorAll('.color-opt').forEach(el => el.classList.toggle('active', el.dataset.color === color));
}

function loadAccentColor() {
  const color = localStorage.getItem('accentColor');
  if (color) setAccentColor(color);
}

// ===== MOBILE MENU =====
function toggleMobileMenu() {
  document.getElementById('mainNav').classList.toggle('open');
}

document.addEventListener('click', function (e) {
  const nav = document.getElementById('mainNav');
  const btn = document.querySelector('.mobile-menu-btn');
  if (nav && nav.classList.contains('open') && !nav.contains(e.target) && !btn?.contains(e.target)) {
    nav.classList.remove('open');
  }
});

// ===== TOAST =====
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 3500);
}

// ===== BANNERS =====
function loadBanners() {
  const slider = document.getElementById('heroSlider');
  if (!slider) return;
  db.ref('banners').on('value', snap => {
    const data = snap.val();
    if (!data) return;
    const banners = Object.values(data).sort((a, b) => (a.order || 0) - (b.order || 0));
    if (banners.length === 0) return;
    let html = '';
    banners.forEach((b, i) => {
      html += '<div class="hero-slide' + (i === 0 ? ' active' : '') + '">';
      var bgPos = '';
      if (b.cropW && b.cropH) {
        var cx = ((b.cropX || 0) + (b.cropW || 100) / 2).toFixed(1);
        var cy = ((b.cropY || 0) + (b.cropH || 100) / 2).toFixed(1);
        bgPos = ';background-position:' + cx + '% ' + cy + '%;background-size:cover;';
      }
      html += '<div class="hero-slide-bg" style="background-image: url(\'' + b.image + '\')' + bgPos + '"></div>';
      html += '<div class="hero-label">' + (b.title || '') + '</div>';
      html += '</div>';
    });
    const dots = banners.map((_, i) => '<button class="hero-dot' + (i === 0 ? ' active' : '') + '" onclick="goToSlide(' + i + ')"></button>').join('');
    html += '<div class="hero-dots">' + dots + '</div>';
    html += '<div class="hero-arrows"><button class="hero-arrow" onclick="prevSlide()">&#8249;</button><button class="hero-arrow" onclick="nextSlide()">&#8250;</button></div>';
    slider.innerHTML = html;
    startSlider(banners.length);
  });
}

let currentSlide = 0;
let totalSlides = 0;

function startSlider(count) {
  totalSlides = count;
  clearInterval(sliderInterval);
  sliderInterval = setInterval(nextSlide, 5000);
}

function goToSlide(index) {
  currentSlide = index;
  updateSlider();
}

function nextSlide() {
  if (totalSlides === 0) return;
  currentSlide = (currentSlide + 1) % totalSlides;
  updateSlider();
}

function prevSlide() {
  if (totalSlides === 0) return;
  currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
  updateSlider();
}

function updateSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  slides.forEach((s, i) => s.classList.toggle('active', i === currentSlide));
  dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
}

// ===== TRENDING =====
function loadTrending() {
  const track = document.getElementById('trendingTrack');
  if (!track) return;
  db.ref('products').orderByChild('featured').equalTo('yes').on('value', snap => {
    const data = snap.val();
    if (!data) { track.innerHTML = '<div class="empty-state"><h3>No trending products</h3></div>'; return; }
    const products = Object.values(data);
    track.innerHTML = products.map(p => {
      const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
      return `
      <div class="carousel-card">
        <div class="carousel-card-img-wrap">
          <img class="carousel-card-img" src="${p.image || ''}" alt="${p.name}" loading="lazy"${cropImgStyle(p)} onerror="this.parentElement.style.background='var(--surface-container-high)'">
        </div>
        <div class="carousel-card-body">
          <div class="carousel-card-brand">${p.brand || ''}</div>
          <div class="carousel-card-name">${p.name || ''}</div>
          <div class="carousel-card-price">
            <span class="carousel-card-current">₹${Number(p.price).toLocaleString()}</span>
            ${p.oldPrice ? `<span class="carousel-card-old">₹${Number(p.oldPrice).toLocaleString()}</span>` : ''}
            ${discount > 0 ? `<span class="carousel-card-discount">-${discount}%</span>` : ''}
          </div>
        </div>
      </div>
    `}).join('');
  });
}

function scrollCarousel(dir) {
  const track = document.getElementById('trendingTrack');
  if (!track) return;
  const card = track.querySelector('.carousel-card');
  const cardWidth = card ? card.offsetWidth + 16 : 260;
  track.scrollBy({ left: dir * cardWidth, behavior: 'smooth' });
}

function setupCarouselDrag() {
  const track = document.getElementById('trendingTrack');
  if (!track) return;
  let isDown = false, startX, scrollLeft;
  track.addEventListener('mousedown', e => { isDown = true; track.classList.add('active'); startX = e.pageX - track.offsetLeft; scrollLeft = track.scrollLeft; });
  track.addEventListener('mouseleave', () => { isDown = false; });
  track.addEventListener('mouseup', () => { isDown = false; });
  track.addEventListener('mousemove', e => { if (!isDown) return; e.preventDefault(); track.scrollLeft = scrollLeft - (e.pageX - track.offsetLeft - startX) * 0.8; });
}

// ===== BRANDS =====
function loadBrands() {
  const container = document.getElementById('brandFilters');
  if (!container) return;
  db.ref('brands').on('value', snap => {
    const data = snap.val();
    const brands = data ? Object.values(data).map(b => b.name) : [];
    const defaultBrands = ['All', 'Samsung', 'Apple', 'Xiaomi', 'Vivo', 'Oppo', 'OnePlus', 'Realme', 'Nokia', 'Huawei', 'Nothing'];
    const allBrands = [...new Set([...defaultBrands, ...brands])];
    container.innerHTML = allBrands.map(b => `<button class="brand-pill${b === 'All' ? ' active' : ''}" onclick="filterByBrand('${b}')">${b}</button>`).join('');
  });
}

function filterByBrand(brand) {
  selectedBrand = brand === 'All' ? null : brand;
  document.querySelectorAll('.brand-pill').forEach(el => el.classList.toggle('active', el.textContent === brand));
  renderProducts();
}

// ===== CATEGORY TABS =====
function loadCategoryTabs() {
  const container = document.getElementById('categoryTabs');
  if (!container) return;
  const categories = ['Mobile Phones', 'Refurbished Phones', 'Second Hand Phones', 'Accessories'];
  container.innerHTML = '<div class="category-slider" id="categorySlider"></div>';
  categories.forEach(function (c) {
    var btn = document.createElement('button');
    btn.className = 'category-tab' + (c === currentCategory ? ' active' : '');
    btn.textContent = c;
    btn.onclick = function () { switchCategory(c); };
    container.appendChild(btn);
  });
  requestAnimationFrame(function () { positionCategorySlider(); });
}

function positionCategorySlider() {
  var active = document.querySelector('.category-tab.active');
  var slider = document.getElementById('categorySlider');
  if (!active || !slider) return;
  var container = slider.parentElement;
  if (!container) return;
  var containerRect = container.getBoundingClientRect();
  var activeRect = active.getBoundingClientRect();
  slider.style.width = activeRect.width + 'px';
  slider.style.transform = 'translateX(' + (activeRect.left - containerRect.left + container.scrollLeft) + 'px)';
}

function switchCategory(category) {
  currentCategory = category;
  document.querySelectorAll('.category-tab').forEach(function (el) {
    el.classList.toggle('active', el.textContent === category);
  });
  positionCategorySlider();
  renderProducts();
}

// ===== PRODUCTS =====
function loadProducts() {
  loadCategoryTabs();
  db.ref('products').on('value', snap => {
    const data = snap.val();
    allProducts = data ? Object.entries(data).map(([id, p]) => ({ id, ...p })) : [];
    renderProducts();
  });
}

function renderProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  const searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const stockFilter = document.getElementById('stockFilter')?.value || 'all';
  const sortBy = document.getElementById('sortSelect')?.value || 'default';

  let filtered = allProducts.filter(p => {
    if (p.category !== currentCategory) return false;
    if (selectedBrand && p.brand !== selectedBrand) return false;
    if (searchTerm && !p.name?.toLowerCase().includes(searchTerm) && !p.brand?.toLowerCase().includes(searchTerm)) return false;
    if (stockFilter === 'in-stock' && p.stock !== 'In Stock') return false;
    if (stockFilter === 'out-of-stock' && p.stock !== 'Out of Stock') return false;
    return true;
  });

  if (sortBy === 'price-asc') filtered.sort((a, b) => a.price - b.price);
  else if (sortBy === 'price-desc') filtered.sort((a, b) => b.price - a.price);
  else if (sortBy === 'latest') filtered.sort((a, b) => b.createdAt - a.createdAt);

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><h3>No products found</h3><p>Try adjusting your filters or search term</p></div>';
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const isOut = p.stock === 'Out of Stock';
    const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    return `
      <div class="product-card" data-product-id="${p.id}">
        <div class="product-card-img-wrap">
          <img class="product-card-img" src="${p.image || ''}" alt="${(p.name || '').replace(/"/g, '&quot;')}" loading="lazy"${cropImgStyle(p)} onerror="this.parentElement.style.background='var(--surface-container-high)'">
        </div>
        ${discount > 0 ? `<span class="product-card-badge badge-sale">-${discount}%</span>` : ''}
        ${isOut ? '<span class="product-card-badge badge-out">Out of Stock</span>' : ''}
        <div class="product-card-body">
          <div class="product-card-brand">${p.brand || ''}</div>
          <div class="product-card-name">${(p.name || '').replace(/"/g, '&quot;')}</div>
          <div class="product-card-pricing">
            <span class="product-card-price">₹${Number(p.price).toLocaleString()}</span>
            ${p.oldPrice ? `<span class="product-card-old">₹${Number(p.oldPrice).toLocaleString()}</span>` : ''}
          </div>
          <div class="product-card-actions">
            ${p.url ? '<a href="' + p.url.replace(/"/g, '&quot;') + '" target="_blank" class="product-card-btn btn-primary">Quick View</a>' : ''}
            ${p.specs ? '<button class="product-card-btn btn-outline enquire-btn" data-enquire="' + p.id + '">Enquire</button>' : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Event delegation for Enquire buttons
document.addEventListener('click', function (e) {
  var btn = e.target.closest('.enquire-btn');
  if (!btn) return;
  var id = btn.getAttribute('data-enquire');
  var product = allProducts.find(function (pr) { return pr.id === id; });
  if (product) openSpecsModal(product.name, product.specs);
});

function openSpecsModal(name, specs) {
  document.getElementById('specsModalTitle').textContent = name + ' - Specifications';
  const body = document.getElementById('specsModalBody');
  if (specs) {
    body.innerHTML = specs.split('\n').filter(Boolean).map(function (line) {
      var sep = line.indexOf(':') > 0 ? ': ' : ' — ';
      var parts = line.split(sep);
      if (parts.length > 1) {
        return '<div class="specs-row"><span class="specs-key">' + parts[0].trim() + '</span><span class="specs-val">' + parts.slice(1).join(sep).trim() + '</span></div>';
      }
      return '<div class="specs-row"><span class="specs-val" style="grid-column:span 2;">' + line + '</span></div>';
    }).join('');
  } else {
    body.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:2rem 0;">No specifications available</p>';
  }
  document.getElementById('specsOverlay').classList.add('show');
  document.getElementById('specsModal').classList.add('show');
}
function closeSpecsModal() {
  document.getElementById('specsOverlay').classList.remove('show');
  document.getElementById('specsModal').classList.remove('show');
}
function filterProducts() { renderProducts(); }
function sortProducts() { renderProducts(); }

// ===== PROMOTIONS =====
function loadPromotions() {
  const grid = document.getElementById('promoGrid');
  if (!grid) return;
  db.ref('promotions').on('value', snap => {
    const data = snap.val();
    if (!data) { grid.innerHTML = ''; return; }
    const sliders = Object.values(data).sort((a, b) => (a.order || 0) - (b.order || 0));
    grid.innerHTML = sliders.map(s => `
      <div class="promo-card">
        <img class="promo-card-img" src="${s.image || ''}" alt="${s.title}" loading="lazy"${cropImgStyle(s)} onerror="this.style.display='none'">
        <div class="promo-card-overlay">
          <h3>${s.title || ''}</h3>
          <p>${s.description || ''}</p>
        </div>
      </div>
    `).join('');
  });
}

// ===== SUB BANNERS =====
function loadSubBanners() {
  const container = document.getElementById('subBannerStrip');
  if (!container) return;
  db.ref('subBanners').orderByChild('order').on('value', snap => {
    const data = snap.val();
    if (!data) { container.innerHTML = ''; container.className = 'sub-banner-strip'; return; }
    var items = Object.values(data).filter(function (s) { return s.active !== false; }).sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    if (items.length === 0) { container.innerHTML = ''; container.className = 'sub-banner-strip'; return; }
    container.className = 'sub-banner-strip has-items';
    var html = '<div class="sub-banner-track">';
    var content = items.map(function (s) {
      return '<span class="sub-banner-item"><span class="sub-banner-icon-wrap">' + (s.image ? '<img src="' + s.image + '" alt="" class="sub-banner-icon"' + cropImgStyle(s) + ' onerror="this.style.display=\'none\'">' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>') + '</span><span class="sub-banner-text"><strong>' + (s.title || '') + '</strong>' + (s.description ? ' — ' + s.description : '') + '</span></span>';
    }).join('');
    html += content + content + content + '</div>';
    container.innerHTML = html;
  });
}

// ===== NOTIFICATION BADGE =====
function loadNotifications() {
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  db.ref('notifications').orderByChild('timestamp').limitToLast(1).on('child_added', function (snap) {
    var n = snap.val();
    if (!n || !n.title) return;
    var countSnap = badge.closest('[data-count]');
    db.ref('notifications').once('value', function (allSnap) {
      var all = allSnap.val();
      var count = all ? Object.keys(all).length : 0;
      badge.style.display = count > 0 ? 'block' : 'none';
    });
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (n.timestamp && n.timestamp <= lastNotifTimestamp) return;
    lastNotifTimestamp = n.timestamp || Date.now();
    localStorage.setItem('lastNotifTs', lastNotifTimestamp);
    new Notification(n.title, { body: n.message || '', icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Crect width=%2232%22 height=%2232%22 rx=%228%22 fill=%22%23ff6b00%22/%3E%3Ctext x=%2250%%22 y=%2255%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2218%22 font-weight=%22bold%22 font-family=%22sans-serif%22%3ED%3C/text%3E%3C/svg%3E' });
  });
}

// ===== REPAIRS =====
let allRepairs = [];
function loadAllRepairs() {
  db.ref('repairs').on('value', snap => {
    const data = snap.val();
    allRepairs = data ? Object.entries(data).map(([id, r]) => ({ id, ...r })) : [];
  });
}

function searchRepair() {
  const input = document.getElementById('repairSearchInput');
  const list = document.getElementById('repairsList');
  const count = document.getElementById('resultCount');
  if (!input || !list) return;
  const phone = input.value.trim();
  if (!phone) { showToast('Please enter a phone number', 'error'); return; }
  const results = allRepairs.filter(r => r.phone && r.phone.includes(phone));
  if (results.length === 0) {
    list.innerHTML = '<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><h3>No repairs found</h3><p>No repair records match this phone number</p></div>';
    if (count) count.textContent = 'No results found';
    return;
  }
  if (count) count.textContent = results.length + ' repair(s) found';
  list.innerHTML = results.map(r => {
    const statusClass = 'status-' + r.status?.toLowerCase().replace(' ', '');
    return `
      <div class="repair-card">
        <div class="repair-info">
          <h3>${r.device || 'Unknown Device'}</h3>
          <p>${r.customer || 'Unknown'} &middot; ${r.issue || ''} &middot; ₹${Number(r.cost || 0).toLocaleString()}</p>
        </div>
        <span class="repair-status ${statusClass}">${r.status || 'Pending'}</span>
      </div>
    `;
  }).join('');
}

// ===== NOTIFICATIONS PAGE =====
function loadNotificationsPage() {
  const list = document.getElementById('notificationsList');
  if (!list) return;
  db.ref('notifications').on('value', snap => {
    const data = snap.val();
    if (!data) {
      list.innerHTML = '<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg><h3>No notifications yet</h3><p>Check back later for updates</p></div>';
      return;
    }
    const notifs = Object.values(data).reverse();
    list.innerHTML = notifs.map(n => `
      <div class="notif-card">
        <h3>${n.title || ''}</h3>
        <p>${n.message || ''}</p>
        <div class="notif-date">${n.date || ''} ${n.time || ''}</div>
      </div>
    `).join('');
  });
}

function loadFooterSettings() {
  var phoneEl = document.getElementById('footerPhone');
  var addrEl = document.getElementById('footerAddress');
  var hoursEl = document.getElementById('footerHours');
  if (!phoneEl && !addrEl && !hoursEl) return;
  db.ref('settings').once('value', snap => {
    var s = snap.val();
    if (!s) return;
    if (s.phone && phoneEl) phoneEl.textContent = s.phone;
    if (s.address && addrEl) addrEl.textContent = s.address;
    if (s.hours && hoursEl) hoursEl.textContent = s.hours;
  });
}

// ===== ABOUT PAGE =====
function loadAboutSettings() {
  db.ref('settings').once('value', snap => {
    var s = snap.val();
    if (!s) return;
    if (s.name && document.getElementById('aboutStoreName')) document.getElementById('aboutStoreName').textContent = 'About ' + s.name;
    if (s.description && document.getElementById('aboutDescription')) document.getElementById('aboutDescription').textContent = s.description;
    if (s.phone && document.getElementById('aboutPhone')) document.getElementById('aboutPhone').textContent = s.phone;
    if (s.email && document.getElementById('aboutEmail')) document.getElementById('aboutEmail').textContent = s.email;
    if (s.address && document.getElementById('aboutAddress')) document.getElementById('aboutAddress').textContent = s.address;
    if (s.hours && document.getElementById('aboutHours')) document.getElementById('aboutHours').textContent = s.hours;
    if (s.map && document.getElementById('aboutMap')) document.getElementById('aboutMap').src = s.map;
  });
}

// ===== SETTINGS PAGE =====
function loadSettings() {
  loadAccentColor();
}

var lastNotifTimestamp = localStorage.getItem('lastNotifTs') ? parseInt(localStorage.getItem('lastNotifTs')) : 0;

function autoRequestNotification() {
  if (!('Notification' in window) || Notification.permission !== 'default') return;
  Notification.requestPermission();
}

function requestNotificationPermission() {
  if (!('Notification' in window)) {
    showToast('Notifications not supported', 'error');
    return;
  }
  if (Notification.permission === 'granted') {
    showToast('Notifications already enabled!', 'success');
    return;
  }
  Notification.requestPermission().then(function (perm) {
    showToast(perm === 'granted' ? 'Notifications enabled!' : 'Notification permission denied', perm === 'granted' ? 'success' : 'error');
  });
}
