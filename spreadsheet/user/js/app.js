var allProducts = [];
var allBrands = [];
var currentCategory = 'Mobile Phones';
var selectedBrand = null;
var sliderInterval;
var lastNotifTimestamp = localStorage.getItem('lastNotifTimestamp') || 0;
var CACHE_KEY = 'DhurbaCache';

document.addEventListener('DOMContentLoaded', function () {
  loadTheme();
  loadSettings();

  // Cache-first: render cached data immediately, then update from server
  var cached = loadCache();
  if (cached) {
    renderAllFromCache(cached);
  }

  // Single batch fetch loads all data in one request
  sheets_getAllSiteData().then(function (data) {
    saveCache(data);
    loadBanners();
    loadTrending();
    loadBrands();
    loadProducts();
    loadPromotions();
    loadSubBanners();
    loadNotifications();
    loadFooterSettings();
  });

  var path = window.location.pathname;
  if (path.includes('repairs')) {
    var repairsCached = cached && cached.repairs ? cached.repairs : null;
    if (repairsCached) { window.allRepairs = repairsCached; }
    sheets_refresh('repairs').then(function (d) { window.allRepairs = d || []; });
  }
  if (path.includes('about')) { sheets_refresh('settings').then(function () { loadAboutSettings(); }); }
  if (path.includes('notifications')) {
    var notifCached = cached && cached.notifications ? cached.notifications : null;
    if (notifCached) { renderNotificationsFromCache(notifCached); }
    sheets_refresh('notifications').then(function () { loadNotificationsPage(); });
  }

  setupCarouselDrag();
  setTimeout(autoRequestNotification, 3000);
});

