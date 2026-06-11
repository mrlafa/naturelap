/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const adminRule = "@request.auth.role = 'admin'";
  const authenticatedRule = "@request.auth.id != ''";
  const ownerRule = "user_id = @request.auth.id || @request.auth.role = 'admin'";
  const text = (data) => ({ type: "text", ...data });
  const email = (data) => ({ type: "email", ...data });
  const editor = (data) => ({ type: "editor", ...data });
  const number = (data) => ({ type: "number", ...data });
  const bool = (data) => ({ type: "bool", ...data });
  const json = (data) => ({ type: "json", ...data });
  const select = (data) => ({ type: "select", ...data });

  const saveCollection = (config) => {
    const collection = new Collection({
      ...config,
      fields: [
        ...config.fields,
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
      ],
    });
    app.save(collection);
    return collection;
  };

  const categories = saveCollection({
    type: "base",
    name: "product_categories",
    listRule: "",
    viewRule: "",
    createRule: adminRule,
    updateRule: adminRule,
    deleteRule: adminRule,
    fields: [
      text({ name: "name", required: true, max: 120 }),
      text({ name: "slug", required: true, max: 140 }),
      text({ name: "description", max: 600 }),
      text({ name: "image_url", max: 1000 }),
      number({ name: "sort_order", min: 0, onlyInt: true }),
      bool({ name: "active" }),
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_product_categories_slug ON product_categories (slug)",
    ],
  });

  const products = saveCollection({
    type: "base",
    name: "products",
    listRule: "active = true || @request.auth.role = 'admin'",
    viewRule: "active = true || @request.auth.role = 'admin'",
    createRule: adminRule,
    updateRule: adminRule,
    deleteRule: adminRule,
    fields: [
      text({ name: "category_id", required: true, max: 15 }),
      text({ name: "name", required: true, max: 180 }),
      text({ name: "slug", required: true, max: 200 }),
      text({ name: "short_description", max: 280 }),
      editor({ name: "description" }),
      number({ name: "price", required: true, min: 0 }),
      number({ name: "compare_at_price", min: 0 }),
      number({ name: "stock", min: 0, onlyInt: true }),
      number({ name: "rating", min: 0, max: 5 }),
      text({ name: "image_url", max: 1000 }),
      json({ name: "gallery", maxSize: 200000 }),
      json({ name: "tags", maxSize: 20000 }),
      bool({ name: "featured" }),
      bool({ name: "active" }),
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_products_slug ON products (slug)",
      "CREATE INDEX idx_products_category ON products (category_id)",
    ],
  });

  saveCollection({
    type: "base",
    name: "product_variants",
    listRule: "active = true || @request.auth.role = 'admin'",
    viewRule: "active = true || @request.auth.role = 'admin'",
    createRule: adminRule,
    updateRule: adminRule,
    deleteRule: adminRule,
    fields: [
      text({ name: "product_id", required: true, max: 15 }),
      text({ name: "name", required: true, max: 120 }),
      text({ name: "option_name", required: true, max: 80 }),
      text({ name: "option_value", required: true, max: 120 }),
      number({ name: "price_adjustment" }),
      number({ name: "stock", min: 0, onlyInt: true }),
      bool({ name: "active" }),
    ],
    indexes: [
      "CREATE INDEX idx_product_variants_product ON product_variants (product_id)",
    ],
  });

  saveCollection({
    type: "base",
    name: "carts",
    listRule: ownerRule,
    viewRule: ownerRule,
    createRule: authenticatedRule,
    updateRule: ownerRule,
    deleteRule: ownerRule,
    fields: [
      text({ name: "user_id", required: true, max: 15 }),
      select({ name: "status", values: ["active", "converted", "abandoned"], maxSelect: 1 }),
    ],
    indexes: [
      "CREATE INDEX idx_carts_user ON carts (user_id)",
    ],
  });

  saveCollection({
    type: "base",
    name: "cart_items",
    listRule: ownerRule,
    viewRule: ownerRule,
    createRule: authenticatedRule,
    updateRule: ownerRule,
    deleteRule: ownerRule,
    fields: [
      text({ name: "cart_id", required: true, max: 15 }),
      text({ name: "user_id", required: true, max: 15 }),
      text({ name: "product_id", required: true, max: 15 }),
      text({ name: "variant_id", max: 15 }),
      number({ name: "quantity", required: true, min: 1, onlyInt: true }),
      number({ name: "unit_price", required: true, min: 0 }),
    ],
    indexes: [
      "CREATE INDEX idx_cart_items_cart ON cart_items (cart_id)",
      "CREATE INDEX idx_cart_items_user ON cart_items (user_id)",
    ],
  });

  saveCollection({
    type: "base",
    name: "orders",
    listRule: ownerRule,
    viewRule: ownerRule,
    createRule: authenticatedRule,
    updateRule: adminRule,
    deleteRule: adminRule,
    fields: [
      text({ name: "order_number", required: true, max: 40 }),
      text({ name: "user_id", required: true, max: 15 }),
      text({ name: "customer_name", required: true, max: 180 }),
      email({ name: "email", required: true }),
      text({ name: "phone", required: true, max: 40 }),
      text({ name: "address", required: true, max: 500 }),
      text({ name: "city", required: true, max: 120 }),
      text({ name: "notes", max: 1000 }),
      number({ name: "subtotal", required: true, min: 0 }),
      number({ name: "delivery_fee", min: 0 }),
      number({ name: "total", required: true, min: 0 }),
      select({ name: "payment_method", values: ["cod", "esewa", "khalti", "fonepay", "stripe", "paypal", "crypto"], maxSelect: 1 }),
      select({ name: "payment_status", values: ["pending", "paid", "failed", "refunded"], maxSelect: 1 }),
      select({ name: "status", values: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"], maxSelect: 1 }),
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_orders_number ON orders (order_number)",
      "CREATE INDEX idx_orders_user ON orders (user_id)",
    ],
  });

  saveCollection({
    type: "base",
    name: "order_items",
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: authenticatedRule,
    updateRule: adminRule,
    deleteRule: adminRule,
    fields: [
      text({ name: "order_id", required: true, max: 15 }),
      text({ name: "user_id", required: true, max: 15 }),
      text({ name: "product_id", required: true, max: 15 }),
      text({ name: "variant_id", max: 15 }),
      text({ name: "product_name", required: true, max: 180 }),
      text({ name: "variant_name", max: 180 }),
      number({ name: "quantity", required: true, min: 1, onlyInt: true }),
      number({ name: "unit_price", required: true, min: 0 }),
      number({ name: "total", required: true, min: 0 }),
    ],
    indexes: [
      "CREATE INDEX idx_order_items_order ON order_items (order_id)",
      "CREATE INDEX idx_order_items_user ON order_items (user_id)",
    ],
  });

  saveCollection({
    type: "base",
    name: "payments",
    listRule: ownerRule,
    viewRule: ownerRule,
    createRule: authenticatedRule,
    updateRule: adminRule,
    deleteRule: adminRule,
    fields: [
      text({ name: "user_id", required: true, max: 15 }),
      text({ name: "order_id", max: 15 }),
      text({ name: "booking_id", max: 15 }),
      select({ name: "provider", values: ["cod", "esewa", "khalti", "fonepay", "stripe", "paypal", "crypto"], maxSelect: 1 }),
      number({ name: "amount", required: true, min: 0 }),
      text({ name: "currency", required: true, max: 8 }),
      select({ name: "status", values: ["pending", "paid", "failed", "refunded"], maxSelect: 1 }),
      text({ name: "transaction_id", max: 180 }),
      json({ name: "metadata", maxSize: 100000 }),
    ],
    indexes: [
      "CREATE INDEX idx_payments_user ON payments (user_id)",
      "CREATE INDEX idx_payments_order ON payments (order_id)",
    ],
  });

  saveCollection({
    type: "base",
    name: "likes",
    listRule: "user_id = @request.auth.id",
    viewRule: "user_id = @request.auth.id",
    createRule: authenticatedRule,
    updateRule: "user_id = @request.auth.id",
    deleteRule: "user_id = @request.auth.id",
    fields: [
      text({ name: "user_id", required: true, max: 15 }),
      select({ name: "target_type", values: ["stay", "product"], maxSelect: 1 }),
      text({ name: "target_id", required: true, max: 15 }),
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_likes_user_target ON likes (user_id, target_type, target_id)",
    ],
  });

  saveCollection({
    type: "base",
    name: "shares",
    listRule: ownerRule,
    viewRule: ownerRule,
    createRule: "",
    updateRule: adminRule,
    deleteRule: adminRule,
    fields: [
      text({ name: "user_id", max: 15 }),
      select({ name: "target_type", values: ["stay", "product"], maxSelect: 1 }),
      text({ name: "target_id", required: true, max: 15 }),
      text({ name: "channel", max: 40 }),
    ],
    indexes: [
      "CREATE INDEX idx_shares_target ON shares (target_type, target_id)",
    ],
  });

  const categoryData = [
    ["Trail Essentials", "trail-essentials", "Reliable gear for day hikes and long approaches.", "https://images.unsplash.com/photo-1551632811-561732d1e306", 1],
    ["Camp Comfort", "camp-comfort", "Warm, packable pieces for slower evenings outside.", "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4", 2],
    ["Local Pantry", "local-pantry", "Small-batch Himalayan food and drink for the road.", "https://images.unsplash.com/photo-1544787219-7f47ccb76574", 3],
    ["Mountain Wear", "mountain-wear", "Layer-ready apparel made for changing weather.", "https://images.unsplash.com/photo-1551698618-1dfe5d97d256", 4],
  ];

  const categoryIds = {};
  categoryData.forEach((item) => {
    const record = new Record(categories);
    record.set("name", item[0]);
    record.set("slug", item[1]);
    record.set("description", item[2]);
    record.set("image_url", item[3]);
    record.set("sort_order", item[4]);
    record.set("active", true);
    app.save(record);
    categoryIds[item[1]] = record.id;
  });

  const productData = [
    ["Summit Daypack 24L", "summit-daypack-24l", "trail-essentials", "A balanced everyday pack with a breathable back panel.", 6490, 7490, 18, 4.8, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62", ["pack", "hiking"]],
    ["Copper Trail Bottle", "copper-trail-bottle", "trail-essentials", "Insulated steel bottle that keeps water cold through the climb.", 1890, 2290, 42, 4.7, "https://images.unsplash.com/photo-1602143407151-7111542de6e8", ["bottle", "hydration"]],
    ["Cloudrest Camp Blanket", "cloudrest-camp-blanket", "camp-comfort", "A soft recycled-wool blanket sized for camp or cabin.", 4290, 4990, 14, 4.9, "https://images.unsplash.com/photo-1600369672770-985fd30004eb", ["blanket", "camp"]],
    ["Himalayan Pour-Over Kit", "himalayan-pour-over-kit", "camp-comfort", "Compact brewer, enamel cup, and reusable filter in one kit.", 3290, 3790, 20, 4.6, "https://images.unsplash.com/photo-1527631746610-bca00a040d60", ["coffee", "camp"]],
    ["Ilam Ridge Tea", "ilam-ridge-tea", "local-pantry", "Floral loose-leaf tea sourced from high gardens in eastern Nepal.", 890, 0, 60, 4.8, "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9", ["tea", "local"]],
    ["Wild Honey Trail Jar", "wild-honey-trail-jar", "local-pantry", "Raw mountain honey packed in a travel-friendly glass jar.", 1290, 0, 35, 4.9, "https://images.unsplash.com/photo-1587049352846-4a222e784d38", ["honey", "local"]],
    ["Ridgeline Fleece", "ridgeline-fleece", "mountain-wear", "A warm mid-layer with clean lines for trail and town.", 5890, 6790, 24, 4.7, "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3", ["fleece", "apparel"]],
    ["Monsoon Shell Jacket", "monsoon-shell-jacket", "mountain-wear", "Lightweight waterproof shell built for sudden mountain weather.", 9490, 10990, 12, 4.9, "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f", ["jacket", "apparel"]],
  ];

  productData.forEach((item, index) => {
    const record = new Record(products);
    record.set("name", item[0]);
    record.set("slug", item[1]);
    record.set("category_id", categoryIds[item[2]]);
    record.set("short_description", item[3]);
    record.set("description", `<p>${item[3]}</p><p>Selected by Naturelap for practical use, durable materials, and a lighter footprint.</p>`);
    record.set("price", item[4]);
    record.set("compare_at_price", item[5]);
    record.set("stock", item[6]);
    record.set("rating", item[7]);
    record.set("image_url", item[8]);
    record.set("gallery", [item[8]]);
    record.set("tags", item[9]);
    record.set("featured", index < 4);
    record.set("active", true);
    app.save(record);
  });
}, (app) => {
  [
    "shares",
    "likes",
    "payments",
    "order_items",
    "orders",
    "cart_items",
    "carts",
    "product_variants",
    "products",
    "product_categories",
  ].forEach((name) => {
    try {
      app.delete(app.findCollectionByNameOrId(name));
    } catch (error) {
      // Collection may have already been removed during a partial revert.
    }
  });
})
