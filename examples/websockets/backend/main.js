const { EmitterwareApp } = require("@emitterware/app");
const { WebSocketProvider } = require("@emitterware/websocket");

const app = new EmitterwareApp();
app.provider("ws", new WebSocketProvider({ port: 9000 }));
app.use((ctx, next) => {
  if (ctx.action === "init") {
    console.log("Initializing socket connection");
    ctx.response = {
      status: 200
    };
  } else {
    console.log("Unhandled action", ctx.action);
    ctx.response = {
      status: 404
    };
  }
});
