export class Router {
  endpoints = new Map();

  use = (endpoint, middleware) => {
    this.endpoints.set(endpoint, middleware);
  };

  remove = endpoint => {
    this.endpoints.remove(endpoint);
  };

  static route(path, url) {
    const [route, keys] = Router.regexify(path);
    const matches = (url + "").match(route);
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
  }

  static regexify(string = "", keys = []) {
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

  middleware = async (ctx, next) => {
    for (let [key, value] of this.endpoints) {
      const match = Router.route(key, ctx.request.url);
      if (match) {
        ctx.request.match = match;
        await value(ctx, next);
        return;
      }
    }
    await next();
  };
}
export default Router;
