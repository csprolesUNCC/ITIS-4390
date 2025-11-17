/* =========================================================
   WHOLE FOODS MOCK DATA — DATA ACCESS & FILTER METHODS ONLY
   No UI / HTML rendering. Pure data utilities.
   ========================================================= */

/* ============================
   1. Generic JSON Loader
   ============================ */

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return await res.json();
}

/* ============================
   2. Global App State Store
   ============================ */

const appState = {
  products: [],
  categories: [],
  stores: [],
  inventory: [],
  deliverySlots: [],
  promotions: null,
  users: []
};

/* ============================
   3. Load All JSON Files
   ============================ */

async function loadData() {
  const [
    productsData,
    categoriesData,
    storesData,
    inventoryData,
    deliveryData,
    promotionsData,
    usersData
  ] = await Promise.all([
    loadJSON('/data/products.json'),
    loadJSON('/data/categories.json'),
    loadJSON('/data/stores.json'),
    loadJSON('/data/inventory.json'),
    loadJSON('/data/delivery_slots.json'),
    loadJSON('/data/promotions.json'),
    loadJSON('/data/users.json')
  ]);

  appState.products = productsData.products;
  appState.categories = categoriesData.categories;
  appState.stores = storesData.stores;
  appState.inventory = inventoryData.inventory;
  appState.deliverySlots = deliveryData.delivery_slots;
  appState.promotions = promotionsData.promotions;
  appState.users = usersData.users;
}

/* =========================================================
   PRODUCT METHODS
   ========================================================= */

/* Get all products */
function getAllProducts() {
  return appState.products;
}

/* Get product by ID */
function getProductById(id) {
  return appState.products.find(p => p.id === id);
}

/* Get products by category */
function getProductsByCategory(categoryId) {
  return appState.products.filter(p => p.category_id === categoryId);
}

/* Search products by name or description */
function searchProducts(query) {
  const q = query.toLowerCase();
  return appState.products.filter(
    p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
  );
}

/* Filter products by dietary tag (vegan, keto_friendly, gluten_free, etc.) */
function filterProductsByDietary(tag) {
  return appState.products.filter(
    p => p.dietary && p.dietary.includes(tag)
  );
}

/* Filter by tag (e.g., "organic") */
function filterProductsByTag(tag) {
  return appState.products.filter(
    p => p.tags && p.tags.includes(tag)
  );
}

/* =========================================================
   CATEGORY METHODS
   ========================================================= */

/* Get all categories */
function getAllCategories() {
  return appState.categories;
}

/* Get category by ID */
function getCategoryById(id) {
  return appState.categories.find(c => c.id === id);
}

/* =========================================================
   STORE METHODS
   ========================================================= */

/* Get all stores */
function getAllStores() {
  return appState.stores;
}

/* Get store by ID */
function getStoreById(id) {
  return appState.stores.find(s => s.id === id);
}

/* =========================================================
   INVENTORY METHODS
   ========================================================= */

/* Get inventory item for product + store */
function getInventoryForProduct(productId, storeId) {
  return appState.inventory.find(
    inv => inv.product_id === productId && inv.store_id === storeId
  );
}

/* Check if a product is in stock at a store */
function isProductInStock(productId, storeId) {
  const inv = getInventoryForProduct(productId, storeId);
  return inv && inv.qty > 0;
}

/* Get quantity at store */
function getProductQuantity(productId, storeId) {
  const inv = getInventoryForProduct(productId, storeId);
  return inv ? inv.qty : 0;
}

/* =========================================================
   PROMOTION / PRICING METHODS
   ========================================================= */

/* Get active promotion for a product */
function getPromotionForProduct(productId) {
  if (!appState.promotions) return null;

  return appState.promotions.product_promotions.find(
    promo => promo.product_id === productId
  );
}

/* Calculate effective price (sale price vs base) */
function getEffectivePrice(product) {
  const variant = product.variants[0];
  const promo = getPromotionForProduct(product.id);

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

/* Get banners (for homepage carousels, etc.) */
function getPromoBanners() {
  return appState.promotions?.banners || [];
}

/* Get category promotions */
function getPromotionsForCategory(categoryId) {
  return appState.promotions?.category_promotions?.filter(
    promo => promo.category_id === categoryId
  ) || [];
}

/* =========================================================
   DELIVERY SLOT METHODS
   ========================================================= */

/* Get all delivery slots for a store */
function getDeliverySlotsForStore(storeId) {
  return appState.deliverySlots.filter(slot => slot.store_id === storeId);
}

/* Get delivery slots for a specific date */
function getDeliverySlotsForDate(storeId, date) {
  return appState.deliverySlots.filter(
    slot => slot.store_id === storeId && slot.date === date
  );
}

/* =========================================================
   USER METHODS
   ========================================================= */

/* Get all users */
function getAllUsers() {
  return appState.users;
}

/* Get user by ID */
function getUserById(id) {
  return appState.users.find(u => u.id === id);
}

/* Get default store for a user */
function getDefaultStoreId(userId = 1) {
  const user = getUserById(userId);
  return user?.default_store_id || appState.stores[0]?.id;
}
