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

        ctx.request.body = Object.entries(fields).reduce(
          (res, [key, value]) => {
            res[key] = Array.isArray(value)
              ? value.length > 1
                ? value
                : value[0]
              : value;
            return res;
          },
          {}
        );
        ctx.request.files = files;

        resolve();
      });
    });
  } else {
    await new Promise((resolve, reject) => {
      req
        .on("data", chunk => {
          ctx.request.body.push(chunk);
        })
        .on("end", () => {
          ctx.request.body = Buffer.concat(ctx.request.body).toString();
          if (contentType.indexOf("json") > -1) {
            ctx.request.body = JSON.parse(ctx.request.body);
          } else {
            ctx.request.body = qs.parse(ctx.request.body);
          }
          resolve(true);
        })
        .on("error", reject);
    });
  }

  return ctx;
}
export default httpContext;
