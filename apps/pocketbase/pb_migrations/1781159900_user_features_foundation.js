/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.listRule = "id = @request.auth.id || @request.auth.role = 'admin'";
  users.viewRule = "id = @request.auth.id || @request.auth.role = 'admin'";
  users.updateRule = "id = @request.auth.id || @request.auth.role = 'admin'";

  users.fields.add(
    new TextField({ name: "phone", max: 40 }),
    new TextField({ name: "bio", max: 600 }),
    new TextField({ name: "address", max: 500 }),
    new TextField({ name: "city", max: 120 }),
    new TextField({ name: "country", max: 120 }),
    new SelectField({
      name: "role",
      values: ["user", "staff", "admin"],
      maxSelect: 1,
    }),
    new JSONField({ name: "permissions", maxSize: 20000 }),
    new BoolField({ name: "email_notifications" }),
    new BoolField({ name: "push_notifications" })
  );
  app.save(users);

  const savedItems = new Collection({
    type: "base",
    name: "saved_items",
    listRule: "user_id = @request.auth.id || @request.auth.role = 'admin'",
    viewRule: "user_id = @request.auth.id || @request.auth.role = 'admin'",
    createRule: "@request.auth.id != ''",
    updateRule: "user_id = @request.auth.id || @request.auth.role = 'admin'",
    deleteRule: "user_id = @request.auth.id || @request.auth.role = 'admin'",
    fields: [
      { type: "text", name: "user_id", required: true, max: 15 },
      { type: "select", name: "target_type", values: ["stay", "product", "post"], maxSelect: 1 },
      { type: "text", name: "target_id", required: true, max: 30 },
      { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_saved_items_user_target ON saved_items (user_id, target_type, target_id)",
      "CREATE INDEX idx_saved_items_user ON saved_items (user_id)",
    ],
  });
  app.save(savedItems);

  const notifications = new Collection({
    type: "base",
    name: "notifications",
    listRule: "user_id = @request.auth.id || @request.auth.role = 'admin'",
    viewRule: "user_id = @request.auth.id || @request.auth.role = 'admin'",
    createRule: "user_id = @request.auth.id || @request.auth.role = 'admin'",
    updateRule: "user_id = @request.auth.id || @request.auth.role = 'admin'",
    deleteRule: "user_id = @request.auth.id || @request.auth.role = 'admin'",
    fields: [
      { type: "text", name: "user_id", required: true, max: 15 },
      { type: "select", name: "type", values: ["order", "booking", "promotion", "system"], maxSelect: 1 },
      { type: "text", name: "title", required: true, max: 180 },
      { type: "text", name: "message", required: true, max: 1200 },
      { type: "text", name: "action_url", max: 500 },
      { type: "bool", name: "read" },
      { type: "json", name: "metadata", maxSize: 100000 },
      { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    indexes: [
      "CREATE INDEX idx_notifications_user ON notifications (user_id)",
      "CREATE INDEX idx_notifications_user_read ON notifications (user_id, read)",
    ],
  });
  app.save(notifications);

  const existingUsers = app.findRecordsByFilter("users", "id != ''", "", 500, 0);
  existingUsers.forEach((record) => {
    if (!record.get("role")) record.set("role", "user");
    if (record.get("permissions") == null) record.set("permissions", []);
    record.set("email_notifications", true);
    record.set("push_notifications", false);
    app.save(record);
  });
}, (app) => {
  ["notifications", "saved_items"].forEach((name) => {
    try {
      app.delete(app.findCollectionByNameOrId(name));
    } catch {
      // Collection may already be absent during a partial rollback.
    }
  });

  const users = app.findCollectionByNameOrId("users");
  users.listRule = "id = @request.auth.id";
  users.viewRule = "id = @request.auth.id";
  users.updateRule = "id = @request.auth.id";
  [
    "phone",
    "bio",
    "address",
    "city",
    "country",
    "permissions",
    "email_notifications",
    "push_notifications",
  ].forEach((field) => users.fields.removeByName(field));
  users.fields.add(new SelectField({
    name: "role",
    values: ["user", "admin"],
    maxSelect: 1,
  }));
  app.save(users);
})
