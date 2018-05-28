export function convertMiddleware(fn, finalize = false) {
  return async (ctx, next) => {
    console.log('Should finalize: ', finalize);
    if (finalize) {
      console.log('Finalizing');
      ctx.done = true;
    }

    // Set our cookies
    if (Object.keys(ctx.response.cookies).length) {
      console.log('Setting headers');
      ctx.response
        .raw()
        .setHeader(
          "Set-Cookie",
          Object.keys(ctx.response.cookies).map(
            key => `${key}=${ctx.response.cookies[key]}`
          )
        );
      console.log('Done');
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
