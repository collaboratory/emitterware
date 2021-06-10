import Emitterware from "../packages/core/src/index.js";
import HTTPServer, {
  httpIfMethod,
  ifHTTP,
} from "../packages/http/src/index.js";
import WebsocketServer, {
  ifWebsocket,
} from "../packages/websocket/src/index.js";

const app = new Emitterware();
const http = new HTTPServer({ port: 3000 }, { app });
const websocket = new WebsocketServer({ port: 3005 }, { app });

const pingHandler = async (ctx) => {
  return { response: { pong: true } };
};

// when using app.use, all HTTP methods (GET, POST, etc...) are served
app.on("ping", pingHandler);

app.on("*", async (ctx) => {
  return { status: 404, body: "Not found" };
});
