/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("notifications");
  collection.createRule = "user_id = @request.auth.id || @request.auth.role = 'admin'";
  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("notifications");
  collection.createRule = "@request.auth.role = 'admin'";
  app.save(collection);
})
