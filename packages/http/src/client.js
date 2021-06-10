import http from "http";
import crypto from "crypto";
import Emitterware from "@emitterware/core";

export default class HTTPClient {
  constructor(config = {}, { app = null, id = "fetch" } = {}) {
    this.id = id;
    this.config = config;
    this.app = app || new Emitterware();
  }

  request(url, options = {}, body = null) {
    const { port, hostname, pathname, protocol } = new URL(
      url,
      this.config.baseUrl
    );
    const requestId = crypto.randomUUID();
    const method = options.method || "GET";
    const headers = {
      "Content-Type": "application/json",
      ...(this.config.headers || {}),
      ...(options.headers || {}),
    };

    const ctx = { requestId, abort: false, provider: this.id };
    const req = http.request(
      {
        port,
        hostname,
        pathname,
        protocol,
        method,
        headers,
      },
      async (res) => {
        ctx.response = { status: res.statusCode, headers: res.headers };
        await this.app.emit("status", ctx);
        await this.app.emit(`status.${requestId}`, ctx);

        if (ctx.abort) return res.abort();

        res.setEncoding(options.encoding || this.config.encoding || "utf8");
        if (ctx.pipeTo) {
          res.pipe(ctx.pipeTo);
        } else {
          const buffer = [];
          res.on("data", (chunk) => {
            buffer.push(chunk);
          });
          res.on("end", async () => {
            let body = buffer.join("\n");
            if (ctx.response.headers["Content-Type"]?.includes("json")) {
              try {
                body = JSON.parse(body);
              } catch (e) {
                console.error("Failed to parse JSON body", body);
              }
            }
            ctx.response.body = body;
            if (!ctx.aborted) await this.app.emit("response", ctx);
            if (!ctx.aborted) await this.app.emit(requestId, ctx);
          });
        }
      }
    );

    req.on("error", async (error) => {
      ctx.error = error;
      await this.app.emit("error", ctx);
      await this.app.emit(`error.${requestId}`, ctx);
    });

    if (body) req.write(body);
    req.end();
    return requestId;
  }

  fetch(url, options, body = null) {
    const requestId = this.request(url, options, body);
    return new Promise((resolve, reject) => {
      this.app.on(requestId, (ctx) => resolve(ctx.response));
      this.app.on(`error.${requestId}`, (ctx) => reject(ctx.error));
    });
  }
}
