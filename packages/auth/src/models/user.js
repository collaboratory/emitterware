module.exports = bookshelf => {
  return bookshelf.model("User", {
    tableName: "users",
    hidden: ["password_hash"],
    roles: function() {
      return this.belongsToMany("Role", "user_roles");
    },
    permissions: function() {
      return this.belongsToMany("Permission", "user_permissions");
    }
  });
};
