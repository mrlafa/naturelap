/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  [
    "product_categories",
    "products",
    "product_variants",
    "carts",
    "cart_items",
    "orders",
    "order_items",
    "payments",
    "likes",
    "shares",
  ].forEach((name) => {
    const collection = app.findCollectionByNameOrId(name);
    collection.fields.add(
      new AutodateField({ name: "created", onCreate: true, onUpdate: false }),
      new AutodateField({ name: "updated", onCreate: true, onUpdate: true })
    );
    app.save(collection);
  });
}, (app) => {
  [
    "product_categories",
    "products",
    "product_variants",
    "carts",
    "cart_items",
    "orders",
    "order_items",
    "payments",
    "likes",
    "shares",
  ].forEach((name) => {
    const collection = app.findCollectionByNameOrId(name);
    collection.fields.removeByName("created");
    collection.fields.removeByName("updated");
    app.save(collection);
  });
})
