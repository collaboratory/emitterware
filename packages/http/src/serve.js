import fs from "fs";
import path from "path";

const fileExistsCache = {};
const staticFileCache = {};
export function serve(url, dirname, cache = false) {
  return async (ctx, next) => {
    const fileName = path.resolve(`${dirname}${ctx.request.url}`);

    if (!fileExistsCache.hasOwnProperty(fileName)) {
      try {
        const stats = fs.lstatSync(fileName);
        fileExistsCache[fileName] = stats && stats.isFile();
      } catch (err) {}
    }

    if (fileExistsCache[fileName]) {
      if (cache && staticFileCache[fileName]) {
        ctx.response.body = staticFileCache[fileName];
      } else {
        const body = fs.readFileSync(fileName);
        ctx.response.body = body.toString();
        if (cache) {
          staticFileCache[fileName] = ctx.response.body;
        }
      }
    } else {
      await next();
    }
    // const stats = fs.lstatSync();
  };
}
export default serve;
