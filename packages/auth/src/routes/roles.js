module.exports = app => {
  const router = app.registered("Router");
  const Role = app.registered("Model", "Role");
  const RequirePermission = app.registered("Middleware", "RequirePermission");

  router.get("/api/roles", [
    RequirePermission("roles.search"),
    async (ctx, next) => {
      const { filters = {}, pageSize = 25, page = 1 } = ctx.request.body;

      const where = {};
      ["id", "name", "description"].map(field => {
        if (filters[field]) {
          where[field] = filters[field];
        }
      });

      const roles = await Role.where(where).fetchPage({
        page,
        pageSize,
        withRelated: ["permissions"]
      });
      ctx.response.body = {
        roles
      };
    }
  ]);
};
