import qs from "qs";
import http from "http";
import Emitterware from "@emitterware/core";
import createContext from "./context.js";

export default class HTTPServerProvider {
  constructor(
    config = { port: 3000, hostname: "localhost" },
    { app = false, id = "http", protocol = http } = {}
  ) {
    this.id = id;
    this.app = app || new Emitterware();

    this.server = protocol.createServer(config, this.requestHandler);
    this.server.listen(config.port, config.hostname);

    return this.app;
  }

  requestHandler = async (request, response) => {
    const ctx = createContext(request, response, {
      provider: this.id,
    });
    ctx.files = {};
    ctx.params = {};
    ctx.query = qs.parse(request.url.split("?")[1] || "");

    ctx.body = await new Promise((resolve, reject) => {
      if (request.method === "POST") {
        const body = {};
        var busboy = new Busboy({ headers: request.headers });
        busboy.on(
          "file",
          function (fieldname, file, filename, encoding, mimetype) {
            const f = { file, filename, encoding, mimetype, data: [] };
            file.on("data", function (data) {
              f.data.push(data);
            });
            file.on("end", function () {
              f.data = f.data.join();
            });
            ctx.files[fieldname];
          }
        );
        busboy.on("field", function (fieldname, value) {
          body[fieldname] = value;
        });
        busboy.on("finish", function () {
          resolve(body);
        });
        busboy.on("error", function (err) {
          console.error("Error parsing form data", err);
          resolve(body);
        });
        request.pipe(busboy);
      } else {
        if (request.headers["Content-Type"] === "application/json") {
          resolve(JSON.parse(request.body));
        } else if (
          (request.headers["Content-Type"] =
            "application/x-www-form-urlencoded")
        ) {
          resolve(qs.parse(request.body));
        }
      }
    });
    const result = await this.app.emit(request.path, ctx);
    if (!ctx.responded) {
      ctx.respond(result || ctx.response || { status: 404, body: "Not found" });
    }
  };
}

export function httpIfMethod(method, middleware) {
  return async function httpIfMethodMiddleware(ctx, next) {
    if (ctx.provider === "http" && ctx.headers.method === method) {
      await middleware(ctx, next);
    } else {
      await next();
    }
  };
}

export function ifHTTP(middleware) {
  return async function ifHTTPMiddleware(ctx, next) {
    if (ctx.provider === "http") {
      await middleware(ctx, next);
    } else {
      await next();
    }
  };
}
