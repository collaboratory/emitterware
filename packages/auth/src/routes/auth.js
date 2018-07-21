const bcrypt = require("bcryptjs");

module.exports = app => {
  const router = app.registered("Router");
  const requireAuthMiddleware = app.registered("Middleware", "RequireAuth");
  const User = app.registered("Model", "User");

  router.get("/api/auth", [
    requireAuthMiddleware,
    async (ctx, next) => {
      ctx.success({
        user: ctx.session.user.toJSON()
      });
    }
  ]);

  router.post("/api/auth/login", async (ctx, next) => {
    const { username, password } = ctx.request.body;

    const user = await User.where(query => {
      query.where({ alias: username }).orWhere({ email: username });
    }).fetch({ withRelated: ["roles", "permissions", "roles.permissions"] });

    if (!user) {
      return ctx.error(401, "AUTH_FAILURE");
    }

    if (!await bcrypt.compare(password, user.attributes.password_hash)) {
      return ctx.error(401, "AUTH_FAILURE");
    }

    ctx.session.set("userID", user.attributes.id);

    return ctx.success({
      authenticated: true,
      user: user.toJSON()
    });
  });

  router.post("/api/auth/register", async (ctx, next) => {
    const { alias, email, password } = ctx.request.body;

    const existing = await User.where(query => {
      query.where({ alias }).orWhere({ email });
    }).fetch();

    if (existing) {
      return ctx.error(500, "ERR_ACCOUNT_EXISTS");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.forge({
      alias,
      email,
      passwordHash
    }).save(null, { method: "insert" });

    if (!user) {
      return ctx.error(500, "ERR_UNKNOWN");
    }

    return ctx.success({
      user: user.toJSON()
    });
  });
};
