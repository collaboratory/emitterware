const { Middleware } = require("@emitterware/middleware");

function mandateDependencies(ctx) {
  if (!ctx.session) {
    throw new Error("@emitterware/auth requires a session middleware provider");
  }
}

module.exports = app => {
  if (!app.registry.has("Model.User")) {
    throw new Error("Model.User not found in app registry");
  }

  const User = app.registry.get("Model.User");

  const authMiddleware = async (ctx, next) => {
    mandateDependencies(ctx);
    const userID = await ctx.session.get("userID");
    if (userID) {
      ctx.session.user = await User.findById(userID, {
        withRelated: ["roles", "permissions", "roles.permissions"]
      });
    }

    await next();
  };
  app.register("Middleware", "Auth", authMiddleware);

  const requireAuthMiddleware = Middleware.compose([
    authMiddleware,
    async (ctx, next) => {
      if (!ctx.session.user) {
        return ctx.error(401, "Failed to authenticate");
      }

      await next();
    }
  ]);
  app.register("Middleware", "RequireAuth", authMiddleware);

  const requirePermissionMiddleware = permission => {
    return Middleware.compose([
      requireAuthMiddleware,
      async (ctx, next) => {
        const user = ctx.session.user.toJSON();
        const userHasPermission =
          Array.isArray(user.permissions) &&
          user.permissions.map(perm => perm.id).includes(permission);

        const userRoleHasPermission =
          Array.isArray(user.roles) &&
          user.roles
            .map(role =>
              role.permissions.map(perm => perm.id).includes(permission)
            )
            .includes(true);

        if (!userHasPermission && !userRoleHasPermission) {
          return ctx.error(
            401,
            "You do not have permission to access this resource"
          );
        }

        await next();
      }
    ]);
  };
  app.register("Middleware", "RequirePermission", requirePermissionMiddleware);

  const requireRoleMiddleware = role => {
    return Middleware.compose([
      requireAuthMiddleware,
      async (ctx, next) => {
        if (!ctx.session.user.roles.map(role => role.id).contains(role)) {
          return ctx.error(
            401,
            "You do not have permission to access this resource"
          );
        }

        await next();
      }
    ]);
  };
  app.register("Middleware", "RequireRole", requireRoleMiddleware);
};
