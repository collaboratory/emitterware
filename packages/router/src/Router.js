export class Router {
  routes = new Map();

  constructor(options = {}) {
    this.options = {
      pathSeparator: "/",
      ...options
    };
  }

  use = (route, middleware, method = "any") => {
    this.routes.set(route, [middleware, method]);
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
    console.log("Attempting router", ctx.request.method);
    for (let [key, [middleware, method]] of this.routes) {
      if (method.toLowerCase() === "any" || ctx.request.method === method) {
        const match = this.route(key, ctx.request.url);
        if (match) {
          ctx.request.match = match;
          await middleware(ctx, next);
          return;
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
