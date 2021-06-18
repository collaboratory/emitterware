import Emitterware from "@emitterware/core";
import ws from "ws";

export function TRANSFORM_JSON(message) {
  return JSON.stringify(message);
}

export function TRANSFORM_JSON_HMAC_SHA256(message) {}

export default class WebsocketClient {
  constructor(
    config = "ws://localhost:3005/",
    { app = false, id: providerId = "ws.client" } = {}
  ) {
    this.app = app || new Emitterware();
    this.client = new ws(config);
    this.client.on("open", async () => {
      const ctx = this.buildContext();
      await this.app.emit("connect", ctx);
      if (ctx.response) {
        this.send(ctx.response);
      }
    });
    this.client.on("message", async (message) => {
      const { id, path, ...body } = JSON.parse(message) || {};
      const ctx = {
        request: { id, path, body, sock: this.client, providerId },
        response: null,
      };
      await this.app.emit(path, ctx);
      if (ctx.response) {
        this.send({ id, ...ctx.response });
      }
    });
  }

  on(event, cb) {
    return this.app.on(event, cb);
  }

  off(event, cb) {
    return this.app.off(event, cb);
  }

  emit(event, ...args) {
    return this.app.emit(event, ...args);
  }

  send(message) {
    return this.client.send(JSON.stringify(message));
  }

  buildContext(request = {}) {
    return {
      ...request,
      respond: (msg) => this.send(msg),
    };
  }
}
