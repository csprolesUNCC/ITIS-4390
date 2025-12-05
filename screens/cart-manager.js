// Cart Manager - Handles cart state, localStorage, and UI updates
class CartManager {
  constructor() {
    this.cart = this.loadCart();
    this.listeners = [];
  }

  // Load cart from localStorage
  loadCart() {
    try {
      const saved = localStorage.getItem('wholefoods_cart');
      return saved ? JSON.parse(saved) : { items: [], total: 0 };
    } catch (e) {
      console.error('Error loading cart:', e);
      return { items: [], total: 0 };
    }
  }

  // Save cart to localStorage
  saveCart() {
    try {
      localStorage.setItem('wholefoods_cart', JSON.stringify(this.cart));
      this.notifyListeners();
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  }

  // Add item to cart
  addItem(product, quantity = 1) {
    const existingItem = this.cart.items.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.cart.items.push({
        id: product.id,
        name: product.name,
        price: this.extractPrice(product),
        image: product.image_url || '',
        quantity: quantity
      });
    }
    
    this.updateTotal();
    this.saveCart();
  }

  // Remove item from cart
  removeItem(productId) {
    this.cart.items = this.cart.items.filter(item => item.id !== productId);
    this.updateTotal();
    this.saveCart();
  }

  // Update item quantity
  updateQuantity(productId, quantity) {
    const item = this.cart.items.find(item => item.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeItem(productId);
      } else {
        item.quantity = quantity;
        this.updateTotal();
        this.saveCart();
      }
    }
  }

  // Extract numeric price from product
  extractPrice(product) {
    if (product.price) return parseFloat(product.price);
    
    // Try to get from DataAPI if available
    if (typeof DataAPI !== 'undefined') {
      const priceInfo = DataAPI.getEffectivePrice(product);
      if (priceInfo && priceInfo.value) {
        return priceInfo.value;
      }
    }
    
    // Try variants
    if (product.variants && product.variants[0]) {
      const priceStr = product.variants[0].price_display || '';
      const match = priceStr.match(/[\d.]+/);
      if (match) return parseFloat(match[0]);
    }
    
    return 0;
  }

  // Update total price
  updateTotal() {
    this.cart.total = this.cart.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
  }

  // Get cart item count
  getItemCount() {
    return this.cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  // Get cart total
  getTotal() {
    return this.cart.total;
  }

  // Get all items
  getItems() {
    return this.cart.items;
  }

  // Clear cart
  clearCart() {
    this.cart = { items: [], total: 0 };
    this.saveCart();
  }

  // Subscribe to cart changes
  subscribe(callback) {
    this.listeners.push(callback);
    // Call immediately with current state
    callback(this.cart);
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.cart));
  }

  // Update cart icon in header
  updateCartIcon() {
    const cartBadge = document.getElementById('cart-badge');
    const cartTotal = document.getElementById('cart-total');
    const itemCount = this.getItemCount();
    const total = this.getTotal();

    if (cartBadge) {
      cartBadge.textContent = itemCount;
      cartBadge.style.display = itemCount > 0 ? 'flex' : 'none';
    }

    if (cartTotal) {
      cartTotal.textContent = `$${total.toFixed(2)}`;
    }
  }
}

// Create global cart instance
window.cartManager = new CartManager();

// Subscribe to cart changes to update UI
window.cartManager.subscribe((cart) => {
  window.cartManager.updateCartIcon();
});

// Initialize cart icon on page load
document.addEventListener('DOMContentLoaded', () => {
  window.cartManager.updateCartIcon();
});
