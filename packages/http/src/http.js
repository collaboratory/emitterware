const qs = require("querystring");
const anyBody = require("body/any");

const globals = {
  requestID: 0
};

/**
 * HTTP provider
 * @param port
 * @param host
 * @param config
 * @returns {function(*=, *)}
 * @constructor
 */
const http = function({
  port = 3000,
  host = "127.0.0.1",
  logger = false,
  listen = true,
  loggerOptions = {},
  ...config
} = {}) {
  const provider = {
    id: "http",
    server: null,
    logger
  };

  // Configure the logger
  let httpLogger = false;
  if (!logger) {
    logger = require("pino")({
      level: process.env.LOG_LEVEL || "info",
      prettyPrint: true,
      ...loggerOptions
    });
  }

  if (!loggerOptions.disableHttp) {
    try {
      httpLogger = require("pino-http")({ logger });
    } catch (e) {}
  }

  provider.handler = (onRequest, app) => {
    const requestHandler = async (req, res) => {
      try {
        httpLogger && httpLogger(req, res);
        const baseContext = await http.context({ app, logger }, req, res);
        if (baseContext === false) {
          return res.end();
        }

        const ctx = await onRequest(baseContext, "web");
        if (!ctx.done && ctx !== false) {
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
              logger.warn("@emitterware/http - respond", {
                warning: "ctx.response.body is unset"
              });
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
      } catch (error) {
        console.error(error);
        logger.error("@emitterware/http - respond", { error });
      }
    };

    provider.server = require("http").createServer(
      {
        host,
        port,
        ...config
      },
      requestHandler
    );

    logger.info(
      `@emitterware/http - init; listening at http://${host}:${port} `,
      {
        host,
        port
      }
    );

    if (listen) {
      provider.server.listen({ port, host });
    }

    provider.server.on("clientError", (error, socket) => {
      logger.warn("@emitterware/http - clientError", { error });
      return onRequest(http.context(null, null, error));
    });
  };

  provider.shutdown = () => {
    logger.info("@emitterware/http - shutdown");
    const wait = new Promise(resolve => provider.server.close(resolve));
    setImmediate(() => provider.server.emit("close"));
    return wait;
  };

  return provider;
};

http.context = async function(ctx = {}, req = null, res = null, error = null) {
  const [url, queryString = ""] = req.url.split("?");
  const query = qs.parse(queryString);

  ctx.prefetch = {};

  ctx.request = {
    id: globals.requestID++,
    url,
    query,
    error,
    headers: req.headers,
    trailers: req.trailers,
    method: req.method,
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

  // Analyze request to determine parse method
  const [contentType] = (ctx.request.headers["content-type"] || "").split(";");

  if (contentType === "multipart/form-data") {
    const { Form } = require("multiparty");
    const form = new Form();
    await new Promise((resolve, reject) => {
      form.parse(ctx.request.raw(), (err, fields, files) => {
        if (err) {
          ctx.response.status = 500;
          ctx.response.body = err;
          resolve(false);
        }

        ctx.request.body = fields;
        ctx.request.files = files;

        resolve();
      });
    });
  } else {
    let error = false;
    let body = {};
    try {
      [error, body] = await new Promise(resolve =>
        anyBody(req, res, (err, body) => resolve([err, body]))
      );
    } catch (err) {
      error = err;
    }

    if (error) {
      if (!["text/html", ""].includes(contentType)) {
        ctx.logger.error("@emitterware/http - any/body", { error });
        res.writeHead(500, {});
        res.write(JSON.stringify({ error }));
        return res.end() && false;
      }
    }

    ctx.request.error = error;
    ctx.request.body = body;
  }

  ctx.error = (code, message) => {
    ctx.response.status = code;
    ctx.response.body = { error: message };
  };
  ctx.throw = ctx.error;

  ctx.success = body => {
    ctx.response.status = 200;
    ctx.response.body = body;
  };

  // Cookies support
  ctx.request.cookies = ctx.request.headers.cookie
    ? qs.parse(ctx.request.headers.cookie.replace(/; /g, "&"))
    : {};

  // Sanitize cookies
  Object.keys(ctx.request.cookies).map(key => {
    if (Array.isArray(ctx.request.cookies[key])) {
      ctx.request.cookies[key] = ctx.request.cookies[key][0];
    } else if (ctx.request.cookies[key] !== null) {
      ctx.request.cookies[key] = ctx.request.cookies[key].split(",")[0];
    }
  });

  ctx.redirect = (location, status = 302, headers = {}) => {
    const res = ctx.response.raw();
    res.writeHead(status, {
      Location: location,
      "Set-Cookie": [
        ...Object.keys(ctx.response.cookies).map(
          key =>
            `${key}=${ctx.response.cookies[key]}; Domain=localhost; Path=/;`
        )
      ],
      ...headers
    });
    res.end();
    ctx.done = true;
  };

  return ctx;
};

http.convertMiddleware = function(fn, finalize = false) {
  return async (ctx, next) => {
    if (finalize) {
      ctx.done = true;
    }

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

    await new Promise((resolve, reject) => {
      const req = ctx.request.raw();
      const res = ctx.response.raw();

      res.send = body => {
        res.write(body);
        res.end();
        resolve();
      };

      fn(req, res, async () => {
        res.end();
        resolve();
      });
    });

    await next();
  };
};

module.exports = http;
