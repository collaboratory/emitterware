const Middleware = require("@emitterware/middleware");
const Parser = require("route-parser");

class Router {
  constructor(options = {}) {
    this.routes = {};
    this.options = {
      pathSeparator: "/",
      ...options
    };

    this.use = this.use.bind(this);
    ["GET", "PUT", "POST", "DELETE"].forEach(method => {
      this[method.toLowerCase()] = (route, middleware) =>
        this.use(route, middleware, "GET");
    });
  }

  use(route, middleware, method = "any") {
    let stack;
    if (this.routes[route]) {
      stack = this.routes[route];
    } else {
      stack = [];
    }
    stack.push([middleware, method]);
    this.routes[route] = {
      stack,
      parser: new Parser(route)
    };
  }

  remove(route) {
    this.routes.remove(route);
  }

  route(path, url) {
    return this.routes[path] && this.routes[path].parser.match(url);
  }

  async middleware(ctx, next) {
    for (let [key, route] of Object.entries(this.routes)) {
      for (let [middleware, method] of route.stack) {
        if (method.toLowerCase() === "any" || ctx.request.method === method) {
          const match = this.route(key, ctx.request.url);
          if (match) {
            ctx.request.match = match;
            if (Array.isArray(middleware)) {
              await Middleware.compose(middleware)(ctx, next);
            } else {
              await middleware(ctx, next);
            }
            return;
          }
        }
      }
    }
    await next();
  }
}
module.exports = Router;
