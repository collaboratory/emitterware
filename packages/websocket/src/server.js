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
        const response = await this.app.emit(path, ctx);
        if (response || ctx.response) {
          sock.send(JSON.stringify({ id, ...(response || ctx.response) }));
        }
      });
    });
    return this.app;
  }
}

export function ifWebsocket(middleware) {
  return async function ifWebsocketMiddleware(ctx, next) {
    if (ctx.provider === "websocket") {
      await middleware(ctx, next);
    } else {
      await next();
    }
  };
}
