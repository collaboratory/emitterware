const qs = require("querystring");

export async function httpContext(
  ctx = {},
  req = null,
  res = null,
  error = null
) {
  const [url, queryString = ""] = req.url.split("?");
  const query = qs.parse(queryString);

  ctx.prefetch = {};

  ctx.request = {
    url,
    query,
    headers: req.headers,
    trailers: req.trailers,
    method: req.method,
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

  ctx.error = (code, message) => {
    ctx.response.status = code;
    ctx.response.body = { error: message };
  };

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
export default httpContext;
