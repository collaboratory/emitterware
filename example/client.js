import Emitterware from "../packages/core/src/emitterware.js"
import { WebsocketClient } from "../packages/websocket/src/index.js";
import { HTTPClient } from "../packages/http/src/index.js";

const app = new Emitterware();
const ws = new WebsocketClient();
console.log("websocket client connecting");
ws.on("connect", async (ctx) => {
  console.log("ws connected, sending init");
  ctx.response = { path: "init" };
});

ws.on("init", async (ctx) => {
  console.log("ws init received");
});

const http = new HTTPClient();
console.log("http client connecting")

http.request("http://localhost:3000/").pipe(app);