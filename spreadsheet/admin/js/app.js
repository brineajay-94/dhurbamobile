var currentUser = null;
var productsData = [];

document.addEventListener('DOMContentLoaded', function() {
  loadAdminTheme();
  var pathname = window.location.pathname;
  if (pathname.indexOf('login.html') !== -1 || pathname === '/spreadsheet/admin/' || pathname === '/spreadsheet/admin') {
    checkAuthStateLogin();
    loadAdminLogo();
    return;
  }
  checkAuthState();
  loadAdminLogo();
  if (pathname.indexOf('dashboard.html') !== -1) {
    loadDashboard();
  } else if (pathname.indexOf('products.html') !== -1) {
    loadProductsTable();
  } else if (pathname.indexOf('banners.html') !== -1) {
    loadBannersTable();
  } else if (pathname.indexOf('sliders.html') !== -1) {
    loadSlidersTable();
  } else if (pathname.indexOf('promotions.html') !== -1) {
    loadPromotionsTable();
  } else if (pathname.indexOf('brands.html') !== -1) {
    loadBrandsTable();
  } else if (pathname.indexOf('sub-banners.html') !== -1) {
    loadSubBannersTable();
  } else if (pathname.indexOf('repairs.html') !== -1) {
    loadRepairsTable();
  } else if (pathname.indexOf('notifications.html') !== -1) {
    loadNotificationsTable();
  } else if (pathname.indexOf('settings.html') !== -1) {
    loadStoreSettings();
  }
});

function checkAuthStateLogin() {
  var token = getToken();
  if (token) {
    window.location.href = 'dashboard.html';
  }
}

function checkAuthState() {
  var token = getToken();
  if (!token) {
    window.location.href = 'login.html';
    return;
  }
  currentUser = getAdminEmail();
  updateAdminAvatar();
}

function handleLogin(e) {
  e.preventDefault();
  var email = document.getElementById('email') ? document.getElementById('email').value : '';
  var password = document.getElementById('password') ? document.getElementById('password').value : '';
  var errorEl = document.getElementById('loginError');
  if (errorEl) errorEl.classList.remove('show');
  sheets_login(email, password).then(function(res) {
    if (res && res.success) {
      window.location.href = 'dashboard.html';
    } else {
      if (errorEl) {
        errorEl.textContent = res && res.error ? res.error : 'Invalid email or password';
        errorEl.classList.add('show');
      }
    }
  }).catch(function(err) {
    if (errorEl) {
      errorEl.textContent = err && err.message ? err.message : 'Login failed';
      errorEl.classList.add('show');
    }
  });
}

function handleLogout() {
  sheets_logout();
  window.location.href = 'login.html';
}

function toggleAdminTheme() {
  var html = document.documentElement;
  html.classList.toggle('dark');
  var isDark = html.classList.contains('dark');
  localStorage.setItem('admin-theme', isDark ? 'dark' : 'light');
}

function loadAdminTheme() {
  var saved = localStorage.getItem('admin-theme');
  if (saved === 'dark') {
    document.documentElement.classList.add('dark');
  }
}

function loadAdminLogo() {
  sheets_getSetting('logo').then(function(logoUrl) {
    if (!logoUrl) return;
    var logoImgs = document.querySelectorAll('.logo-img');
    for (var i = 0; i < logoImgs.length; i++) {
      logoImgs[i].src = logoUrl;
    }
    var sidebarIcons = document.querySelectorAll('.sidebar-logo-icon');
    for (var j = 0; j < sidebarIcons.length; j++) {
      sidebarIcons[j].classList.add('has-image');
    }
    var loginIcons = document.querySelectorAll('.login-logo-icon');
    for (var k = 0; k < loginIcons.length; k++) {
      loginIcons[k].classList.add('has-image');
    }
  }).catch(function() {});
}

function toggleSidebar() {
  var sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.classList.toggle('open');
  }
}

