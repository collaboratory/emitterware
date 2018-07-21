const AuthPlugin = {
  name: "Auth",
  run: app => {
    // Register models
    require("./models")(app);

    // Register middleware
    require("./middleware")(app);

    // Register routes
    require("./routes")(app);
  }
};

module.exports = AuthPlugin;
