export function convertMiddleware(fn, finalize = false) {
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
}
export default convertMiddleware;
