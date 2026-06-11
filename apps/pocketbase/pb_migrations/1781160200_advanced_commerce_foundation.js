/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const adminRule = "@request.auth.role = 'admin'";
  const ownerRule = "user_id = @request.auth.id || @request.auth.role = 'admin'";
  const authenticatedRule = "@request.auth.id != ''";
  const timestamps = () => [
    { type: "autodate", name: "created", onCreate: true, onUpdate: false },
    { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
  ];

  const orders = app.findCollectionByNameOrId("orders");
  orders.fields.add(
    new TextField({ name: "coupon_code", max: 50 }),
    new NumberField({ name: "discount", min: 0 }),
    new TextField({ name: "tracking_number", max: 120 }),
    new TextField({ name: "courier", max: 120 }),
    new URLField({ name: "tracking_url" }),
    new JSONField({ name: "tracking_events", maxSize: 200000 }),
    new JSONField({ name: "last_location", maxSize: 50000 }),
    new TextField({ name: "affiliate_code", max: 80 })
  );
  app.save(orders);

  const coupons = new Collection({
    type: "base",
    name: "coupons",
    listRule: authenticatedRule,
    viewRule: authenticatedRule,
    createRule: adminRule,
    updateRule: adminRule,
    deleteRule: adminRule,
    fields: [
      { type: "text", name: "code", required: true, max: 50 },
      { type: "text", name: "name", required: true, max: 160 },
      { type: "select", name: "discount_type", values: ["percentage", "fixed"], maxSelect: 1 },
      { type: "number", name: "value", required: true, min: 0 },
      { type: "number", name: "minimum_order", min: 0 },
      { type: "number", name: "maximum_discount", min: 0 },
      { type: "number", name: "usage_limit", min: 0, onlyInt: true },
      { type: "number", name: "used_count", min: 0, onlyInt: true },
      { type: "date", name: "starts_at" },
      { type: "date", name: "ends_at" },
      { type: "bool", name: "active" },
      ...timestamps(),
    ],
    indexes: ["CREATE UNIQUE INDEX idx_coupons_code ON coupons (code)"],
  });
  app.save(coupons);

  const referrals = new Collection({
    type: "base",
    name: "referrals",
    listRule: "referrer_user_id = @request.auth.id || referred_user_id = @request.auth.id || @request.auth.role = 'admin'",
    viewRule: "referrer_user_id = @request.auth.id || referred_user_id = @request.auth.id || @request.auth.role = 'admin'",
    createRule: authenticatedRule,
    updateRule: adminRule,
    deleteRule: adminRule,
    fields: [
      { type: "text", name: "referrer_user_id", required: true, max: 15 },
      { type: "text", name: "referred_user_id", max: 15 },
      { type: "text", name: "code", required: true, max: 80 },
      { type: "select", name: "status", values: ["invited", "joined", "qualified", "rewarded"], maxSelect: 1 },
      { type: "number", name: "reward_amount", min: 0 },
      { type: "text", name: "invite_email", max: 255 },
      ...timestamps(),
    ],
    indexes: [
      "CREATE INDEX idx_referrals_referrer ON referrals (referrer_user_id)",
      "CREATE INDEX idx_referrals_code ON referrals (code)",
    ],
  });
  app.save(referrals);

  const affiliates = new Collection({
    type: "base",
    name: "affiliates",
    listRule: ownerRule,
    viewRule: ownerRule,
    createRule: authenticatedRule,
    updateRule: adminRule,
    deleteRule: adminRule,
    fields: [
      { type: "text", name: "user_id", required: true, max: 15 },
      { type: "text", name: "code", required: true, max: 80 },
      { type: "number", name: "commission_rate", min: 0, max: 100 },
      { type: "number", name: "balance", min: 0 },
      { type: "number", name: "total_earned", min: 0 },
      { type: "number", name: "clicks", min: 0, onlyInt: true },
      { type: "number", name: "conversions", min: 0, onlyInt: true },
      { type: "select", name: "status", values: ["pending", "active", "paused"], maxSelect: 1 },
      ...timestamps(),
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_affiliates_user ON affiliates (user_id)",
      "CREATE UNIQUE INDEX idx_affiliates_code ON affiliates (code)",
    ],
  });
  app.save(affiliates);

  const analyticsEvents = new Collection({
    type: "base",
    name: "analytics_events",
    listRule: adminRule,
    viewRule: adminRule,
    createRule: "",
    updateRule: null,
    deleteRule: adminRule,
    fields: [
      { type: "text", name: "user_id", max: 15 },
      { type: "text", name: "session_id", max: 120 },
      { type: "text", name: "event_name", required: true, max: 120 },
      { type: "text", name: "entity_type", max: 80 },
      { type: "text", name: "entity_id", max: 30 },
      { type: "text", name: "path", max: 500 },
      { type: "json", name: "metadata", maxSize: 200000 },
      ...timestamps(),
    ],
    indexes: [
      "CREATE INDEX idx_analytics_event_name ON analytics_events (event_name)",
      "CREATE INDEX idx_analytics_created ON analytics_events (created)",
    ],
  });
  app.save(analyticsEvents);

  const conversations = new Collection({
    type: "base",
    name: "support_conversations",
    listRule: ownerRule,
    viewRule: ownerRule,
    createRule: authenticatedRule,
    updateRule: ownerRule,
    deleteRule: adminRule,
    fields: [
      { type: "text", name: "user_id", required: true, max: 15 },
      { type: "text", name: "subject", required: true, max: 180 },
      { type: "select", name: "status", values: ["open", "waiting", "resolved"], maxSelect: 1 },
      { type: "select", name: "priority", values: ["low", "normal", "high"], maxSelect: 1 },
      { type: "text", name: "assigned_to", max: 15 },
      { type: "autodate", name: "last_message_at", onCreate: true, onUpdate: true },
      ...timestamps(),
    ],
    indexes: ["CREATE INDEX idx_support_conversations_user ON support_conversations (user_id)"],
  });
  app.save(conversations);

  const messages = new Collection({
    type: "base",
    name: "support_messages",
    listRule: ownerRule,
    viewRule: ownerRule,
    createRule: authenticatedRule,
    updateRule: adminRule,
    deleteRule: adminRule,
    fields: [
      { type: "text", name: "conversation_id", required: true, max: 15 },
      { type: "text", name: "user_id", required: true, max: 15 },
      { type: "text", name: "sender_id", required: true, max: 15 },
      { type: "select", name: "sender_type", values: ["customer", "staff"], maxSelect: 1 },
      { type: "text", name: "message", required: true, max: 5000 },
      { type: "json", name: "attachments", maxSize: 200000 },
      { type: "bool", name: "read" },
      ...timestamps(),
    ],
    indexes: ["CREATE INDEX idx_support_messages_conversation ON support_messages (conversation_id)"],
  });
  app.save(messages);

  const outbox = new Collection({
    type: "base",
    name: "notification_outbox",
    listRule: ownerRule,
    viewRule: ownerRule,
    createRule: "user_id = @request.auth.id || @request.auth.role = 'admin'",
    updateRule: adminRule,
    deleteRule: adminRule,
    fields: [
      { type: "text", name: "user_id", required: true, max: 15 },
      { type: "select", name: "channel", values: ["email", "push"], maxSelect: 1 },
      { type: "text", name: "recipient", max: 255 },
      { type: "text", name: "subject", max: 180 },
      { type: "text", name: "body", required: true, max: 10000 },
      { type: "select", name: "status", values: ["queued", "sent", "failed", "skipped"], maxSelect: 1 },
      { type: "text", name: "provider_message_id", max: 255 },
      { type: "text", name: "error", max: 1000 },
      { type: "json", name: "metadata", maxSize: 100000 },
      ...timestamps(),
    ],
    indexes: ["CREATE INDEX idx_notification_outbox_status ON notification_outbox (status)"],
  });
  app.save(outbox);

  const coupon = new Record(coupons);
  coupon.set("code", "NATURE10");
  coupon.set("name", "Naturelap welcome offer");
  coupon.set("discount_type", "percentage");
  coupon.set("value", 10);
  coupon.set("minimum_order", 2000);
  coupon.set("maximum_discount", 1500);
  coupon.set("usage_limit", 1000);
  coupon.set("used_count", 0);
  coupon.set("active", true);
  app.save(coupon);

  const users = app.findRecordsByFilter("users", "id != ''", "", 500, 0);
  users.forEach((user) => {
    const affiliate = new Record(affiliates);
    affiliate.set("user_id", user.id);
    affiliate.set("code", `NL${user.id.slice(0, 8).toUpperCase()}`);
    affiliate.set("commission_rate", 5);
    affiliate.set("balance", 0);
    affiliate.set("total_earned", 0);
    affiliate.set("clicks", 0);
    affiliate.set("conversions", 0);
    affiliate.set("status", "active");
    app.save(affiliate);
  });
}, (app) => {
  [
    "notification_outbox",
    "support_messages",
    "support_conversations",
    "analytics_events",
    "affiliates",
    "referrals",
    "coupons",
  ].forEach((name) => {
    try {
      app.delete(app.findCollectionByNameOrId(name));
    } catch {
      // Collection may already be absent during partial rollback.
    }
  });

  const orders = app.findCollectionByNameOrId("orders");
  [
    "coupon_code",
    "discount",
    "tracking_number",
    "courier",
    "tracking_url",
    "tracking_events",
    "last_location",
    "affiliate_code",
  ].forEach((field) => orders.fields.removeByName(field));
  app.save(orders);
})