function loadCache() {
  try {
    var raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}

function saveCache(data) {
  try {
    data.timestamp = Date.now();
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (e) {}
}

function renderAllFromCache(cached) {
  if (!cached) return;
  // Populate in-memory cache so render functions can read settings
  if (cached.settings) sheets_cache['settings'] = cached.settings;
  if (cached.banners) sheets_cache['banners'] = cached.banners;
  if (cached.products) sheets_cache['products'] = cached.products;
  if (cached.brands) sheets_cache['brands'] = cached.brands;
  if (cached.promotions) sheets_cache['promotions'] = cached.promotions;
  if (cached.subBanners) sheets_cache['subBanners'] = cached.subBanners;
  if (cached.notifications) sheets_cache['notifications'] = cached.notifications;
  // Hero overlay â€” default OFF (hidden), enable via admin settings
  if (cached.settings) {
    var heroVal = 'false';
    for (var si = 0; si < cached.settings.length; si++) {
      if (cached.settings[si].key === 'heroOverlay') { heroVal = cached.settings[si].value; break; }
    }
    document.documentElement.classList.toggle('no-hero-overlay', heroVal !== 'true');
  }
  if (cached.banners && cached.banners.length) {
    renderBanners(cached.banners);
  }
  if (cached.products && cached.products.length) {
    allProducts = cached.products;
    renderProducts();
    var trending = cached.products.filter(function (p) { return p.featured === true || p.featured === 'true' || p.featured === 'yes'; });
    if (trending.length) renderTrending(trending);
  }
  if (cached.brands && cached.brands.length) {
    renderBrands(cached.brands);
  }
  if (cached.promotions && cached.promotions.length) {
    renderPromotions(cached.promotions);
  }
  if (cached.subBanners && cached.subBanners.length) {
    renderSubBanners(cached.subBanners);
  }
  if (cached.settings && cached.settings.length) {
    renderFooterFromCache(cached.settings);
  }
}

function renderNotificationsFromCache(data) {
  var container = document.getElementById('notificationsList');
  if (!container || !data || !data.length) return;
  var html = '';
  data.forEach(function (n) {
    html += '<div class="notif-page-card">' +
      '<div class="notif-page-icon"><svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></div>' +
      '<div class="notif-page-content">' +
      '<h4>' + (n.title || '') + '</h4>' +
      '<p>' + (n.message || '') + '</p>' +
      '<div class="notif-page-time">' + (n.timestamp || '') + '</div>' +
      '</div></div>';
  });
  container.innerHTML = html;
}

function cropImgStyle(item) {
  if (!item.cropW && !item.cropH) return '';
  var cw = parseFloat(item.cropW) || 0;
  var ch = parseFloat(item.cropH) || 0;
  if (!cw && !ch) return '';
  return 'object-position: center ' + (ch / 2) + '% center ' + (cw / 2) + '%;';
}

function toggleTheme() {
  var isDark = document.documentElement.classList.toggle('dark');
  updateThemeIcon(isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeUI(isDark ? 'dark' : 'light');
}

function loadTheme() {
  var saved = localStorage.getItem('theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var isDark;
  if (saved === 'dark' || saved === 'light') {
    isDark = saved === 'dark';
  } else {
    isDark = prefersDark;
  }
  document.documentElement.classList.toggle('dark', isDark);
  updateThemeIcon(isDark);
  updateThemeUI(saved || (prefersDark ? 'dark' : 'light'));
}

function setThemeMode(mode) {
  if (mode === 'auto') {
    localStorage.removeItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', prefersDark);
    updateThemeIcon(prefersDark);
  } else {
    var isDark = mode === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    updateThemeIcon(isDark);
    localStorage.setItem('theme', mode);
  }
  updateThemeUI(mode);
}

function updateThemeUI(saved) {
  var radios = document.querySelectorAll('.theme-option');
  if (!radios.length) return;
  var mode = saved || 'auto';
  radios.forEach(function (el) {
    el.classList.toggle('active', el.getAttribute('data-theme') === mode);
  });
}

function updateThemeIcon(isDark) {
  var btn = document.getElementById('themeToggle');
  if (!btn) return;
  if (isDark) {
    btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  } else {
    btn.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  }
}

function toggleMobileMenu() {
  var nav = document.getElementById('mobileNav');
  var overlay = document.getElementById('mobileOverlay');
  if (!nav || !overlay) return;
  var isActive = nav.classList.toggle('active');
  overlay.classList.toggle('active', isActive);
  document.body.style.overflow = isActive ? 'hidden' : '';
}

document.addEventListener('click', function (e) {
  var nav = document.getElementById('mobileNav');
  var overlay = document.getElementById('mobileOverlay');
  if (!nav || !overlay) return;
  if (nav.classList.contains('active') && e.target.closest('#mobileNav')) return;
  if (nav.classList.contains('active') && e.target.closest('.mobile-menu-btn')) return;
  if (nav.classList.contains('active') && e.target.closest('.btn-icon[onclick*="toggleMobileMenu"]')) return;
  if (overlay.classList.contains('active')) {
    nav.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    var nav = document.getElementById('mobileNav');
    var overlay = document.getElementById('mobileOverlay');
    if (nav && overlay && nav.classList.contains('active')) {
      nav.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
});

function renderBanners(data) {
  var container = document.getElementById('heroSlides');
  var dots = document.getElementById('heroDots');
  if (!container) return;
  var settings = sheets_getCached('settings');
  var showOverlay = false;
  for (var si = 0; si < settings.length; si++) {
    if (settings[si].key === 'heroOverlay') { showOverlay = settings[si].value === 'true'; break; }
  }
  document.documentElement.classList.toggle('no-hero-overlay', !showOverlay);
  if (!data || !data.length) {
    container.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg><h3>No banners available</h3></div>';
    return;
  }
  var active = data.filter(function (b) { return b.active !== false && b.active !== 'false' && b.active !== 'no'; });
  if (!active.length) {
    container.innerHTML = '';
    return;
  }
  var slides = '';
  var dotHtml = '';
  active.forEach(function (b, i) {
    slides += '<div class="hero-slide' + (i === 0 ? ' active' : '') + '">' +
      '<div class="hero-slide-bg" style="background-image:url(' + b.image + ');' + cropImgStyle(b) + '"></div>' +
      '<div class="hero-content">' +
      '<h1>' + (b.title || '') + '</h1>' +
      '<p>' + (b.description || '') + '</p>' +
      (b.ctaText && b.ctaLink ? '<a href="' + b.ctaLink + '" class="hero-cta">' + b.ctaText + ' &rarr;</a>' : '') +
      '</div></div>';
    dotHtml += '<button class="hero-dot' + (i === 0 ? ' active' : '') + '" data-index="' + i + '"></button>';
  });
  container.innerHTML = slides;
  if (dots) dots.innerHTML = dotHtml;
  var arrows = document.querySelector('.hero-arrows');
  if (!arrows) {
    arrows = document.createElement('div');
    arrows.className = 'hero-arrows';
    arrows.innerHTML = '<button class="hero-arrow hero-arrow-prev">&#8249;</button><button class="hero-arrow hero-arrow-next">&#8250;</button>';
    document.querySelector('.hero-slider').appendChild(arrows);
    arrows.addEventListener('click', function (e) {
      var btn = e.target.closest('.hero-arrow');
      if (!btn) return;
      if (btn.classList.contains('hero-arrow-prev')) prevSlide();
      else nextSlide();
    });
  }
  startSlider();
  if (dots) {
    dots.addEventListener('click', function (e) {
      var dot = e.target.closest('.hero-dot');
      if (!dot) return;
      var idx = parseInt(dot.getAttribute('data-index'));
      goToSlide(idx);
    });
  }
}

function loadBanners() {
  sheets_refresh('banners').then(function (data) {
    renderBanners(data);
  });
}

var currentSlide = 0;

function startSlider() {
  clearInterval(sliderInterval);
  sliderInterval = setInterval(function () {
    var slides = document.querySelectorAll('.hero-slide');
    if (!slides.length) return;
    currentSlide = (currentSlide + 1) % slides.length;
    goToSlide(currentSlide);
  }, 5000);
}

function goToSlide(index) {
  var slides = document.querySelectorAll('.hero-slide');
  var dots = document.querySelectorAll('.hero-dot');
  if (!slides.length) return;
  currentSlide = index;
  slides.forEach(function (s, i) {
    s.classList.toggle('active', i === index);
  });
  dots.forEach(function (d, i) {
    d.classList.toggle('active', i === index);
  });
}

function nextSlide() {
  var slides = document.querySelectorAll('.hero-slide');
  if (!slides.length) return;
  currentSlide = (currentSlide + 1) % slides.length;
  goToSlide(currentSlide);
}

function prevSlide() {
  var slides = document.querySelectorAll('.hero-slide');
  if (!slides.length) return;
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  goToSlide(currentSlide);
}

function renderTrending(data) {
  var track = document.getElementById('trendingTrack');
  if (!track) return;
  if (!data || !data.length) {
    track.innerHTML = '<div class="empty-state"><h3>No trending items</h3></div>';
    return;
  }
  var html = '';
  data.forEach(function (p) {
    var discount = p.oldPrice ? Math.round((1 - Number(p.price) / Number(p.oldPrice)) * 100) : 0;
    var price = 'â‚¹' + (p.price ? Number(p.price).toLocaleString() : '0');
    var oldPrice = p.oldPrice ? '<span class="product-card-old">â‚¹' + Number(p.oldPrice).toLocaleString() + '</span>' : '';

    html += '<div class="product-card" style="flex:0 0 220px;scroll-snap-align:start;">' +
      '<div class="product-card-img-wrap">' +
      '<img class="product-card-img" src="' + (p.image || '') + '" alt="' + (p.name || '') + '" loading="lazy"' + cropImgStyle(p) + ' onerror="this.parentElement.style.background=\'var(--clr-surface-alt)\'">' +
      '</div>' +
      (discount > 0 ? '<span class="product-card-badge badge-sale">-' + discount + '%</span>' : '') +
      '<div class="product-card-body">' +
      '<div class="product-card-brand">' + (p.brand || '') + '</div>' +
      '<div class="product-card-name">' + (p.name || '') + '</div>' +
      '<div class="product-card-pricing">' +
      '<span class="product-card-price">' + price + '</span>' +
      oldPrice +
      '</div>' +
      '<div class="product-card-actions">' +
      (p.url ? '<a href="' + p.url + '" target="_blank" class="product-card-btn btn-primary">Quick View</a>' : '') +
      (p.specs ? '<button class="product-card-btn btn-outline enquire-btn" data-enquire="' + p.id + '">Enquire</button>' : '') +
      '</div>' +
      '</div>' +
      '</div>';
  });
  track.innerHTML = html;
}

function loadTrending() {
  sheets_refresh('products').then(function (data) {
    var trending = data.filter(function (p) { return p.featured === true || p.featured === 'true' || p.featured === 'yes'; });
    renderTrending(trending);
  });
}

function scrollCarousel(direction) {
  var track = document.getElementById('trendingTrack');
  if (!track) return;
  var scrollAmount = 220;
  track.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

function setupCarouselDrag() {
  var track = document.getElementById('trendingTrack');
  if (!track) return;
  var isDown = false;
  var startX, scrollLeft;

  track.addEventListener('mousedown', function (e) {
    isDown = true;
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
    track.style.cursor = 'grabbing';
  });

  track.addEventListener('mouseleave', function () {
    isDown = false;
    track.style.cursor = '';
  });

  track.addEventListener('mouseup', function () {
    isDown = false;
    track.style.cursor = '';
  });

  track.addEventListener('mousemove', function (e) {
    if (!isDown) return;
    e.preventDefault();
    var x = e.pageX - track.offsetLeft;
    var walk = (x - startX) * 1.5;
    track.scrollLeft = scrollLeft - walk;
  });

  track.addEventListener('touchstart', function (e) {
    startX = e.touches[0].pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
  }, { passive: true });

  track.addEventListener('touchmove', function (e) {
    var x = e.touches[0].pageX - track.offsetLeft;
    var walk = (x - startX) * 1.5;
    track.scrollLeft = scrollLeft - walk;
  }, { passive: true });
}

function renderBrands(data) {
  allBrands = data || [];
  var container = document.getElementById('brandFilters');
  if (!container) return;
  var html = '';
  data.forEach(function (b) {
    html += '<button class="brand-pill" data-brand="' + (b.name || '') + '">' + (b.name || '') + '</button>';
  });
  container.innerHTML = html;
  container.addEventListener('click', function (e) {
    var pill = e.target.closest('.brand-pill');
    if (!pill) return;
    if (pill.classList.contains('active')) {
      pill.classList.remove('active');
      selectedBrand = null;
    } else {
      container.querySelectorAll('.brand-pill').forEach(function (p) { p.classList.remove('active'); });
      pill.classList.add('active');
      selectedBrand = pill.getAttribute('data-brand') || null;
    }
    renderProducts();
  });
  loadCategoryTabs();
}

function loadBrands() {
  sheets_refresh('brands').then(function (data) {
    renderBrands(data);
  });
}

function loadCategoryTabs() {
  var container = document.getElementById('categoryTabs');
  if (!container) return;
  var categories = ['Mobile Phones', 'Refurbished Phones', 'Second Hand Phones', 'Accessories'];
  var html = '';
  categories.forEach(function (cat, i) {
    html += '<button class="category-tab' + (i === 0 ? ' active' : '') + '" data-category="' + cat + '">' + cat + '</button>';
  });
  html += '<div class="category-slider" id="categorySlider"></div>';
  container.innerHTML = html;
  container.addEventListener('click', function (e) {
    var tab = e.target.closest('.category-tab');
    if (!tab) return;
    switchCategory(tab.getAttribute('data-category'));
  });
  positionCategorySlider();
}

function switchCategory(category) {
  currentCategory = category;
  var tabs = document.querySelectorAll('.category-tab');
  tabs.forEach(function (t) {
    t.classList.toggle('active', t.getAttribute('data-category') === category);
  });
  positionCategorySlider();
  renderProducts();
}

function positionCategorySlider() {
  var slider = document.getElementById('categorySlider');
  var active = document.querySelector('.category-tab.active');
  if (!slider || !active) return;
  slider.style.left = active.offsetLeft + 'px';
  slider.style.width = active.offsetWidth + 'px';
}

function loadProducts() {
  sheets_refresh('products').then(function (data) {
    allProducts = data || [];
    renderProducts();
  });
}

function renderProducts() {
  var grid = document.getElementById('productGrid');
  if (!grid) return;
  var searchVal = (document.getElementById('searchInput') ? document.getElementById('searchInput').value : '').toLowerCase();
  var stockVal = document.getElementById('stockFilter') ? document.getElementById('stockFilter').value : 'all';
  var sortBy = document.getElementById('sortSelect') ? document.getElementById('sortSelect').value : 'default';

  var filtered = allProducts.filter(function (p) {
    if (currentCategory && p.category !== currentCategory) return false;
    if (selectedBrand && p.brand !== selectedBrand) return false;
    if (searchVal && p.name && p.name.toLowerCase().indexOf(searchVal) === -1) return false;
    if (stockVal === 'in-stock' && p.stock === 'out') return false;
    if (stockVal === 'out-of-stock' && p.stock !== 'out') return false;
    return true;
  });

  if (sortBy === 'price-asc') filtered.sort(function (a, b) { return Number(a.price) - Number(b.price); });
  else if (sortBy === 'price-desc') filtered.sort(function (a, b) { return Number(b.price) - Number(a.price); });

  if (!filtered.length) {
    grid.innerHTML = '<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><h3>No products found</h3><p>Try adjusting your search or filters</p></div>';
    return;
  }

  var html = '';
  filtered.forEach(function (p) {
    var isOut = p.stock === 'out';
    var discount = p.oldPrice ? Math.round((1 - Number(p.price) / Number(p.oldPrice)) * 100) : 0;
    var price = 'â‚¹' + (p.price ? Number(p.price).toLocaleString() : '0');
    var oldPrice = p.oldPrice ? '<span class="product-card-old">â‚¹' + Number(p.oldPrice).toLocaleString() + '</span>' : '';

    html += '<div class="product-card" data-product-id="' + p.id + '">' +
      '<div class="product-card-img-wrap">' +
      '<img class="product-card-img" src="' + (p.image || '') + '" alt="' + (p.name || '') + '" loading="lazy"' + cropImgStyle(p) + ' onerror="this.parentElement.style.background=\'var(--clr-surface-alt)\'">' +
      '</div>' +
      (discount > 0 ? '<span class="product-card-badge badge-sale">-' + discount + '%</span>' : '') +
      (isOut ? '<span class="product-card-badge badge-out">Out of Stock</span>' : '') +
      '<div class="product-card-body">' +
      '<div class="product-card-brand">' + (p.brand || '') + '</div>' +
      '<div class="product-card-name">' + (p.name || '') + '</div>' +
      '<div class="product-card-pricing">' +
      '<span class="product-card-price">' + price + '</span>' +
      oldPrice +
      '</div>' +
      '<div class="product-card-actions">' +
      (p.url ? '<a href="' + p.url + '" target="_blank" class="product-card-btn btn-primary">Quick View</a>' : '') +
      (p.specs ? '<button class="product-card-btn btn-outline enquire-btn" data-enquire="' + p.id + '">Enquire</button>' : '') +
      '</div>' +
      '</div>' +
      '</div>';
  });
  grid.innerHTML = html;
}

function filterProducts() {
  renderProducts();
}

function sortProducts() {
  renderProducts();
}

document.addEventListener('click', function (e) {
  var btn = e.target.closest('.enquire-btn');
  if (!btn) return;
  var id = btn.getAttribute('data-enquire');
  var product = allProducts.find(function (pr) { return pr.id === id; });
  if (product) openSpecsModal(product.name, product.specs);
});

function openSpecsModal(name, specs) {
  if (!specs) return;
  var overlay = document.getElementById('specsModal');
  var title = document.getElementById('specsModalTitle');
  var body = document.getElementById('specsModalBody');
  if (!overlay || !title || !body) return;
  title.textContent = name || 'Specifications';
  body.innerHTML = '';

  var lines = specs.split('\n');
  lines.forEach(function (line) {
    line = line.trim();
    if (!line) return;
    var colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      var key = line.substring(0, colonIdx).trim();
      var val = line.substring(colonIdx + 1).trim();
      var row = document.createElement('div');
      row.className = 'spec-row';
      row.innerHTML = '<span class="spec-key">' + key + '</span><span class="spec-value">' + val + '</span>';
      body.appendChild(row);
    } else {
      var full = document.createElement('div');
      full.className = 'spec-row-full';
      full.textContent = line;
      body.appendChild(full);
    }
  });

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSpecsModal() {
  var overlay = document.getElementById('specsModal');
  if (!overlay) return;
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

function renderPromotions(data) {
  var grid = document.getElementById('promoGrid');
  if (!grid) return;
  if (!data || !data.length) {
    grid.innerHTML = '';
    return;
  }
  var html = '';
  data.forEach(function (p) {
    html += '<div class="promo-card">' +
      '<img src="' + (p.image || '') + '" alt="' + (p.title || '') + '" loading="lazy" style="' + cropImgStyle(p) + '" onerror="this.src=\'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22><rect fill=%22%23e2e8f0%22 width=%22600%22 height=%22400%22/></svg>\'">' +
      '<div class="promo-overlay"></div>' +
      '<div class="promo-content">' +
      '<h3>' + (p.title || '') + '</h3>' +
      '<p>' + (p.description || '') + '</p>' +
      '</div></div>';
  });
  grid.innerHTML = html;
}

function loadPromotions() {
  sheets_refresh('promotions').then(function (data) {
    renderPromotions(data);
  });
}

function renderSubBanners(data) {
  var track = document.getElementById('subBannerTrack');
  if (!track) return;
  if (!data || !data.length) {
    track.innerHTML = '';
    return;
  }
  var items = data.filter(function (b) { return b.active !== false && b.active !== 'false' && b.active !== 'no'; });
  if (!items.length) {
    track.innerHTML = '';
    return;
  }
  var html = '';
  var doubled = items.concat(items);
  doubled.forEach(function (b) {
    html += '<span class="sub-banner-item"><span class="sub-banner-icon-wrap">' +
      (b.image ? '<img src="' + b.image + '" alt="" class="sub-banner-icon">' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>') +
      '</span><span class="sub-banner-text"><strong>' + (b.title || '') + '</strong>' + (b.description ? ' â€” ' + b.description : '') + '</span></span>';
  });
  track.innerHTML = html;
}

function renderFooterFromCache(settings) {
  var phoneEl = document.getElementById('footerPhone');
  var addressEl = document.getElementById('footerAddress');
  var hoursEl = document.getElementById('footerHours');
  var yearEl = document.getElementById('footerYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  if (!settings) return;
  var phone = '', address = '', hours = '';
  for (var si = 0; si < settings.length; si++) {
    if (settings[si].key === 'footer_phone') phone = settings[si].value;
    if (settings[si].key === 'footer_address') address = settings[si].value;
    if (settings[si].key === 'footer_hours') hours = settings[si].value;
  }
  if (phoneEl && phone) phoneEl.innerHTML = '<svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> ' + phone;
  if (addressEl && address) addressEl.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ' + address;
  if (hoursEl && hours) hoursEl.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ' + hours;
}

function loadSubBanners() {
  sheets_refresh('subBanners').then(function (data) {
    renderSubBanners(data);
  });
}

function loadNotifications() {
  sheets_refresh('notifications').then(function (data) {
    var badge = document.getElementById('notifBadge');
    if (!badge) return;
    var unread = 0;
    if (data && data.length) {
      data.forEach(function (n) {
        if (n.timestamp > lastNotifTimestamp) unread++;
      });
    }
    badge.textContent = unread;
    badge.style.display = unread > 0 ? 'flex' : 'none';
  });
}

function loadNotificationsPage() {
  sheets_refresh('notifications').then(function (data) {
    var container = document.getElementById('notificationsList');
    if (!container) return;
    if (!data || !data.length) {
      container.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg><h3>No notifications</h3></div>';
      return;
    }
    var html = '';
    data.forEach(function (n) {
      html += '<div class="notif-page-card">' +
        '<div class="notif-page-icon"><svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></div>' +
        '<div class="notif-page-content">' +
        '<h4>' + (n.title || '') + '</h4>' +
        '<p>' + (n.message || '') + '</p>' +
        '<div class="notif-page-time">' + (n.timestamp || '') + '</div>' +
        '</div></div>';
    });
    container.innerHTML = html;
    var maxTs = 0;
    data.forEach(function (n) {
      if (n.timestamp > maxTs) maxTs = n.timestamp;
    });
    if (maxTs > 0) {
      lastNotifTimestamp = maxTs;
      localStorage.setItem('lastNotifTimestamp', maxTs);
    }
    loadNotifications();
  });
}

function loadAllRepairs() {
  sheets_refresh('repairs').then(function (data) {
    window.allRepairs = data || [];
    var container = document.getElementById('repairResults');
    if (container) container.innerHTML = '';
  });
}

function searchRepair() {
  var input = document.getElementById('repairSearchInput');
  var container = document.getElementById('repairResults');
  if (!input || !container) return;
  var query = input.value.trim().toLowerCase();
  if (!query) {
    container.innerHTML = '<div class="empty-state"><h3>Enter a phone number to search</h3></div>';
    return;
  }
  var results = (window.allRepairs || []).filter(function (r) {
    return (r.phone && r.phone.toLowerCase().indexOf(query) !== -1);
  });
  if (!results.length) {
    container.innerHTML = '<div class="empty-state"><h3>No repairs found</h3><p>Check the phone number and try again</p></div>';
    return;
  }
  var html = '';
  results.forEach(function (r) {
    var statusClass = (r.status || '').toLowerCase().replace(/\s+/g, '-');
    html += '<div class="repair-card">' +
      '<div><div class="label">Customer</div><div class="value">' + (r.customer || '') + '</div></div>' +
      '<div><div class="label">Device</div><div class="value">' + (r.device || '') + '</div></div>' +
      '<div><div class="label">Issue</div><div class="value">' + (r.issue || '') + '</div></div>' +
      '<div><div class="label">Cost</div><div class="value">' + (r.cost || '') + '</div></div>' +
      '<div style="grid-column:1/-1"><div class="label">Status</div><span class="repair-status ' + statusClass + '">' + (r.status || '') + '</span></div>' +
      '</div>';
  });
  container.innerHTML = html;
}

function getSettingVal(key, fallback) {
  var settings = sheets_getCached('settings');
  for (var i = 0; i < settings.length; i++) {
    if (settings[i].key === key) return settings[i].value || fallback;
  }
  return fallback;
}

function loadAboutSettings() {
  var aboutTitle = document.getElementById('aboutTitle');
  var aboutDesc = document.getElementById('aboutDesc');
  var aboutStory = document.getElementById('aboutStory');
  var aboutMission = document.getElementById('aboutMission');
  var aboutFeatures = document.getElementById('aboutFeatures');

  if (aboutTitle) aboutTitle.textContent = getSettingVal('about_title', 'About Dhurba Mobile');
  if (aboutDesc) aboutDesc.textContent = getSettingVal('about_description', 'Your trusted mobile shop for quality devices and repairs.');
  if (aboutStory) aboutStory.textContent = getSettingVal('about_story', 'We have been serving customers with quality mobile phones and repair services.');
  if (aboutMission) aboutMission.textContent = getSettingVal('about_mission', 'To provide the best mobile products and services at affordable prices.');

  if (aboutFeatures) {
    var features = (getSettingVal('about_features') || 'Quality Products,Expert Repairs,Best Prices').split(',');
    var list = document.createElement('ul');
    features.forEach(function (f) {
      var li = document.createElement('li');
      li.textContent = f.trim();
      list.appendChild(li);
    });
    aboutFeatures.appendChild(list);
  }
}

function loadFooterSettings() {
  var yearEl = document.getElementById('footerYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  var phone = getSettingVal('footer_phone', '+91 9876543210');
  var address = getSettingVal('footer_address', '123, Main Street, City');
  var hours = getSettingVal('footer_hours', 'Mon-Sat: 10:00 AM - 8:00 PM');
  var phoneEl = document.getElementById('footerPhone');
  var addressEl = document.getElementById('footerAddress');
  var hoursEl = document.getElementById('footerHours');
  if (phoneEl) phoneEl.innerHTML = '<svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> ' + phone;
  if (addressEl) addressEl.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ' + address;
  if (hoursEl) hoursEl.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ' + hours;
}

function loadSettings() {
  loadAccentColor();
}

function loadAccentColor() {
  var color = localStorage.getItem('accentColor') || '#ff8c00';
  applyAccentColor(color);
  var picker = document.querySelector('.accent-option.active');
  if (!picker) {
    var first = document.querySelector('.accent-option');
    if (first) first.classList.add('active');
  }
}

function setAccentColor(color) {
  localStorage.setItem('accentColor', color);
  applyAccentColor(color);
  document.querySelectorAll('.accent-option').forEach(function (el) {
    el.classList.toggle('active', el.getAttribute('data-color') === color);
  });
}

function applyAccentColor(color) {
  document.documentElement.style.setProperty('--clr-primary', color);
}

function requestNotificationPermission() {
  if (!('Notification' in window)) {
    showToast('Notifications not supported', 'error');
    return;
  }
  Notification.requestPermission().then(function (perm) {
    if (perm === 'granted') {
      showToast('Notifications enabled', 'success');
    } else {
      showToast('Notification permission denied', 'error');
    }
  });
}

function autoRequestNotification() {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'default') return;
  var asked = localStorage.getItem('notifAsked');
  if (asked) return;
  localStorage.setItem('notifAsked', 'true');
  Notification.requestPermission();
}

function showToast(message, type) {
  type = type || 'info';
  var container = document.getElementById('toastContainer');
  if (!container) return;
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  var icon = '';
  if (type === 'success') icon = '<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
  else if (type === 'error') icon = '<svg viewBox="0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
  else icon = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  toast.innerHTML = icon + '<span>' + message + '</span>';
  container.appendChild(toast);
  setTimeout(function () {
    toast.classList.add('removing');
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3000);
}
