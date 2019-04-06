# @emitterware/app

The extensible basis of all emitterware applications

### Usage
```js
const { App } = require("@emitterware/app");
const { http } = require("@emitterware/http");

const app = new App();

// Subscribe to the HTTP event provider
app.subscribe(http({
  port: 3000
}));

// Unsubscribe from the HTTP event provider
app.unsubscribe("http");

const httpMiddleware = async ctx => {
  ctx.response.body = {
    hello: "world"
  }
};

// Register an event middleware
app.on("http", httpMiddleware);

// Unregister an event middleware
app.off("http", httpMiddleware)
```