function showToast(message, type) {
  var container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + (type === 'error' ? 'error' : 'success');
  var icon = type === 'error' ? '\u2716' : '\u2714';
  toast.innerHTML = '<span class="toast-icon">' + icon + '</span>' + message;
  container.appendChild(toast);
  setTimeout(function() {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(function() {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

function openModal(id) {
  var overlay = document.getElementById(id);
  if (overlay) overlay.classList.add('open');
}

function closeModal(id) {
  var overlay = document.getElementById(id);
  if (overlay) overlay.classList.remove('open');
}

function logActivity(action, type, name) {
  var data = {
    action: action,
    type: type,
    name: name,
    timestamp: new Date().toISOString()
  };
  sheets_save('logs', null, data).catch(function() {});
}

function initImagePreview(inputId, wrapId, imgId, btnId, cropKey) {
  var input = document.getElementById(inputId);
  var wrap = document.getElementById(wrapId);
  var img = document.getElementById(imgId);
  var btn = document.getElementById(btnId);
  if (!input || !wrap || !img || !btn) return;
  var prefix = inputId.replace('Image', '');
  var cropXEl = document.getElementById(prefix + 'CropX');
  var cropYEl = document.getElementById(prefix + 'CropY');
  var cropWEl = document.getElementById(prefix + 'CropW');
  var cropHEl = document.getElementById(prefix + 'CropH');
  function updatePreview() {
    var url = input.value.trim();
    if (url) {
      img.src = url;
      var cx = cropXEl ? parseFloat(cropXEl.value) : 0;
      var cy = cropYEl ? parseFloat(cropYEl.value) : 0;
      var cw = cropWEl ? parseFloat(cropWEl.value) : 0;
      var ch = cropHEl ? parseFloat(cropHEl.value) : 0;
      if (cx || cy || cw || ch) {
        img.style.objectFit = 'cover';
        img.style.objectPosition = (-cx) + 'px ' + (-cy) + 'px';
        img.style.width = (cw || 200) + 'px';
        img.style.height = (ch || 200) + 'px';
        img.style.maxWidth = 'none';
      } else if (cropKey) {
        try {
          var stored = localStorage.getItem('crop_' + cropKey);
          if (stored) {
            var cropData = JSON.parse(stored);
            if (cropData.x || cropData.y || cropData.w || cropData.h) {
              img.style.objectFit = 'cover';
              img.style.objectPosition = (-(cropData.x || 0)) + 'px ' + (-(cropData.y || 0)) + 'px';
              img.style.width = (cropData.w || 200) + 'px';
              img.style.height = (cropData.h || 200) + 'px';
              img.style.maxWidth = 'none';
            } else { resetImgStyle(); }
          } else { resetImgStyle(); }
        } catch (e) { resetImgStyle(); }
      } else { resetImgStyle(); }
      wrap.style.display = 'inline-block';
    } else {
      wrap.style.display = 'none';
      img.src = '';
    }
  }
  function resetImgStyle() {
    img.style.objectFit = 'cover';
    img.style.objectPosition = 'center';
    img.style.width = '';
    img.style.height = '';
    img.style.maxWidth = '200px';
  }
  input.addEventListener('input', updatePreview);
  btn.addEventListener('click', function() {
    input.value = '';
    updatePreview();
  });
  updatePreview();
}

function loadDashboard() {
  Promise.all([
    sheets_getAll('products'),
    sheets_getAll('repairs'),
    sheets_getAll('notifications')
  ]).then(function(results) {
    var products = results[0] || [];
    var repairs = results[1] || [];
    var notifications = results[2] || [];
    var activeNotifications = notifications.filter(function(n) { return n.active !== false; });
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('totalRepairs').textContent = repairs.length;
    document.getElementById('activeNotifications').textContent = activeNotifications.length;
    var recentProducts = products.slice(-5).reverse();
    var tbody = document.querySelector('#recentProductsTable tbody');
    if (!tbody) return;
    if (recentProducts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding:24px;">No products yet</td></tr>';
      return;
    }
    var html = '';
    for (var i = 0; i < recentProducts.length; i++) {
      var p = recentProducts[i];
      html += '<tr>';
      html += '<td><div class="cell-flex">';
      if (p.image) {
        html += '<div class="table-img-wrap"><img class="table-img" src="' + p.image + '" alt=""></div>';
      } else {
        html += '<div class="table-img-wrap"><span class="table-img-placeholder">\uD83D\uDCF1</span></div>';
      }
      html += '<span class="font-medium">' + (p.name || '') + '</span></div></td>';
      html += '<td>' + (p.brand || '-') + '</td>';
      html += '<td>' + (p.category || '-') + '</td>';
      html += '<td class="price-cell">\u20B9' + (p.price || '0') + '</td>';
      html += '<td>' + (p.stock || '0') + '</td>';
      html += '<td>' + (p.featured ? '<span class="featured-star">\u2605</span>' : '-') + '</td>';
      html += '</tr>';
    }
    tbody.innerHTML = html;
  }).catch(function() {});
}

function loadProductsTable() {
  sheets_refresh('products').then(function(data) {
    productsData = data || [];
    filterProductsTable();
  }).catch(function() {
    productsData = [];
    filterProductsTable();
  });
}

function filterProductsTable() {
  var search = document.getElementById('searchInput');
  var category = document.getElementById('categoryFilter');
  var searchVal = search ? search.value.toLowerCase().trim() : '';
  var categoryVal = category ? category.value : '';
  var filtered = productsData;
  if (searchVal) {
    filtered = filtered.filter(function(p) {
      return (p.name && p.name.toLowerCase().indexOf(searchVal) !== -1) ||
             (p.brand && p.brand.toLowerCase().indexOf(searchVal) !== -1) ||
             (p.category && p.category.toLowerCase().indexOf(searchVal) !== -1);
    });
  }
  if (categoryVal) {
    filtered = filtered.filter(function(p) { return (p.category || '') === categoryVal; });
  }
  var tbody = document.querySelector('#productsTable tbody');
  if (!tbody) return;
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9"><div class="empty-state"><div class="empty-icon">\uD83D\uDCE6</div><h4>No products found</h4><p>Try adjusting your search or filter</p></div></td></tr>';
    return;
  }
  var html = '';
  for (var i = 0; i < filtered.length; i++) {
    var p = filtered[i];
    html += '<tr>';
    html += '<td><div class="cell-flex">';
    if (p.image) {
      html += '<div class="table-img-wrap"><img class="table-img" src="' + p.image + '" alt=""></div>';
    } else {
      html += '<div class="table-img-wrap"><span class="table-img-placeholder">\uD83D\uDCF1</span></div>';
    }
    html += '<span class="font-medium">' + (p.name || '') + '</span></div></td>';
    html += '<td>' + (p.brand || '-') + '</td>';
    html += '<td>' + (p.category || '-') + '</td>';
    html += '<td class="price-cell">\u20B9' + (p.price || '0') + '</td>';
    html += '<td>' + (p.stock || '0') + '</td>';
    html += '<td>' + (p.featured ? '<span class="featured-star">\u2605</span>' : '-') + '</td>';
    html += '<td><span class="badge badge-' + (p.featured ? 'success' : 'neutral') + '">' + (p.featured ? 'Yes' : 'No') + '</span></td>';
    html += '<td class="actions-cell">';
    html += '<a href="' + (p.url || '#') + '" target="_blank" class="btn btn-ghost btn-sm" title="View">\uD83D\uDD17</a>';
    html += '<button class="btn btn-ghost btn-sm" onclick="editProduct(\'' + p.id + '\')" title="Edit">\u270F\uFE0F</button>';
    html += '<button class="btn btn-ghost btn-sm btn-danger" onclick="deleteProduct(\'' + p.id + '\')" title="Delete">\uD83D\uDDD1\uFE0F</button>';
    html += '</td>';
    html += '</tr>';
  }
  tbody.innerHTML = html;
  var countEl = document.getElementById('productsCount');
  if (countEl) countEl.textContent = filtered.length + ' products';
}

function openProductModal() {
  var form = document.getElementById('productForm');
  if (form) form.reset();
  var title = document.getElementById('modalTitle');
  if (title) title.textContent = 'Add Product';
  var idInput = document.getElementById('productId');
  if (idInput) idInput.value = '';
  var previewWrap = document.getElementById('productPreviewWrap');
  if (previewWrap) previewWrap.style.display = 'none';
  openModal('productModal');
  initImagePreview('productImage', 'productPreviewWrap', 'productPreview', 'productRemoveImg', 'product');
}

function editProduct(id) {
  var product = null;
  for (var i = 0; i < productsData.length; i++) {
    if (productsData[i].id === id) {
      product = productsData[i];
      break;
    }
  }
  if (!product) return;
  document.getElementById('productId').value = product.id || '';
  document.getElementById('productName').value = product.name || '';
  document.getElementById('productBrand').value = product.brand || '';
  document.getElementById('productCategory').value = product.category || '';
  document.getElementById('productImage').value = product.image || '';
  document.getElementById('productPrice').value = product.price || '';
  document.getElementById('productOldPrice').value = product.oldPrice || '';
  document.getElementById('productStock').value = product.stock || '';
  document.getElementById('productFeatured').checked = !!product.featured;
  document.getElementById('productDescription').value = product.description || '';
  document.getElementById('productUrl').value = product.url || '';
  document.getElementById('productSpecs').value = product.specs || '';
  document.getElementById('cropX').value = product.cropX || '';
  document.getElementById('cropY').value = product.cropY || '';
  document.getElementById('cropW').value = product.cropW || '';
  document.getElementById('cropH').value = product.cropH || '';
  var title = document.getElementById('modalTitle');
  if (title) title.textContent = 'Edit Product';
  openModal('productModal');
  initImagePreview('productImage', 'productPreviewWrap', 'productPreview', 'productRemoveImg', 'product');
}

function saveProduct(e) {
  e.preventDefault();
  var id = document.getElementById('productId').value || null;
  var data = {
    name: document.getElementById('productName').value,
    brand: document.getElementById('productBrand').value,
    category: document.getElementById('productCategory').value,
    image: document.getElementById('productImage').value,
    price: document.getElementById('productPrice').value,
    oldPrice: document.getElementById('productOldPrice').value,
    stock: document.getElementById('productStock').value,
    featured: document.getElementById('productFeatured').checked,
    description: document.getElementById('productDescription').value,
    url: document.getElementById('productUrl').value,
    specs: document.getElementById('productSpecs').value,
    cropX: document.getElementById('cropX').value,
    cropY: document.getElementById('cropY').value,
    cropW: document.getElementById('cropW').value,
    cropH: document.getElementById('cropH').value
  };
  var btn = document.getElementById('productSubmitBtn');
  var origText = btn ? btn.textContent : 'Save';
  if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  sheets_save('products', id, data).then(function() {
    closeModal('productModal');
    showToast('Product saved successfully', 'success');
    logActivity(id ? 'Updated' : 'Added', 'Product', data.name || 'Product');
    loadProductsTable();
    if (btn) { btn.disabled = false; btn.textContent = origText; }
  }).catch(function(err) {
    if (btn) { btn.disabled = false; btn.textContent = origText; }
    showToast(err && err.message ? err.message : 'Failed to save product', 'error');
  });
}

function deleteProduct(id) {
  showConfirmModal('Are you sure you want to delete this product?').then(function(confirmed) {
    if (!confirmed) return;
    sheets_delete('products', id).then(function() {
      showToast('Product deleted successfully', 'success');
      logActivity('Deleted', 'Product', '');
      loadProductsTable();
    }).catch(function(err) {
      showToast(err && err.message ? err.message : 'Failed to delete product', 'error');
    });
  });
}

function loadBannersTable() {
  sheets_refresh('banners').then(function(data) {
    var banners = data || [];
    var tbody = document.querySelector('#bannersTable tbody');
    if (!tbody) return;
    if (banners.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">\uD83D\uDDBC\uFE0F</div><h4>No banners yet</h4><p>Click "Add Banner" to create one</p></div></td></tr>';
      return;
    }
    var html = '';
    for (var i = 0; i < banners.length; i++) {
      var b = banners[i];
      var cropStyle = '';
      if (b.cropW && b.cropH) {
        var cx = (b.cropX || 0) + (b.cropW || 100) / 2;
        var cy = (b.cropY || 0) + (b.cropH || 100) / 2;
        cropStyle = 'style="object-fit:cover;object-position:' + cx.toFixed(1) + '% ' + cy.toFixed(1) + '%;"';
      }
      html += '<tr>';
      html += '<td><div class="table-img-wrap"><img class="table-img" src="' + (b.image || '') + '" alt="" ' + cropStyle + '></div></td>';
      html += '<td class="font-medium">' + (b.title || '-') + '</td>';
      html += '<td>' + (b.ctaText || '-') + '</td>';
      html += '<td>' + (b.order || '0') + '</td>';
      html += '<td class="actions-cell">';
      html += '<button class="btn btn-ghost btn-sm" onclick="editBanner(\'' + b.id + '\')">\u270F\uFE0F</button>';
      html += '<button class="btn btn-ghost btn-sm btn-danger" onclick="deleteBanner(\'' + b.id + '\')">\uD83D\uDDD1\uFE0F</button>';
      html += '</td>';
      html += '</tr>';
    }
    tbody.innerHTML = html;
  }).catch(function(err) {
    var tbody = document.querySelector('#bannersTable tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="padding:40px;text-align:center;color:var(--danger);">Failed to load banners. Check your API connection.</td></tr>';
  });
}

function openBannerModal() {
  var form = document.getElementById('bannerForm');
  if (form) form.reset();
  document.getElementById('bannerModalTitle').textContent = 'Add Banner';
  document.getElementById('bannerId').value = '';
  if (document.getElementById('bannerCropX')) {
    document.getElementById('bannerCropX').value = '';
    document.getElementById('bannerCropY').value = '';
    document.getElementById('bannerCropW').value = '';
    document.getElementById('bannerCropH').value = '';
  }
  document.getElementById('bannerSubmitBtn').textContent = 'Save';
  openModal('bannerModal');
  setTimeout(function() {
    initImagePreview('bannerImage', 'bannerPreviewWrap', 'bannerPreview', 'bannerCropBtn', 'banner');
  }, 100);
}

function editBanner(id) {
  sheets_getById('banners', id).then(function(b) {
    if (!b) return;
    document.getElementById('bannerId').value = b.id || '';
    document.getElementById('bannerTitle').value = b.title || '';
    document.getElementById('bannerSubtitle').value = b.description || '';
    document.getElementById('bannerBtnText').value = b.ctaText || '';
    document.getElementById('bannerLink').value = b.ctaLink || '';
    document.getElementById('bannerImage').value = b.image || '';
    document.getElementById('bannerOrder').value = b.order || 0;
    if (document.getElementById('bannerCropX')) {
      document.getElementById('bannerCropX').value = b.cropX || '';
      document.getElementById('bannerCropY').value = b.cropY || '';
      document.getElementById('bannerCropW').value = b.cropW || '';
      document.getElementById('bannerCropH').value = b.cropH || '';
      if (b.cropX || b.cropY || b.cropW || b.cropH) {
        try { localStorage.setItem('crop_banner', JSON.stringify({ x: b.cropX || 0, y: b.cropY || 0, w: b.cropW || 200, h: b.cropH || 200 })); } catch (e) {}
      }
    }
    document.getElementById('bannerModalTitle').textContent = 'Edit Banner';
    document.getElementById('bannerSubmitBtn').textContent = 'Update';
    openModal('bannerModal');
    setTimeout(function() {
      initImagePreview('bannerImage', 'bannerPreviewWrap', 'bannerPreview', 'bannerCropBtn', 'banner');
    }, 100);
  }).catch(function() {});
}

function saveBanner(e) {
  e.preventDefault();
  var id = document.getElementById('bannerId').value || null;
  var data = {
    title: document.getElementById('bannerTitle').value,
    description: document.getElementById('bannerSubtitle').value,
    ctaText: document.getElementById('bannerBtnText').value,
    ctaLink: document.getElementById('bannerLink').value,
    image: document.getElementById('bannerImage').value,
    active: true,
    order: parseInt(document.getElementById('bannerOrder').value) || 0
  };
  if (document.getElementById('bannerCropX')) {
    var cx = document.getElementById('bannerCropX').value;
    var cy = document.getElementById('bannerCropY').value;
    var cw = document.getElementById('bannerCropW').value;
    var ch = document.getElementById('bannerCropH').value;
    if (cx && cy && cw && ch) {
      data.cropX = parseFloat(cx);
      data.cropY = parseFloat(cy);
      data.cropW = parseFloat(cw);
      data.cropH = parseFloat(ch);
    }
  }
  sheets_save('banners', id, data).then(function() {
    closeModal('bannerModal');
    showToast('Banner saved successfully', 'success');
    logActivity(id ? 'Updated' : 'Added', 'Banner', data.title || 'Banner');
    loadBannersTable();
  }).catch(function(err) {
    showToast(err && err.message ? err.message : 'Failed to save banner', 'error');
  });
}

function deleteBanner(id) {
  showConfirmModal('Are you sure you want to delete this banner?').then(function(confirmed) {
    if (!confirmed) return;
    sheets_delete('banners', id).then(function() {
      showToast('Banner deleted successfully', 'success');
      logActivity('Deleted', 'Banner', '');
      loadBannersTable();
    }).catch(function(err) {
      showToast(err && err.message ? err.message : 'Failed to delete banner', 'error');
    });
  });
}

function loadSlidersTable() {
  sheets_refresh('sliders').then(function(data) {
    var sliders = data || [];
    var tbody = document.querySelector('#slidersTable tbody');
    if (!tbody) return;
    if (sliders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">\uD83C\uDFAC</div><h4>No sliders yet</h4><p>Click "Add Slider" to create one</p></div></td></tr>';
      return;
    }
    var html = '';
    for (var i = 0; i < sliders.length; i++) {
      var s = sliders[i];
      html += '<tr>';
      html += '<td><div class="table-img-wrap"><img class="table-img" src="' + (s.image || '') + '" alt=""></div></td>';
      html += '<td>' + (s.title || '-') + '</td>';
      html += '<td class="truncate" style="max-width:150px;">' + (s.subtitle || '-') + '</td>';
      html += '<td><span class="badge badge-' + (s.active ? 'success' : 'danger') + '">' + (s.active ? 'Active' : 'Inactive') + '</span></td>';
      html += '<td>' + (s.order || '0') + '</td>';
      html += '<td class="actions-cell">';
      html += '<button class="btn btn-ghost btn-sm" onclick="editSlider(\'' + s.id + '\')">\u270F\uFE0F</button>';
      html += '<button class="btn btn-ghost btn-sm btn-danger" onclick="deleteSlider(\'' + s.id + '\')">\uD83D\uDDD1\uFE0F</button>';
      html += '</td>';
      html += '</tr>';
    }
    tbody.innerHTML = html;
  }).catch(function(err) {
    var tbody = document.querySelector('#slidersTable tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="padding:40px;text-align:center;color:var(--danger);">Failed to load sliders. Check your API connection.</td></tr>';
  });
}

function openSliderModal() {
  var form = document.getElementById('sliderForm');
  if (form) form.reset();
  document.getElementById('sliderModalTitle').textContent = 'Add Slider';
  document.getElementById('sliderId').value = '';
  var wrap = document.getElementById('sliderPreviewWrap');
  if (wrap) wrap.style.display = 'none';
  openModal('sliderModal');
  setTimeout(function() {
    initImagePreview('sliderImage', 'sliderPreviewWrap', 'sliderPreview', 'sliderRemoveImg', 'slider');
  }, 100);
}

function editSlider(id) {
  sheets_getById('sliders', id).then(function(s) {
    if (!s) return;
    document.getElementById('sliderId').value = s.id || '';
    document.getElementById('sliderImage').value = s.image || '';
    document.getElementById('sliderTitle').value = s.title || '';
    document.getElementById('sliderSubtitle').value = s.subtitle || '';
    document.getElementById('sliderLink').value = s.link || '';
    document.getElementById('sliderActive').checked = !!s.active;
    document.getElementById('sliderOrder').value = s.order || '';
    document.getElementById('sliderModalTitle').textContent = 'Edit Slider';
    openModal('sliderModal');
    setTimeout(function() {
      initImagePreview('sliderImage', 'sliderPreviewWrap', 'sliderPreview', 'sliderRemoveImg', 'slider');
    }, 100);
  }).catch(function() {});
}

function saveSlider(e) {
  e.preventDefault();
  var id = document.getElementById('sliderId').value || null;
  var data = {
    image: document.getElementById('sliderImage').value,
    title: document.getElementById('sliderTitle').value,
    subtitle: document.getElementById('sliderSubtitle').value,
    link: document.getElementById('sliderLink').value,
    active: document.getElementById('sliderActive').checked,
    order: document.getElementById('sliderOrder').value
  };
  sheets_save('sliders', id, data).then(function() {
    closeModal('sliderModal');
    showToast('Slider saved successfully', 'success');
    logActivity(id ? 'Updated' : 'Added', 'Slider', data.title || 'Slider');
    loadSlidersTable();
  }).catch(function(err) {
    showToast(err && err.message ? err.message : 'Failed to save slider', 'error');
  });
}

function deleteSlider(id) {
  showConfirmModal('Are you sure you want to delete this slider?').then(function(confirmed) {
    if (!confirmed) return;
    sheets_delete('sliders', id).then(function() {
      showToast('Slider deleted successfully', 'success');
      logActivity('Deleted', 'Slider', '');
      loadSlidersTable();
    }).catch(function(err) {
      showToast(err && err.message ? err.message : 'Failed to delete slider', 'error');
    });
  });
}

function loadPromotionsTable() {
  sheets_refresh('promotions').then(function(data) {
    var promotions = data || [];
    var tbody = document.querySelector('#promotionsTable tbody');
    if (!tbody) return;
    if (promotions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">\uD83C\uDF89</div><h4>No promotions yet</h4><p>Click "Add Promotion" to create one</p></div></td></tr>';
      return;
    }
    var html = '';
    for (var i = 0; i < promotions.length; i++) {
      var p = promotions[i];
      html += '<tr>';
      html += '<td><div class="table-img-wrap"><img class="table-img" src="' + (p.image || '') + '" alt=""></div></td>';
      html += '<td>' + (p.title || '-') + '</td>';
      html += '<td class="truncate" style="max-width:150px;">' + (p.description || '-') + '</td>';
      html += '<td><span class="badge badge-' + (p.active ? 'success' : 'danger') + '">' + (p.active ? 'Active' : 'Inactive') + '</span></td>';
      html += '<td>' + (p.order || '0') + '</td>';
      html += '<td class="actions-cell">';
      html += '<button class="btn btn-ghost btn-sm" onclick="editPromotion(\'' + p.id + '\')">\u270F\uFE0F</button>';
      html += '<button class="btn btn-ghost btn-sm btn-danger" onclick="deletePromotion(\'' + p.id + '\')">\uD83D\uDDD1\uFE0F</button>';
      html += '</td>';
      html += '</tr>';
    }
    tbody.innerHTML = html;
  }).catch(function(err) {
    var tbody = document.querySelector('#promotionsTable tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="padding:40px;text-align:center;color:var(--danger);">Failed to load promotions. Check your API connection.</td></tr>';
  });
}

function openPromotionModal() {
  var form = document.getElementById('promotionForm');
  if (form) form.reset();
  document.getElementById('promotionModalTitle').textContent = 'Add Promotion';
  document.getElementById('promotionId').value = '';
  var wrap = document.getElementById('promotionPreviewWrap');
  if (wrap) wrap.style.display = 'none';
  openModal('promotionModal');
  setTimeout(function() {
    initImagePreview('promotionImage', 'promotionPreviewWrap', 'promotionPreview', 'promotionRemoveImg', 'promotion');
  }, 100);
}

function editPromotion(id) {
  sheets_getById('promotions', id).then(function(p) {
    if (!p) return;
    document.getElementById('promotionId').value = p.id || '';
    document.getElementById('promotionImage').value = p.image || '';
    document.getElementById('promotionTitle').value = p.title || '';
    document.getElementById('promotionDescription').value = p.description || '';
    document.getElementById('promotionLink').value = p.link || '';
    document.getElementById('promotionActive').checked = !!p.active;
    document.getElementById('promotionOrder').value = p.order || '';
    document.getElementById('promotionModalTitle').textContent = 'Edit Promotion';
    openModal('promotionModal');
    setTimeout(function() {
      initImagePreview('promotionImage', 'promotionPreviewWrap', 'promotionPreview', 'promotionRemoveImg', 'promotion');
    }, 100);
  }).catch(function() {});
}

function savePromotion(e) {
  e.preventDefault();
  var id = document.getElementById('promotionId').value || null;
  var data = {
    image: document.getElementById('promotionImage').value,
    title: document.getElementById('promotionTitle').value,
    description: document.getElementById('promotionDescription').value,
    link: document.getElementById('promotionLink').value,
    active: document.getElementById('promotionActive').checked,
    order: document.getElementById('promotionOrder').value
  };
  sheets_save('promotions', id, data).then(function() {
    closeModal('promotionModal');
    showToast('Promotion saved successfully', 'success');
    logActivity(id ? 'Updated' : 'Added', 'Promotion', data.title || 'Promotion');
    loadPromotionsTable();
  }).catch(function(err) {
    showToast(err && err.message ? err.message : 'Failed to save promotion', 'error');
  });
}

function deletePromotion(id) {
  showConfirmModal('Are you sure you want to delete this promotion?').then(function(confirmed) {
    if (!confirmed) return;
    sheets_delete('promotions', id).then(function() {
      showToast('Promotion deleted successfully', 'success');
      logActivity('Deleted', 'Promotion', '');
      loadPromotionsTable();
    }).catch(function(err) {
      showToast(err && err.message ? err.message : 'Failed to delete promotion', 'error');
    });
  });
}

function loadBrandsTable() {
  sheets_refresh('brands').then(function(data) {
    var brands = data || [];
    var tbody = document.querySelector('#brandsTable tbody');
    if (!tbody) return;
    if (brands.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3"><div class="empty-state"><div class="empty-icon">\uD83C\uDFF7</div><h4>No brands yet</h4><p>Click "Add Brand" to create one</p></div></td></tr>';
      return;
    }
    var html = '';
    for (var i = 0; i < brands.length; i++) {
      var b = brands[i];
      html += '<tr>';
      html += '<td class="font-medium">' + (b.name || '-') + '</td>';
      html += '<td>' + (b.order || '0') + '</td>';
      html += '<td class="actions-cell">';
      html += '<button class="btn btn-ghost btn-sm" onclick="editBrand(\'' + b.id + '\')">\u270F\uFE0F</button>';
      html += '<button class="btn btn-ghost btn-sm btn-danger" onclick="deleteBrand(\'' + b.id + '\')">\uD83D\uDDD1\uFE0F</button>';
      html += '</td>';
      html += '</tr>';
    }
    tbody.innerHTML = html;
  }).catch(function(err) {
    var tbody = document.querySelector('#brandsTable tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="3" style="padding:40px;text-align:center;color:var(--danger);">Failed to load brands. Check your API connection.</td></tr>';
  });
}

function openBrandModal() {
  var form = document.getElementById('brandForm');
  if (form) form.reset();
  document.getElementById('brandModalTitle').textContent = 'Add Brand';
  document.getElementById('brandId').value = '';
  openModal('brandModal');
}

function editBrand(id) {
  sheets_getById('brands', id).then(function(b) {
    if (!b) return;
    document.getElementById('brandId').value = b.id || '';
    document.getElementById('brandName').value = b.name || '';
    document.getElementById('brandOrder').value = b.order || '';
    document.getElementById('brandModalTitle').textContent = 'Edit Brand';
    openModal('brandModal');
  }).catch(function() {});
}

function saveBrand(e) {
  e.preventDefault();
  var id = document.getElementById('brandId').value || null;
  var data = {
    name: document.getElementById('brandName').value,
    order: document.getElementById('brandOrder').value
  };
  sheets_save('brands', id, data).then(function() {
    closeModal('brandModal');
    showToast('Brand saved successfully', 'success');
    logActivity(id ? 'Updated' : 'Added', 'Brand', data.name || 'Brand');
    loadBrandsTable();
  }).catch(function(err) {
    showToast(err && err.message ? err.message : 'Failed to save brand', 'error');
  });
}

function deleteBrand(id) {
  showConfirmModal('Are you sure you want to delete this brand?').then(function(confirmed) {
    if (!confirmed) return;
    sheets_delete('brands', id).then(function() {
      showToast('Brand deleted successfully', 'success');
      logActivity('Deleted', 'Brand', '');
      loadBrandsTable();
    }).catch(function(err) {
      showToast(err && err.message ? err.message : 'Failed to delete brand', 'error');
    });
  });
}

function loadSubBannersTable() {
  sheets_refresh('subBanners').then(function(data) {
    var items = data || [];
    var tbody = document.querySelector('#subBannersTable tbody');
    if (!tbody) return;
    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">\uD83D\uDDBC\uFE0F</div><h4>No sub banners yet</h4><p>Click "Add Sub Banner" to create one</p></div></td></tr>';
      return;
    }
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var s = items[i];
      var cropStyle = '';
      if (s.cropW && s.cropH) {
        var cx = (s.cropX || 0) + (s.cropW || 100) / 2;
        var cy = (s.cropY || 0) + (s.cropH || 100) / 2;
        cropStyle = 'style="object-fit:cover;object-position:' + cx.toFixed(1) + '% ' + cy.toFixed(1) + '%;"';
      }
      html += '<tr>';
      html += '<td><div class="table-img-wrap"><img class="table-img" src="' + (s.image || '') + '" alt="" ' + cropStyle + '></div></td>';
      html += '<td>' + (s.title || '-') + '</td>';
      html += '<td class="truncate" style="max-width:150px;">' + (s.description || '-') + '</td>';
      html += '<td><span class="badge badge-' + (s.active !== false ? 'success' : 'danger') + '">' + (s.active !== false ? 'Active' : 'Inactive') + '</span></td>';
      html += '<td>' + (s.order || '0') + '</td>';
      html += '<td class="actions-cell">';
      html += '<button class="btn btn-ghost btn-sm" onclick="editSubBanner(\'' + s.id + '\')">\u270F\uFE0F</button>';
      html += '<button class="btn btn-ghost btn-sm btn-danger" onclick="deleteSubBanner(\'' + s.id + '\')">\uD83D\uDDD1\uFE0F</button>';
      html += '</td>';
      html += '</tr>';
    }
    tbody.innerHTML = html;
  }).catch(function(err) {
    var tbody = document.querySelector('#subBannersTable tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" style="padding:40px;text-align:center;color:var(--clr-danger);">Failed to load sub banners. Check your API connection.</td></tr>';
    }
  });
}

function openSubBannerModal() {
  var form = document.getElementById('subBannerForm');
  if (form) form.reset();
  document.getElementById('subBannerModalTitle').textContent = 'Add Sub Banner';
  document.getElementById('subBannerId').value = '';
  if (document.getElementById('subBannerCropX')) {
    document.getElementById('subBannerCropX').value = '';
    document.getElementById('subBannerCropY').value = '';
    document.getElementById('subBannerCropW').value = '';
    document.getElementById('subBannerCropH').value = '';
  }
  document.getElementById('subBannerSubmitBtn').textContent = 'Save';
  openModal('subBannerModal');
  setTimeout(function() {
    initImagePreview('subBannerImage', 'subBannerPreviewWrap', 'subBannerPreview', 'subBannerCropBtn', 'subBanner');
  }, 100);
}

function editSubBanner(id) {
  sheets_getById('subBanners', id).then(function(s) {
    if (!s) return;
    document.getElementById('subBannerId').value = s.id || '';
    document.getElementById('subBannerImage').value = s.image || '';
    document.getElementById('subBannerTitle').value = s.title || '';
    document.getElementById('subBannerDescription').value = s.description || '';
    document.getElementById('subBannerActive').checked = s.active !== false;
    document.getElementById('subBannerOrder').value = s.order || '';
    if (document.getElementById('subBannerCropX')) {
      document.getElementById('subBannerCropX').value = s.cropX || '';
      document.getElementById('subBannerCropY').value = s.cropY || '';
      document.getElementById('subBannerCropW').value = s.cropW || '';
      document.getElementById('subBannerCropH').value = s.cropH || '';
      if (s.cropX || s.cropY || s.cropW || s.cropH) {
        try { localStorage.setItem('crop_subBanner', JSON.stringify({ x: s.cropX || 0, y: s.cropY || 0, w: s.cropW || 200, h: s.cropH || 200 })); } catch (e) {}
      }
    }
    document.getElementById('subBannerModalTitle').textContent = 'Edit Sub Banner';
    document.getElementById('subBannerSubmitBtn').textContent = 'Update';
    openModal('subBannerModal');
    setTimeout(function() {
      initImagePreview('subBannerImage', 'subBannerPreviewWrap', 'subBannerPreview', 'subBannerCropBtn', 'subBanner');
    }, 100);
  }).catch(function() {});
}

function saveSubBanner(e) {
  e.preventDefault();
  var id = document.getElementById('subBannerId').value || null;
  var data = {
    image: document.getElementById('subBannerImage').value,
    title: document.getElementById('subBannerTitle').value,
    description: document.getElementById('subBannerDescription').value,
    active: document.getElementById('subBannerActive').checked,
    order: parseInt(document.getElementById('subBannerOrder').value) || 0
  };
  if (document.getElementById('subBannerCropX')) {
    var cx = document.getElementById('subBannerCropX').value;
    var cy = document.getElementById('subBannerCropY').value;
    var cw = document.getElementById('subBannerCropW').value;
    var ch = document.getElementById('subBannerCropH').value;
    if (cx && cy && cw && ch) {
      data.cropX = parseFloat(cx);
      data.cropY = parseFloat(cy);
      data.cropW = parseFloat(cw);
      data.cropH = parseFloat(ch);
    }
  }
  sheets_save('subBanners', id, data).then(function() {
    closeModal('subBannerModal');
    showToast('Sub banner saved successfully', 'success');
    logActivity(id ? 'Updated' : 'Added', 'Sub Banner', data.title || 'Sub Banner');
    loadSubBannersTable();
  }).catch(function(err) {
    showToast(err && err.message ? err.message : 'Failed to save sub banner', 'error');
  });
}

function deleteSubBanner(id) {
  showConfirmModal('Are you sure you want to delete this sub banner?').then(function(confirmed) {
    if (!confirmed) return;
    sheets_delete('subBanners', id).then(function() {
      showToast('Sub banner deleted successfully', 'success');
      logActivity('Deleted', 'Sub Banner', '');
      loadSubBannersTable();
    }).catch(function(err) {
      showToast(err && err.message ? err.message : 'Failed to delete sub banner', 'error');
    });
  });
}

function loadRepairsTable() {
  sheets_refresh('repairs').then(function(data) {
    var repairs = data || [];
    var tbody = document.querySelector('#repairsTable tbody');
    if (!tbody) return;
    if (repairs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">\uD83D\uDD27</div><h4>No repair requests yet</h4><p>New repairs will appear here</p></div></td></tr>';
      return;
    }
    var html = '';
    for (var i = 0; i < repairs.length; i++) {
      var r = repairs[i];
      var statusClass = 'neutral';
      var statusLabel = r.status || 'Pending';
      if (statusLabel === 'Completed' || statusLabel === 'Done') {
        statusClass = 'success';
      } else if (statusLabel === 'In Progress' || statusLabel === 'Processing') {
        statusClass = 'warning';
      } else if (statusLabel === 'Cancelled' || statusLabel === 'Rejected') {
        statusClass = 'danger';
      } else {
        statusClass = 'info';
      }
      html += '<tr>';
      html += '<td class="font-medium">' + (r.customer || '-') + '</td>';
      html += '<td>' + (r.device || '-') + '</td>';
      html += '<td class="truncate" style="max-width:150px;">' + (r.issue || '-') + '</td>';
      html += '<td>' + (r.phone || '-') + '</td>';
      html += '<td class="price-cell">\u20B9' + (r.cost || '0') + '</td>';
      html += '<td><span class="badge badge-' + statusClass + '">' + statusLabel + '</span></td>';
      html += '<td>' + (r.date || '-') + '</td>';
      html += '<td class="actions-cell">';
      html += '<button class="btn btn-ghost btn-sm" onclick="editRepair(\'' + r.id + '\')">\u270F\uFE0F</button>';
      html += '<button class="btn btn-ghost btn-sm btn-danger" onclick="deleteRepair(\'' + r.id + '\')">\uD83D\uDDD1\uFE0F</button>';
      html += '</td>';
      html += '</tr>';
    }
    tbody.innerHTML = html;
  }).catch(function(err) {
    var tbody = document.querySelector('#repairsTable tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="padding:40px;text-align:center;color:var(--danger);">Failed to load repairs. Check your API connection.</td></tr>';
  });
}

function openRepairModal() {
  var form = document.getElementById('repairForm');
  if (form) form.reset();
  document.getElementById('repairModalTitle').textContent = 'Add Repair';
  document.getElementById('repairId').value = '';
  openModal('repairModal');
}

function editRepair(id) {
  sheets_getById('repairs', id).then(function(r) {
    if (!r) return;
    document.getElementById('repairId').value = r.id || '';
    document.getElementById('repairCustomer').value = r.customer || '';
    document.getElementById('repairDevice').value = r.device || '';
    document.getElementById('repairIssue').value = r.issue || '';
    document.getElementById('repairPhone').value = r.phone || '';
    document.getElementById('repairCost').value = r.cost || '';
    document.getElementById('repairStatus').value = r.status || 'Pending';
    document.getElementById('repairDate').value = r.date || '';
    document.getElementById('repairModalTitle').textContent = 'Edit Repair';
    openModal('repairModal');
  }).catch(function() {});
}

function saveRepair(e) {
  e.preventDefault();
  var id = document.getElementById('repairId').value || null;
  var data = {
    customer: document.getElementById('repairCustomer').value,
    device: document.getElementById('repairDevice').value,
    issue: document.getElementById('repairIssue').value,
    phone: document.getElementById('repairPhone').value,
    cost: document.getElementById('repairCost').value,
    status: document.getElementById('repairStatus').value,
    date: document.getElementById('repairDate').value
  };
  sheets_save('repairs', id, data).then(function() {
    closeModal('repairModal');
    showToast('Repair saved successfully', 'success');
    logActivity(id ? 'Updated' : 'Added', 'Repair', data.customer || 'Repair');
    loadRepairsTable();
  }).catch(function(err) {
    showToast(err && err.message ? err.message : 'Failed to save repair', 'error');
  });
}

function deleteRepair(id) {
  showConfirmModal('Are you sure you want to delete this repair?').then(function(confirmed) {
    if (!confirmed) return;
    sheets_delete('repairs', id).then(function() {
      showToast('Repair deleted successfully', 'success');
      logActivity('Deleted', 'Repair', '');
      loadRepairsTable();
    }).catch(function(err) {
      showToast(err && err.message ? err.message : 'Failed to delete repair', 'error');
    });
  });
}

function loadNotificationsTable() {
  sheets_refresh('notifications').then(function(data) {
    var notifications = data || [];
    var tbody = document.querySelector('#notificationsTable tbody');
    if (!tbody) return;
    if (notifications.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">\uD83D\uDD14</div><h4>No notifications yet</h4><p>Click "Add Notification" to create one</p></div></td></tr>';
      return;
    }
    var html = '';
    for (var i = 0; i < notifications.length; i++) {
      var n = notifications[i];
      html += '<tr>';
      html += '<td class="font-medium">' + (n.title || '-') + '</td>';
      html += '<td class="truncate" style="max-width:200px;">' + (n.message || '-') + '</td>';
      html += '<td>' + (n.date || '-') + '</td>';
      html += '<td>' + (n.time || '-') + '</td>';
      html += '<td class="actions-cell">';
      html += '<button class="btn btn-ghost btn-sm" onclick="editNotification(\'' + n.id + '\')">\u270F\uFE0F</button>';
      html += '<button class="btn btn-ghost btn-sm btn-danger" onclick="deleteNotification(\'' + n.id + '\')">\uD83D\uDDD1\uFE0F</button>';
      html += '</td>';
      html += '</tr>';
    }
    tbody.innerHTML = html;
  }).catch(function(err) {
    var tbody = document.querySelector('#notificationsTable tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="padding:40px;text-align:center;color:var(--danger);">Failed to load notifications. Check your API connection.</td></tr>';
  });
}

function openNotificationModal() {
  var form = document.getElementById('notificationForm');
  if (form) form.reset();
  document.getElementById('notificationModalTitle').textContent = 'Add Notification';
  document.getElementById('notificationId').value = '';
  var now = new Date();
  var dateStr = now.toISOString().split('T')[0];
  var timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
  var dateInput = document.getElementById('notificationDate');
  if (dateInput) dateInput.value = dateStr;
  var timeInput = document.getElementById('notificationTime');
  if (timeInput) timeInput.value = timeStr;
  openModal('notificationModal');
}

function editNotification(id) {
  sheets_getById('notifications', id).then(function(n) {
    if (!n) return;
    document.getElementById('notificationId').value = n.id || '';
    document.getElementById('notificationTitle').value = n.title || '';
    document.getElementById('notificationMessage').value = n.message || '';
    document.getElementById('notificationDate').value = n.date || '';
    document.getElementById('notificationTime').value = n.time || '';
    document.getElementById('notificationModalTitle').textContent = 'Edit Notification';
    openModal('notificationModal');
  }).catch(function() {});
}

function saveNotification(e) {
  e.preventDefault();
  var id = document.getElementById('notificationId').value || null;
  var data = {
    title: document.getElementById('notificationTitle').value,
    message: document.getElementById('notificationMessage').value,
    date: document.getElementById('notificationDate').value,
    time: document.getElementById('notificationTime').value,
    timestamp: new Date().toISOString()
  };
  sheets_save('notifications', id, data).then(function() {
    closeModal('notificationModal');
    showToast('Notification saved successfully', 'success');
    logActivity(id ? 'Updated' : 'Added', 'Notification', data.title || 'Notification');
    loadNotificationsTable();
  }).catch(function(err) {
    showToast(err && err.message ? err.message : 'Failed to save notification', 'error');
  });
}

function deleteNotification(id) {
  showConfirmModal('Are you sure you want to delete this notification?').then(function(confirmed) {
    if (!confirmed) return;
    sheets_delete('notifications', id).then(function() {
      showToast('Notification deleted successfully', 'success');
      logActivity('Deleted', 'Notification', '');
      loadNotificationsTable();
    }).catch(function(err) {
      showToast(err && err.message ? err.message : 'Failed to delete notification', 'error');
    });
  });
}

function loadStoreSettings() {
  sheets_getAll('settings').then(function(data) {
    var settings = {};
    if (data) {
      for (var i = 0; i < data.length; i++) {
        if (data[i].key) {
          settings[data[i].key] = data[i].value;
        }
      }
    }
    var fields = ['name', 'description', 'phone', 'email', 'address', 'hours', 'map', 'logo'];
    for (var j = 0; j < fields.length; j++) {
      var el = document.getElementById('setting' + fields[j].charAt(0).toUpperCase() + fields[j].slice(1));
      if (el) el.value = settings[fields[j]] || '';
    }
    var heroToggle = document.getElementById('settingHeroOverlay');
    if (heroToggle) {
      heroToggle.checked = settings.heroOverlay === 'true';
    }
    var logoPreview = document.getElementById('settingsLogoPreview');
    var logoWrap = document.getElementById('settingsLogoPreviewWrap');
    if (settings.logo && logoPreview && logoWrap) {
      logoPreview.src = settings.logo;
      logoWrap.style.display = 'inline-block';
    }
  }).catch(function() {});
}

function saveStoreSettings(e) {
  e.preventDefault();
  var fields = ['name', 'description', 'phone', 'email', 'address', 'hours', 'map', 'logo'];
  var promises = [];
  for (var i = 0; i < fields.length; i++) {
    var el = document.getElementById('setting' + fields[i].charAt(0).toUpperCase() + fields[i].slice(1));
    var val = el ? el.value : '';
    var key = fields[i];
    promises.push(sheets_save('settings', key, { key: key, value: val }));
  }
  var heroToggle = document.getElementById('settingHeroOverlay');
  var heroVal = heroToggle && heroToggle.checked ? 'true' : 'false';
  promises.push(sheets_save('settings', 'heroOverlay', { key: 'heroOverlay', value: heroVal }));
  Promise.all(promises).then(function() {
    showToast('Settings saved successfully', 'success');
    loadAdminLogo();
  }).catch(function(err) {
    showToast(err && err.message ? err.message : 'Failed to save settings', 'error');
  });
}

function showConfirmModal(message) {
  return new Promise(function(resolve) {
    var existing = document.querySelector('.confirm-overlay');
    if (existing) existing.parentNode.removeChild(existing);
    var overlay = document.createElement('div');
    overlay.className = 'confirm-overlay open';
    overlay.innerHTML = '<div class="confirm-box"><div class="confirm-icon">\u26A0\uFE0F</div><h4>Confirm</h4><p>' + message + '</p><div class="confirm-actions"><button class="btn btn-secondary" id="confirmCancel">Cancel</button><button class="btn btn-primary" id="confirmOk">Confirm</button></div></div>';
    document.body.appendChild(overlay);
    document.getElementById('confirmOk').focus();
    function cleanup() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
    document.getElementById('confirmOk').addEventListener('click', function() {
      cleanup();
      resolve(true);
    });
    document.getElementById('confirmCancel').addEventListener('click', function() {
      cleanup();
      resolve(false);
    });
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        cleanup();
        resolve(false);
      }
    });
  });
}

function cropImgStyle(item) {
  if (!item) return '';
  var x = item.cropX || 0;
  var y = item.cropY || 0;
  var w = item.cropW || 300;
  var h = item.cropH || 300;
  return 'object-fit:cover;object-position:' + (-x) + 'px ' + (-y) + 'px;width:' + w + 'px;height:' + h + 'px;';
}

function updateAdminAvatar() {
  if (!currentUser) return;
  var avatars = document.querySelectorAll('.admin-avatar');
  var letter = currentUser.charAt(0).toUpperCase();
  for (var i = 0; i < avatars.length; i++) {
    avatars[i].textContent = letter;
  }
}
