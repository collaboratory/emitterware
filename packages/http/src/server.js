import qs from "qs";
import http from "http";
import https from "https";
import Emitterware from "@emitterware/core";
import createContext from "./context.js";

export default class HTTPServerProvider {
  constructor({
    app = false,
    protocol = "http",
    id = undefined,
    server = undefined,
    ...serverConfig
  } = {}) {
    this.id = id || protocol;
    this.app = app || new Emitterware();
    this.protocol = protocol;
    this.server = server;

    if (!this.server) {
      this.server = (protocol === "https" ? https : http).createServer(
        serverConfig,
        this.requestHandler
      );
    }
  }

  on(event, fn) {
    this.app.on(event, ifProvider(fn, this.id));
  }

  off(event, fn) {
    this.app.off(event, ifProvider(fn, this.id));
  }

  listen(port = 4357, hostname = "localhost") {
    this.server.listen(port, hostname);
  }

  requestHandler = async (request, response) => {
    const ctx = createContext(request, response, {
      provider: this.id,
      protocol: this.protocol,
    });
    ctx.files = {};
    ctx.params = {};
    ctx.query = qs.parse(request.url.split("?")[1] || "");

    ctx.body = await new Promise((resolve, reject) => {
      try {
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
      } catch (e) {
        reject(e);
      }
    });
    const result = await this.app.emit(request.url, ctx);
    if (!ctx.responded) {
      ctx.respond(result || ctx.response || { status: 404, body: "Not found" });
    }
  };
}

export function ifHTTPMethod(method, middleware) {
  return function ifHTTPMethodMiddleware(ctx, next) {
    if (ctx.headers && ctx.headers.method === method) {
      return middleware(ctx, next);
    } else {
      return next();
    }
  };
}

export function ifProvider(middleware, provider = "http") {
  return function ifHTTPMiddleware(ctx, next) {
    if (ctx.provider === provider) {
      return middleware(ctx, next);
    } else {
      return next();
    }
  };
}
