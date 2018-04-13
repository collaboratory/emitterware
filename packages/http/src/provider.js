const http = require("http");
const qs = require("querystring");

/**
 *
 * @param port
 * @param host
 * @param config
 * @returns {function(*=, *)}
 * @constructor
 */
export function WebProvider({ port = 3000, host = "127.0.0.1", ...config }) {
  // TODO: Make use of config & service variables
  return (onRequest, service) => {
    const server = http.createServer(async (req, res) => {
      console.time("request");
      try {
        const ctx = await onRequest(await WebContext({}, req, res), "web");
        if (!ctx.done) {
          inspectMemory();
          if (ctx.response.body && typeof ctx.response.body !== "string") {
            ctx.response.headers["Content-Type"] = "text/json";
            ctx.response.body = JSON.stringify(ctx.response.body);
          }

          ctx.response.headers["Set-Cookie"] = Object.keys(
            ctx.response.cookies
          ).map(key => `${key}=${ctx.response.cookies[key]}`);

          res.writeHead(ctx.response.status, ctx.response.headers);
          res.write(ctx.response.body);
          res.addTrailers(ctx.response.trailers);
          console.timeEnd("request");
          return res.end();
        }
      } catch (err) {
        console.error(err);
        inspectMemory();
        console.timeEnd("request");
      }
    });

    console.log(`Craft web provider listening at ${host}:${port}`);
    server.listen(port, host);

    server.on("clientError", (err, socket) => {
      console.log("clientError onRequest");
      return onRequest(WebContext(null, null, err));
    });
  };
}
export default WebProvider;

function inspectMemory() {
  console.log(
    `memory: ${Math.round(
      process.memoryUsage().heapUsed / 1024 / 1024 * 100
    )}MB`
  );
}

export function convertMiddleware(fn, finalize = false) {
  return async (ctx, next) => {
    try {
      if (finalize) {
        ctx.done = true;
      }
      const req = ctx.request.raw();
      const res = ctx.response.raw();

      // Set our cookies
      if (Object.keys(ctx.response.cookies).length) {
        ctx.response
          .raw()
          .setHeader(
            "Set-Cookie",
            Object.keys(ctx.response.cookies).map(
              key => `${key}=${ctx.response.cookies[key]}`
            )
          );
      }

      await fn(req, res, next);
    } catch (e) {
      console.error(e);
    }
  };
}

export async function WebContext(
  ctx = {},
  req = null,
  res = null,
  error = null
) {
  const [url, queryString = ""] = req.url.split("?");
  const query = qs.parse(queryString);

  ctx.request = {
    url,
    query,
    headers: req.headers,
    trailers: req.trailers,
    body: [],
    raw: () => req
  };

  ctx.response = {
    status: 200,
    headers: {},
    trailers: {},
    cookies: {},
    body: "",
    raw: () => res
  };

  ctx.error = error;

  // Cookies support
  ctx.request.cookies = ctx.request.headers.cookie ? qs.parse(
    ctx.request.headers.cookie.replace(/; /g, "&")
  ) : {};

  ctx.redirect = (location, status = 302, headers = {}) => {
    const res = ctx.response.raw();
    res.writeHead(status, {
      Location: location,
      "Set-Cookie": Object.keys(ctx.response.cookies).map(
        key => `${key}=${ctx.response.cookies[key]}`
      ),
      ...headers
    });
    res.end();
    ctx.done = true;
  };

  await new Promise((resolve, reject) => {
    req
      .on("data", chunk => {
        ctx.request.body.push(chunk);
      })
      .on("end", () => {
        ctx.request.body = Buffer.concat(ctx.request.body).toString();
        try {
          ctx.request.body = JSON.parse(ctx.request.body);
        } catch (e) {
          try {
            ctx.request.body = qs.parse(ctx.request.body);
          } catch (x) {}
        }
        resolve(true);
      })
      .on("error", reject);
  });

  return ctx;
}
