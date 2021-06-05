import Emitterware from "@emitterware/core";
import ws from "ws";

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
      console.log("emitted", ctx);
      if (ctx.response) {
        this.client.send(ctx.response);
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
        this.client.send({ id, ...ctx.response });
      }
    });
    return this.app;
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
