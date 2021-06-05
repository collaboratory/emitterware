import { WebsocketClient } from "../packages/websocket/src/index.js";

const client = new WebsocketClient();
console.log("client connecting");
client.on("connect", async (ctx) => {
  console.log("init received");
  ctx.response = { path: "init", id: "420" };
});
