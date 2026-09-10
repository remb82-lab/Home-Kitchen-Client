/* Home Kitchen client catalog — ProductCard presentation component.
   STO 6: pure rendering only; no Supabase or storage access. */
(function (global) {
  'use strict';

  function badgeClass(product) {
    return product.availability === 'in_stock'
      ? ''
      : product.availability === 'preorder'
        ? 'warn'
        : 'bad';
  }

  function availabilityLabel(product) {
    if (product.availability === 'in_stock') {
      var freeGrams = Number(product.stock && product.stock.free_grams) || 0;
      return 'В наличии · ' + (freeGrams / 1000).toFixed(1).replace('.', ',') + ' кг';
    }
    return product.availability === 'preorder' ? 'Под заказ' : 'Нет в наличии';
  }

  function statusBadge(product) {
    if (product.availability === 'in_stock') return '';
    return '<span class="badge ' + badgeClass(product) + '">' +
      (product.availability === 'preorder' ? 'Под заказ' : 'Нет в наличии') +
    '</span>';
  }

  function render(product, helpers) {
    var escapeHtml = helpers.escapeHtml;
    var fmt = helpers.fmt;
    var photoFor = helpers.photoFor;
    var id = Number(product.id);
    var photo = product.image_url || photoFor(id) || 'assets/images/placeholders/product-photo-placeholder-c-v2.1.svg';

    return '<article class="product" data-hk-product-card="modular-v1" data-product-id="' + id +
      '" role="button" tabindex="0" onclick="openDetail(' + id + ')">' +
      '<img class="photo" src="' + escapeHtml(photo) + '" alt="' + escapeHtml(product.name) + '">' +
      '<div class="pbody">' +
        statusBadge(product) +
        '<div class="ptitle">' + escapeHtml(product.name) + '</div>' +
        '<div class="prices">' +
          '<div class="price"><span>0,5 кг</span><b>' + fmt(product.price_half) + '</b></div>' +
          '<div class="price"><span>1 кг</span><b>' + fmt(product.price_kg) + '</b></div>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  global.HKProductCard = Object.freeze({
    badgeClass: badgeClass,
    availabilityLabel: availabilityLabel,
    render: render
  });
})(window);
