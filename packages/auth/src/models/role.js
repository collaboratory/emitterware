module.exports = bookshelf => {
  return bookshelf.model("Role", {
    tableName: "roles",
    permissions: function() {
      return this.belongsToMany("Permission", "role_permissions");
    },
    users: function() {
      return this.belongsToMany("User", "user_roles");
    }
  });
};
