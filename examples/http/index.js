const App = require("../../packages/app/src/app");
const http = require("../../packages/http/src/http");

const app = new App();
app.subscribe(
  http({
    host: "0.0.0.0",
    port: 4000
  })
);

app.on("http", async ctx => {
  ctx.body = "hello, world";
});
