/* Home Kitchen client catalog — controller layer.
   STO 6: bridges existing runtime state to modular data + ProductCard layers. */
(function (global) {
  'use strict';

  if (!global.HKClientApi || !global.HKCatalogData || !global.HKProductCard || !global.HKProductDetail) {
    console.warn('[Home Kitchen] modular catalog dependencies are unavailable; legacy catalog stays active');
    return;
  }

  function setBackendStatus(markup){
    var state=document.getElementById('backendState');
    if(state)state.innerHTML=markup;
  }

  function categoriesModular() {
    return ['Все'].concat(Array.from(new Set(PRODUCTS.map(function (item) {
      return item.category;
    }))));
  }

  function selectCategoryModular(index) {
    var values = categoriesModular();
    activeCat = values[index] || 'Все';
    renderFiltersModular();
    renderCatalogModular();
  }

  function categoryLabel(value) {
    return value === 'Сырники и блинчики'
      ? 'Сырники/блины'
      : value === 'Пельмени и вареники'
        ? 'Пельмени/вареники'
        : value === 'Готовые решения'
          ? 'Готовые блюда'
          : value;
  }

  function renderFiltersModular() {
    filters.innerHTML = categoriesModular().map(function (category, index) {
      return '<button class="filter ' + (activeCat === category ? 'active' : '') +
        '" onclick="selectCategory(' + index + ')">' +
        escapeHtml(categoryLabel(category)) +
      '</button>';
    }).join('');
  }

  function findProduct(id) {
    return PRODUCTS.find(function (item) {
      return item.id === id;
    });
  }

  function badgeClassModular(productItem) {
    return global.HKProductCard.badgeClass(productItem);
  }

  function availabilityRuModular(productItem) {
    return global.HKProductCard.availabilityLabel(productItem);
  }

  function visibleProducts() {
    var search = (q.value || '').toLowerCase().trim();
    return PRODUCTS.filter(function (item) {
      var matchesCategory = activeCat === 'Все' || item.category === activeCat;
      var haystack = (item.name + ' ' + (item.description || '')).toLowerCase();
      return matchesCategory && (!search || haystack.includes(search));
    });
  }

  function openDetailModular(id) {
    var item=findProduct(id);
    if(!item)return;
    var mounted=global.HKProductDetail.mount(
      detailContent,
      item,
      meta(id),
      {
        escapeHtml:escapeHtml,
        fmt:fmt,
        photoFor:function(productId){return PHOTOS[String(productId)]||'';},
        availabilityLabel:availabilityRuModular,
        badgeClass:badgeClassModular,
        go:go,
        addCart:addCart,
        openCart:openCart,
        shareProduct:shareProduct,
        contactMarkup:function(variant){
          return global.HKClientContact&&typeof global.HKClientContact.markup==='function'
            ? global.HKClientContact.markup(variant)
            : '';
        }
      }
    );
    if(mounted)go('detail');
  }

  // Most common availability across the whole catalog (not the filtered view).
  function baselineAvailability() {
    var counts = {};
    var best = '';
    PRODUCTS.forEach(function (item) {
      counts[item.availability] = (counts[item.availability] || 0) + 1;
      if (!best || counts[item.availability] > counts[best]) best = item.availability;
    });
    return best;
  }

  function quickAdd(button) {
    var id = Number(button.dataset.quickAdd);
    var item = findProduct(id);
    if (!item || typeof global.addCart !== 'function') return;
    global.addCart(id, 1000);
    button.classList.add('is-added');
    button.setAttribute('aria-label', 'Добавлено в корзину');
    if (typeof global.toast === 'function') global.toast('Добавлено: ' + item.name + ', 1 кг', false);
    setTimeout(function () {
      button.classList.remove('is-added');
      button.setAttribute('aria-label', 'Добавить в корзину: ' + item.name + ', 1 кг');
    }, 1400);
  }

  if (grid && grid.dataset && typeof grid.addEventListener === 'function' && !grid.dataset.hkQuickAdd) {
    grid.dataset.hkQuickAdd = 'true';
    grid.addEventListener('click', function (event) {
      var button = event.target.closest('[data-quick-add]');
      if (!button || !grid.contains(button)) return;
      event.preventDefault();
      event.stopPropagation();
      quickAdd(button);
    }, true);
  }

  function renderCatalogModular() {
    var items = visibleProducts();
    catTitle.textContent = activeCat === 'Все' ? 'Каталог' : activeCat.replace(' и ', '/');
    var baseline = baselineAvailability();
    var countText = typeof global.countLabel === 'function'
      ? global.countLabel(items.length, ['товар', 'товара', 'товаров'])
      : items.length + ' товаров';
    catCount.textContent = baseline === 'preorder' && items.length ? countText + ' · готовим под заказ' : countText;

    grid.innerHTML = items.map(function (item) {
      return global.HKProductCard.render(item, {
        escapeHtml: escapeHtml,
        fmt: fmt,
        baseline: baseline,
        photoFor: function (id) {
          return PHOTOS[String(id)] || '';
        }
      });
    }).join('') || '<div class="empty" style="grid-column:1/-1">Сейчас в этой категории ничего не опубликовано.</div>';

    updateCart();
  }

  async function loadProductsModular() {
    setBackendStatus('<span class="dot"></span>Обновляем каталог…');
    try {
      PRODUCTS = await global.HKCatalogData.fetchProducts(global.HKClientApi.request);
      if(global.HKClientContact&&typeof global.HKClientContact.load==='function'){
        await global.HKClientContact.load();
      }
      cart = global.HKCatalogData.reconcileCart(cart, findProduct);
      storeJson('client_api_cart', cart);
      updateCart();

      setBackendStatus('<span class="dot ok"></span>Каталог обновлён');
      if (activeCat !== 'Все' && !PRODUCTS.some(function (item) {
        return item.category === activeCat;
      })) {
        activeCat = 'Все';
      }

      renderFiltersModular();
      renderCatalogModular();
      return PRODUCTS;
    } catch (error) {
      setBackendStatus('<span class="dot bad"></span>Не удалось обновить каталог');
      grid.innerHTML = '<div class="notice error" style="grid-column:1/-1">Не удалось загрузить каталог. Проверьте интернет и попробуйте обновить ещё раз.</div>';
      catCount.textContent = '';
      return [];
    }
  }

  global.categories = categoriesModular;
  global.selectCategory = selectCategoryModular;
  global.renderFilters = renderFiltersModular;
  global.badgeClass = badgeClassModular;
  global.availabilityRu = availabilityRuModular;
  global.product = findProduct;
  global.renderCatalog = renderCatalogModular;
  global.openDetail = openDetailModular;
  global.loadProducts = loadProductsModular;

  global.HKCatalogController = Object.freeze({
    categories: categoriesModular,
    visibleProducts: visibleProducts,
    renderCatalog: renderCatalogModular,
    openDetail: openDetailModular,
    loadProducts: loadProductsModular,
    product: findProduct
  });

  document.documentElement.dataset.hkCatalogArchitecture = 'modular-v2-client-copy';

  // app/bootstrap renders after Cart and Navigation have registered their APIs.
})(window);
