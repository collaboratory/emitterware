export function createContext(req, res, defaults = {}) {
  const ctx = {
    ...defaults,
    responded: false,
    respond: (response) => {
      ctx.responded = true;
      return respond(res, response);
    },
    request: () => req,
    response: () => res,
    raw: () => ({ req, res }),
  };
  return ctx;
}
export default createContext;

export function respond(res, { headers = {}, body = {}, status = 200 } = {}) {
  const type =
    (headers && headers["Content-Type"]) || typeof body === "string"
      ? "text/html"
      : "application/json";
  const responseBody = type === "appliction/json" ? JSON.stringify(body) : body;
  res.writeHead(status || 200, {
    ...headers,
    "Content-Type": type,
  });
  return res.end(responseBody);
}

export function convertMiddleware(handler) {
  if (Array.isArray(handler)) {
    return handler.map(rawMiddleware);
  }
  return rawMiddleware(handler);
}

export function rawMiddleware(handler) {
  return async (ctx, next) => {
    const { req, res } = ctx.raw();
    await handler(req, res);
    if (!res.headersSent) {
      await next();
    } else {
      ctx.responded = true;
    }
  };
}
