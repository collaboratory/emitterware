module.exports = bookshelf => {
  return bookshelf.model("Permission", {
    tableName: "permissions",
    roles: function() {
      return this.belongsToMany("Role", "role_permissions");
    },
    users: function() {
      return this.belongsToMany("User", "user_permissions");
    }
  });
};
