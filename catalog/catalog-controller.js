/* Home Kitchen client catalog — controller layer.
   STO 6: bridges existing runtime state to modular data + ProductCard layers.
   The legacy inline functions remain as rollback fallback. */
(function (global) {
  'use strict';

  if (!global.HKClientApi || !global.HKCatalogData || !global.HKProductCard || !global.HKProductDetail) {
    console.warn('[Home Kitchen] modular catalog dependencies are unavailable; legacy catalog stays active');
    return;
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

  function renderCatalogModular() {
    var items = visibleProducts();
    catTitle.textContent = activeCat === 'Все' ? 'Каталог' : activeCat.replace(' и ', '/');
    catCount.textContent = items.length + ' товаров';

    grid.innerHTML = items.map(function (item) {
      return global.HKProductCard.render(item, {
        escapeHtml: escapeHtml,
        fmt: fmt,
        photoFor: function (id) {
          return PHOTOS[String(id)] || '';
        }
      });
    }).join('') || '<div class="empty" style="grid-column:1/-1">Сейчас в этой категории ничего не опубликовано.</div>';

    updateCart();
  }

  async function loadProductsModular() {
    backendState.innerHTML = '<span class="dot"></span>Подключение к Supabase…';
    try {
      PRODUCTS = await global.HKCatalogData.fetchProducts(global.HKClientApi.request);
      if(global.HKClientContact&&typeof global.HKClientContact.load==='function'){
        await global.HKClientContact.load();
      }
      cart = global.HKCatalogData.reconcileCart(cart, findProduct);
      storeJson('client_api_cart', cart);
      updateCart();

      backendState.innerHTML = '<span class="dot ok"></span>Supabase · каталог синхронизирован';
      if (activeCat !== 'Все' && !PRODUCTS.some(function (item) {
        return item.category === activeCat;
      })) {
        activeCat = 'Все';
      }

      renderFiltersModular();
      renderCatalogModular();
      return PRODUCTS;
    } catch (error) {
      backendState.innerHTML = '<span class="dot bad"></span>Ошибка подключения к Supabase';
      grid.innerHTML = '<div class="notice error" style="grid-column:1/-1">Не удалось загрузить каталог: ' +
        escapeHtml(error.message) + '. Нажмите «Обновить».</div>';
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

  document.documentElement.dataset.hkCatalogArchitecture = 'modular-v1';

  renderFiltersModular();
  renderCatalogModular();
})(window);