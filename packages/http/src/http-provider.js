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
  return (onRequest, service) => {
    const server = http.createServer(async (req, res) => {
      try {
        const ctx = await onRequest(await httpContext({}, req, res), "web");
        if (!ctx.done) {
          if (ctx.response.body && typeof ctx.response.body !== "string") {
            ctx.response.headers["Content-Type"] = "text/json";
            ctx.response.body = JSON.stringify(ctx.response.body);
          }

          ctx.response.headers["Set-Cookie"] = Object.keys(
            ctx.response.cookies
          ).map(key => `${key}=${ctx.response.cookies[key]}`);

          console.log('WriteHead');
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
    server.listen(port, host);

    server.on("clientError", (err, socket) => {
      console.log("clientError onRequest");
      return onRequest(httpContext(null, null, err));
    });
  };
}
export default httpProvider;
