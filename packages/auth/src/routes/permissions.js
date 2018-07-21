module.exports = app => {
  const router = app.registered("Router");
  const requirePermissionMiddleware = app.registered(
    "Middleware",
    "RequirePermission"
  );
  const Permission = app.registered("Model", "Permission");

  router.get("/api/permissions", [
    requirePermissionMiddleware("permissions.search"),
    async (ctx, next) => {
      const { filters = {}, pageSize = 25, page = 1 } = ctx.request.body;

      const where = {};
      ["id", "name", "description"].map(field => {
        if (filters[field]) {
          where[field] = filters[field];
        }
      });

      const permissions = await Permission.where(where).fetchPage({
        page,
        pageSize
      });
      ctx.response.body = {
        permissions
      };
    }
  ]);
};
