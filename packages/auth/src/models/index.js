module.exports = app => {
  const bookshelf = app.registered("Bookshelf");

  const Models = {
    Permission: require("./permission")(bookshelf),
    Role: require("./role")(bookshelf),
    User: require("./user")(bookshelf)
  };

  Object.keys(Models).map(modelName => {
    app.register("Model", modelName, Models[modelName]);
  });
};
