
// [
//   { product_id: 101, name: "Organic Bananas", unit_price: 2.99, quantity: 2 },
// ]

const OrdersAPI = (function () {
  async function getCurrentUser() {
    const user = await SupabaseAuth.getCurrentUser();
    if (!user) {
      throw new Error("You must be logged in to place an order.");
    }
    return user;
  }

  // mode: 'pickup' | 'delivery'
  // windowLabel:"Today, 4–6 PM"
  async function createOrder({ mode, storeId, windowLabel, items }) {
    const user = await getCurrentUser();

    if (!Array.isArray(items) || items.length === 0) {
        //Error for empty cart
      throw new Error("Cannot place an order with no items.");
    }

    const normalizedItems = items.map((item) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unit_price) || 0;
      const subtotal = price * qty;

      return {
        product_id: item.product_id,
        product_name: item.name,
        unit_price: price,
        quantity: qty,
        subtotal
      };
    });

    const total = normalizedItems.reduce((sum, i) => sum + i.subtotal, 0);

    // Insert order
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        store_id: storeId ?? null,
        mode,
        status: "placed",
        window_label: windowLabel || null,
        total_amount: total
      })
      .select("*")
      .single();

    if (orderError) {
        //Supabase error handling
      console.error("[OrdersAPI] createOrder error:", orderError);
      throw new Error(orderError.message || "Failed to create order.");
    }
    //Grab uuid to link items
    const orderId = orderData.id;

    // Insert order items
    const itemsToInsert = normalizedItems.map((i) => ({
      order_id: orderId,
      product_id: i.product_id,
      product_name: i.product_name,
      unit_price: i.unit_price,
      quantity: i.quantity,
      subtotal: i.subtotal
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsToInsert);

    if (itemsError) {
        //Supabse error
      console.error("[OrdersAPI] order_items insert error:", itemsError);
      throw new Error(itemsError.message || "Failed to save order items.");
    }

    return {
      order: orderData,
      items: itemsToInsert
    };
  }

  //Fetch orders
  async function getOrdersForCurrentUser() {
    const user = await getCurrentUser();

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("placed_at", { ascending: false });

    if (error) {
      console.error("[OrdersAPI] getOrdersForCurrentUser error:", error);
      throw new Error(error.message || "Failed to load orders.");
    }

    return data || [];
  }

  async function getOrderWithItems(orderId) {
    const user = await getCurrentUser(); 

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError) {
      console.error("[OrdersAPI] getOrderWithItems order error:", orderError);
      throw new Error(orderError.message || "Order not found.");
    }

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (itemsError) {
      console.error("[OrdersAPI] getOrderWithItems items error:", itemsError);
      throw new Error(itemsError.message || "Failed to load order items.");
    }

    return { order, items: items || [] };
  }

  return {
    createOrder,
    getOrdersForCurrentUser,
    getOrderWithItems
  };
})();

window.OrdersAPI = OrdersAPI;
