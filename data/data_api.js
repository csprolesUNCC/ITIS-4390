/* 
   DataAPI — Internal client for our Whole-Foods-style dataset.
DataAPI.loadEverything();
 example: const freshProduce = DataAPI.getProductsByCategory('produce');
 */

const DataAPI = (function () {
  // state dataStore
  const dataStore = {

    loaded: false,
    products: [],
    categories: [],
    storeLocations: [],
    inventory: [],
    deliverySlots: [],
    promotions: null,
    users: []


  };

  // Fetches our JSON file

  async function fetchJson(filePath) {
    const response = await fetch(filePath);
    if (!response.ok) {

      throw new Error(`[DataAPI] Couldn't fetch ${filePath} — Status ${response.status}`);

    }

    return response.json();
  }

  // Ensures that data is loaded before use

  function ensureLoaded() {
    if (!dataStore.loaded) {

      console.warn('[DataAPI] Data not yet loaded. Call `loadEverything()` before accessing it.');

    }
  }


  async function loadEverything() {

    const [

      productData,
      categoryData,
      storeData,
      inventoryData,
      deliveryData,
      promoData,
      userData

    ]
    = await Promise.all([

      fetchJson('../data/products.json'),
      fetchJson('../data/categories.json'),
      fetchJson('../data/stores.json'),
      fetchJson('../data/inventory.json'),
      fetchJson('../data/delivery_slots.json'),
      fetchJson('../data/promotions.json'),
      fetchJson('../data/users.json')
      
    ]);

    dataStore.products = productData.products || [];
    dataStore.categories = categoryData.categories || [];
    dataStore.storeLocations = storeData.stores || [];
    dataStore.inventory = inventoryData.inventory || [];
    dataStore.deliverySlots = deliveryData.delivery_slots || [];
    dataStore.promotions = promoData.promotions || null;
    dataStore.users = userData.users || [];

    dataStore.loaded = true;
  }

  // Products

  function getAllProducts() {
    ensureLoaded();

    return dataStore.products;

  }

  function getProduct(id) {
    ensureLoaded();
    //Alias name
    function getProductById(id) {
  return getProduct(id);
}


    return dataStore.products.find(p => p.id === id) || null;
  }

  function getProductsByCategory(categoryId) {
    ensureLoaded();

    return dataStore.products.filter(p => p.category_id === categoryId);

  }


  function searchProducts(query) {
    ensureLoaded();

    const term = (query || '').toLowerCase();
    return dataStore.products.filter(p =>
      p.name?.toLowerCase().includes(term) ||
      p.description?.toLowerCase().includes(term)
    );

  }

  function getProductsByDiet(tag) {
    ensureLoaded();
    return dataStore.products.filter(p =>
      Array.isArray(p.dietary) && p.dietary.includes(tag)
    );

  }


  function getProductsByTag(tag) {
    ensureLoaded();
    return dataStore.products.filter(p =>
      Array.isArray(p.tags) && p.tags.includes(tag)
    );
  
}


  // Categories

  function getCategories() {
    ensureLoaded();
    return dataStore.categories;
 
}

  function getCategory(id) {
    ensureLoaded();
    return dataStore.categories.find(c => c.id === id) || null;
 
}

  // Stores

  function getStoreLocations() {
    ensureLoaded();
    return dataStore.storeLocations;
 
}

  function getStoreLocation(id) {
    ensureLoaded();
    return dataStore.storeLocations.find(s => s.id === id) || null;
 
}


  // Inventory

  function getInventoryItem(productId, storeId) {
    ensureLoaded();
    return dataStore.inventory.find(item =>
      item.product_id === productId && item.store_id === storeId
    ) || null;
  
}

  function isProductInStock(productId, storeId) {
    const stock = getInventoryItem(productId, storeId);
    return stock?.qty > 0;
  
}

  function getProductQuantity(productId, storeId) {
    const stock = getInventoryItem(productId, storeId);
    return stock?.qty || 0;
 
}


  // Promotions

  function getPromotion(productId) {
    ensureLoaded();

    return dataStore.promotions?.product_promotions?.find(p =>
      p.product_id === productId
    ) || null;
 
}
//checks for sales
  function getEffectivePrice(product) {
    ensureLoaded();
    const variant = product.variants?.[0];
    //If no sale?
    if (!variant) return null;

    const promo = getPromotion(product.id);

    if (!promo) {
      return {

        cents: variant.price_cents,
        display: variant.price_display,
        original: null
      };
    }

    return {

      cents: promo.sale_price_cents,
      display: promo.sale_price_display,

      original: variant.price_display
    };
  }

  function getPromoBanners() {

    ensureLoaded();
    return dataStore.promotions?.banners || [];
  }

  function getCategoryPromotions(categoryId) {
    ensureLoaded();
    return dataStore.promotions?.category_promotions?.filter(p =>

      p.category_id === categoryId
    ) || [];
  }

  // Delivery

  function getDeliverySlots(storeId) {
   
    ensureLoaded();
    return dataStore.deliverySlots.filter(slot => slot.store_id === storeId);

  }
  


  function getDeliverySlotsByDate(storeId, dateString) {
    ensureLoaded();
    return dataStore.deliverySlots.filter(slot =>
      slot.store_id === storeId && slot.date === dateString

    );
  }


  // Users



  function getUsers() {
    ensureLoaded();
    return dataStore.users;
  }

  function getUser(id) {
    ensureLoaded();
    return dataStore.users.find(u => u.id === id) || null;

  }

  function getDefaultStoreId(userId = 1) {

    ensureLoaded();
    const user = getUser(userId);
    return user?.default_store_id || dataStore.storeLocations[0]?.id || null;

  }

  // Public API

  return {

    loadEverything,

    getAllProducts,
    getProduct,
    getProductsByCategory,
    searchProducts,
    getProductsByDiet,
    getProductsByTag,

    getCategories,
    getCategory,

    getStoreLocations,
    getStoreLocation,

    getInventoryItem,
    isProductInStock,
    getProductQuantity,

    getPromotion,
    getEffectivePrice,
    getPromoBanners,
    getCategoryPromotions,

    getDeliverySlots,
    getDeliverySlotsByDate,

    getUsers,
    getUser,
    getDefaultStoreId
  };
})();
