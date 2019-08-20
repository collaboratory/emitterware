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
  app = false,
  id = "http",
  loggerOptions = {},
  ...config
} = {}) {
  const provider = {
    id,
    server: null,
    logger
  };

  // Configure the logger
  let enableHttpLogger;
  if (!logger) {
    logger = require("pino")({
      level: process.env.LOG_LEVEL || "info",
      prettyPrint: true,
      ...loggerOptions
    });
    enableHttpLogger = !loggerOptions.disableHttp;
  } else {
    enableHttpLogger = loggerOptions.enableHttp;
  }

  let httpLogger = false;
  if (enableHttpLogger) {
    try {
      httpLogger = require("pino-http")({ logger });
    } catch (error) {
      logger.warn(
        "@emitterware/http - an error was encountered when loading pino-http"
      );
    }
  }

  if (!app) {
    const App = require("@emitterware/app");
    app = new App();
  }

  provider.app = app;

  provider.handler = async (req, res) => {
    try {
      httpLogger && httpLogger(req, res);
      const reqCtx = await http.context({ app, logger }, req, res);
      if (reqCtx === false) {
        return res.end();
      }

      const resCtx = await app.request(reqCtx, provider.id);
      if (!resCtx.done && resCtx !== false) {
        if (resCtx.response.body && typeof resCtx.response.body !== "string") {
          resCtx.response.headers["Content-Type"] = "text/json";
          resCtx.response.body = JSON.stringify(resCtx.response.body);
        }

        resCtx.response.headers["Set-Cookie"] = [
          ...Object.keys(resCtx.response.cookies).map(key => {
            const value = resCtx.response.cookies[key];
            if (value !== null) {
              return `${key}=${resCtx.response.cookies[key]}; Path=/;`;
            } else {
              return `${key}=; Domain=localhost; Path=/;`;
            }
          })
        ];

        if (!resCtx.response.body) {
          if (resCtx.body) {
            resCtx.response.body = resCtx.body;
          } else {
            logger.warn("@emitterware/http - respond", {
              warning: "ctx.response.body is unset"
            });
          }
        }

        if (resCtx.headers) {
          Object.assign(resCtx.response.headers, resCtx.headers);
        }

        if (resCtx.trailers) {
          Object.assign(resCtx.response.trailers, resCtx.trailers);
        }

        res.writeHead(resCtx.response.status, resCtx.response.headers);
        res.write(resCtx.response.body);
        res.addTrailers(resCtx.response.trailers);
        return res.end();
      }
    } catch (error) {
      console.error(error);
      logger.error("@emitterware/http - respond", { error });
    }
  };

  if (!provider.server) {
    provider.server = require("http").createServer(
      {
        host,
        port,
        ...config
      },
      provider.handler
    );
  }

  logger.info(
    `@emitterware/http - init; listening at http://${host}:${port} `,
    {
      host,
      port
    }
  );

  provider.listen = () => {
    provider.server.listen({ port, host });
    provider.server.on("clientError", (error, socket) => {
      logger.warn("@emitterware/http - clientError", { error });
      return app.request(http.context(null, null, error), provider.id);
    });
  };

  provider.shutdown = () => {
    logger.info("@emitterware/http - shutdown");
    const wait = new Promise(resolve => provider.server.close(resolve));
    setImmediate(() => provider.server.emit("close"));
    return wait;
  };

  if (listen) {
    provider.listen();
  }

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
module.exports = http;

module.exports.mock = ({ provider = false, stack = [], request = {} }) => {
  const mocks = require("node-mocks-http");
  if (!provider) {
    provider = http({
      port: 0,
      logger: console,
      listen: false
    });
  }
  provider.app.on("http", stack);
  const req = mocks.createRequest({
    method: "GET",
    url: "/",
    ...request
  });
  const res = mocks.createResponse();
  return provider.handler(req, res);
};

module.exports.convertMiddleware = function(fn, finalize = false) {
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
