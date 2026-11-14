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

  // The badge is shown only when it carries information: when a product
  // differs from the rest of the catalog (for example one out-of-stock item
  // among preorder items). A catalog where everything is "Под заказ" is
  // explained once in the catalog header instead of on every card.
  function statusBadge(product, baseline) {
    if (product.availability === 'in_stock') return '';
    if (baseline && product.availability === baseline) return '';
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
    var canAdd = product.availability !== 'out_of_stock';

    return '<article class="product" data-hk-product-card="modular-v1" data-product-id="' + id +
      '" role="button" tabindex="0" aria-label="' + escapeHtml(product.name) + '" onclick="openDetail(' + id + ')">' +
      '<div class="photo-wrap">' +
        '<img class="photo" src="' + escapeHtml(photo) + '" alt="' + escapeHtml(product.name) + '" loading="lazy">' +
        statusBadge(product, helpers.baseline) +
        (canAdd
          ? '<button type="button" class="quick-add" data-quick-add="' + id + '" aria-label="Добавить в корзину: ' +
            escapeHtml(product.name) + ', 1 кг"><svg class="hk-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>'
          : '') +
      '</div>' +
      '<div class="pbody">' +
        '<div class="ptitle">' + escapeHtml(product.name) + '</div>' +
        '<div class="prices prices--kg-only">' +
          '<div class="price price--primary"><b>' + fmt(product.price_kg) + '</b><span> / кг</span></div>' +
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
