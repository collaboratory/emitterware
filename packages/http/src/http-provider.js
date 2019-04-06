const http = require("http");
const { httpContext } = require("./http-context");

/**
 *
 * @param port
 * @param host
 * @param config
 * @returns {function(*=, *)}
 * @constructor
 */
export function httpProvider({
  port = 3000,
  host = "127.0.0.1",
  ...config
} = {}) {
  // TODO: Make use of config & service variables
  const provider = {
    id: "http",
    server: null
  };
  provider.handler = (onRequest, service) => {
    provider.server = http.createServer(async (req, res) => {
      try {
        const baseContext = await httpContext({}, req, res);
        const ctx = await onRequest(baseContext, "web");
        if (!ctx.done) {
          if (ctx.response.body && typeof ctx.response.body !== "string") {
            ctx.response.headers["Content-Type"] = "text/json";
            ctx.response.body = JSON.stringify(ctx.response.body);
          }

          ctx.response.headers["Set-Cookie"] = [
            ...Object.keys(ctx.response.cookies).map(key => {
              const value = ctx.response.cookies[key];
              if (value !== null) {
                return `${key}=${ctx.response.cookies[key]}; Path=/;`;
              } else {
                return `${key}=; Domain=localhost; Path=/;`;
              }
            })
          ];

          if (!ctx.response.body) {
            if (ctx.body) {
              ctx.response.body = ctx.body;
            } else {
              console.warn("WARNING: ctx.response.body is unset");
            }
          }

          if (ctx.headers) {
            Object.assign(ctx.response.headers, ctx.headers);
          }

          if (ctx.trailers) {
            Object.assign(ctx.response.trailers, ctx.trailers);
          }

          res.writeHead(ctx.response.status, ctx.response.headers);
          res.write(ctx.response.body);
          res.addTrailers(ctx.response.trailers);
          return res.end();
        }
      } catch (err) {
        console.error(err);
      }
    });

    console.log(`Emitterware HTTP server listening at ${host}:${port}`);
    provider.server.listen(port, host);

    provider.server.on("clientError", (err, socket) => {
      console.log("clientError onRequest");
      return onRequest(httpContext(null, null, err));
    });
  };
  return provider;
}
export default httpProvider;
