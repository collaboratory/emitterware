import { WebsocketServer } from "../packages/websocket/src/index.js";

const server = new WebsocketServer();
console.log("server listening");
server.on("init", () => {
  console.log("init received");
});
