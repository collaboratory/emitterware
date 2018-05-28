const ws = require("ws");

/**
 *
 * @param port
 * @param host
 * @param config
 * @returns {function(*=, *)}
 * @constructor
 */
export function WebSocketProvider({
  port = 9000,
  host = "127.0.0.1",
  ...config
} = {}) {
  // TODO: Make use of config & service variables
  return (onRequest, service) => {
    const server = new ws.Server({
      port,
      host,
      ...config
    });

    server.on("connection", sock => {
      const conn = { sock };
      onRequest({ action: "init", conn }, service).then(connCtx => {
        sock.on("message", message => {
          let body;
          try {
            body = JSON.parse(message);
          } catch (e) {
            body = { message };
          }
          const { url = "/", ...data } = body;
          return onRequest({
            url,
            data,
            conn: connCtx.conn,
            sent: false
          }).then(ctx => {
            if (!ctx.sent) {
              sock.send(JSON.stringify(ctx.response));
            }
          });
        });
      });
    });

    console.log(`Emitterware websocket provider listening at ${host}:${port}`);
  };
}
export default WebSocketProvider;
