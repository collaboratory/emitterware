import Middleware from "@emitterware/middleware";

export class Router {
  routes = new Map();

  constructor(options = {}) {
    this.options = {
      pathSeparator: "/",
      ...options
    };
  }

  use = (route, middleware, method = "any") => {
    let stack;
    if (this.routes.has(route)) {
      stack = this.routes.get(route);
    } else {
      stack = [];
    }
    stack.push([middleware, method]);
    this.routes.set(route, stack);
  };

  get = (route, middleware) => this.use(route, middleware, "GET");
  put = (route, middleware) => this.use(route, middleware, "PUT");
  post = (route, middleware) => this.use(route, middleware, "POST");
  delete = (route, middleware) => this.use(route, middleware, "DELETE");

  remove = route => {
    this.routes.remove(route);
  };

  route = (path, url) => {
    const [route, keys] = regexify(
      path.replace(this.options.pathSeparator, "/")
    );
    const matches = url.replace(this.options.pathSeparator, "/").match(route);
    const params = { _: [] };
    if (matches) {
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        params[k] = matches[i + 1];
      }
      for (let i = keys.length + 1; i < matches.length; i++) {
        params._.push(matches[i]);
      }
      return params;
    }
    return false;
  };

  middleware = async (ctx, next) => {
    for (let [key, stack] of this.routes) {
      for (let [middleware, method] of stack) {
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
  };
}
export default Router;
export function regexify(string = "", keys = []) {
  let lString = string;
  const lKeys = [...keys];
  const matches = (string + "").match(/\/:([^/]+)/gi);
  if (matches) {
    matches.map(action => {
      lString = lString.replace(action, "/([^/]+)");
      lKeys.push(action.substr(2));
    });
    return [new RegExp(`^${lString}$`, "i"), lKeys];
  }

  return [new RegExp(`^${string}$`, "i"), keys];
}
