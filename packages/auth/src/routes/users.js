module.exports = app => {
  const router = app.registered("Router");
  const RequirePermission = app.registered("Middleware", "RequirePermission");
  const User = app.registered("Model", "User");

  const userPrefetch = async (ctx, next) => {
    const { id } = ctx.request.match;
    if (id) {
      ctx.prefetch.user = await User.findById(id, {
        withRelated: ["roles", "permissions", "roles.permissions"]
      });
      await next();
    } else {
      return ctx.error(500, "Invalid user ID provided");
    }
  };

  router.get("/api/user/:id", [
    RequirePermission("users.view"),
    userPrefetch,
    async (ctx, next) => {
      return ctx.success({ user: ctx.prefetch.user });
    }
  ]);

  router.put("/api/user/:id", [
    RequirePermission("users.edit"),
    userPrefetch,
    async (ctx, next) => {
      const { alias, email, first_name, last_name } = ctx.request.body;
      await ctx.prefetch.user
        .save({ alias, email, first_name, last_name }, { method: "update" })
        .catch(() => {
          return ctx.error(500, "Failed to save user.");
        });
      return ctx.success({ user: ctx.prefetch.user, success: true });
    }
  ]);

  router.get("/api/user/:id/roles", [
    RequirePermission("users.view"),
    userPrefetch,
    async (ctx, next) => {
      ctx.success({
        roles: ctx.prefetch.user.toJSON().roles
      });
    }
  ]);

  router.put("/api/user/:id/roles", [
    RequirePermission("users.edit"),
    userPrefetch,
    async (ctx, next) => {
      const { roleID } = ctx.request.body;
      if (!roleID) {
        return ctx.error(500, "Invalid role ID provided");
      }

      await ctx.prefetch.user
        .roles()
        .attach([roleID])
        .catch(() => {
          ctx.error(500, "Failed to save role");
        })
        .then(() => {
          ctx.success({
            success: true
          });
        });
    }
  ]);

  router.get("/api/user/:id/permissions", [
    RequirePermission("users.view"),
    userPrefetch,
    async (ctx, next) => {
      ctx.success({
        permissions: ctx.prefetch.user.toJSON().permissions
      });
    }
  ]);

  router.put("/api/user/:id/permissions", [
    RequirePermission("users.edit"),
    userPrefetch,
    async (ctx, next) => {
      const { permissionID } = ctx.request.body;
      if (!permissionID) {
        return ctx.error(500, "Invalid permission ID provided");
      }

      await ctx.prefetch.user
        .permissions()
        .attach([permissionID])
        .catch(() => {
          ctx.error(500, "Failed to save permission");
        })
        .then(() => {
          ctx.success({
            success: true
          });
        });
    }
  ]);

  router.get("/api/users", [
    RequirePermission("users.search"),
    async (ctx, next) => {
      const { filters = {}, pageSize = 25, page = 1 } = ctx.request.body;

      const where = {};
      ["alias", "email", "first_name", "last_name"].map(field => {
        if (filters[field]) {
          where[field] = filters[field];
        }
      });

      const users = await User.where(where).fetchPage({
        page,
        pageSize,
        withRelated: ["permissions", "roles", "roles.permissions"]
      });
      ctx.response.body = {
        users
      };
    }
  ]);
};
