module.exports = app => {
  return ["auth", "permissions", "roles", "users"].map(controller => {
    require(`./${controller}`)(app);
  });
};
