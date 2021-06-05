import Emitterware from "@emitterware/core";
import ws from "ws";

export default class WebsocketProvider {
  constructor(
    config = { port: 3005 },
    { app = false, id: providerId = "websocket" } = {}
  ) {
    this.app = app || new Emitterware();
    this.server = new ws.Server(config);
    this.server.on("connection", (sock) => {
      console.info("New connection");
      sock.on("message", async (message) => {
        console.info("New message", message);
        const { id, path, ...body } = JSON.parse(message) || {};
        const ctx = {
          request: { id, path, body, sock, providerId },
          response: null,
        };
        await this.app.emit(path, ctx);
        if (ctx.response && ctx.response.body) {
          sock.send({ id, ...ctx.response.body });
        }
      });
    });
    return this.app;
  }
}
