const ws = require("ws");
/**
 *
 * @param port
 * @param host
 * @param config
 * @returns {function(*=, *)}
 * @constructor
 */
module.exports = function websocket(config = {}) {
  if (!config.server) {
    if (!config.host) {
      config.host = "localhost";
    }
    if (!config.port) {
      config.port = 9000;
    }
  }

  // TODO: Make use of config & service variables
  const provider = {
    id: "ws",
    server: null
  };
  provider.handler = (onRequest, service) => {
    provider.server = new ws.Server(config);
    provider.server.on("connection", sock => {
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

    console.log(
      `Emitterware websocket provider listening${
        config.server ? "." : ` at ${config.host}:${config.port}`
      }`
    );
  };
  return provider;
};
