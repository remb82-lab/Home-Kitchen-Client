/* Home Kitchen client catalog — data layer.
   STO 6: keeps Supabase transport outside presentation components. */
(function (global) {
  'use strict';

  function safeProductId(value) {
    var id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : 0;
  }

  function normalizeProduct(product) {
    var source = product && typeof product === 'object' ? product : {};
    return {
      ...source,
      id: safeProductId(source.id),
      name: String(source.name || ''),
      category: String(source.category || ''),
      description: String(source.description || ''),
      badge: String(source.badge || ''),
      availability: String(source.availability || ''),
      price_half: Number(source.price_half) || 0,
      price_kg: Number(source.price_kg) || 0,
      stock: {
        ...(source.stock && typeof source.stock === 'object' ? source.stock : {}),
        free_grams: Number(source.stock && source.stock.free_grams) || 0
      }
    };
  }

  async function fetchProducts(fetcher) {
    if (typeof fetcher !== 'function') throw new Error('Catalog fetcher is not available');
    var payload = await fetcher('/api/client/products');
    var items = payload && Array.isArray(payload.items) ? payload.items : [];
    return items.map(normalizeProduct).filter(function (product) {
      return product.id && product.name;
    });
  }

  function reconcileCart(items, findProduct) {
    if (!Array.isArray(items) || typeof findProduct !== 'function') return [];
    return items
      .filter(function (item) {
        var productId = safeProductId(item && item.product_id);
        var grams = Number(item && item.grams);
        var qty = Number(item && item.qty);
        return findProduct(productId) &&
          grams === 1000 &&
          Number.isSafeInteger(qty) &&
          qty > 0;
      })
      .map(function (item) {
        return {
          product_id: safeProductId(item.product_id),
          grams: 1000,
          qty: Number(item.qty)
        };
      });
  }

  global.HKCatalogData = Object.freeze({
    normalizeProduct: normalizeProduct,
    fetchProducts: fetchProducts,
    reconcileCart: reconcileCart
  });
})(window);
