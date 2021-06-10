# @emitterware/core

Unopinionated and simple tools for event driven architecture.

## What is Emitterware?

Emitterware is an attempt to standardize JavaScript input/output services by standardizing their commonalities:

1. An event is initialized from some input source 2. This input includes some piece of information to identify the purpose of the request (URL, type, channel, etc...) 3. This input may include some request metadata (headers, request identifier) 4. This input may include a payload (plaintext, JSON, formdata)
2. Output confirming the request or providing requested data is desirable 3. This output includes a request identifier 4. This output may include some response metadata (headers, session identifier)

If you need to provide the same output for multiple input sources, standardizing the input will enable you to use the same event handlers across multiple input sources.

## Example Middleware

`handlers/books/index.js`

```js
export async function getBooks(ctx) {
  const { conditions = {} } = ctx.body;
  const books = await Books.where(conditions).fetchAll();
  return { books };
}
```

`handlers/http/spa.js`

```js
import fs from "fs";
const template = fs.readFileSync("./template.html");
export async function spaHandler(ctx) {
  const { head, body } = await handleSSR(ctx);
  return {
    body: template.replace("%head%", head).replace("%body%", body),
  };
}
```

`handlers/auth/http.js`

```js
import Users from "../models/users";
export async function httpAuth(ctx, next) {
  const { user_id } = ctx.session;
  ctx.user = user_id && (await Users.findById(user_id));
  if (!ctx.user) {
    return {
      status: 401,
      body: "Not authorized",
    };
  }
  await next();
}
```

`handlers/auth/websocket.js`

```js
import Users from "../models/users";
export async function websocketAuth(ctx, next) {
  const { user_id } = ctx.request;
  ctx.user = user_id && (await Users.findById(user_id));
  if (!ctx.user) {
    return {
      status: 401,
      body: "Not authorized",
    };
  }
  await next();
}
```

## Example Server

`server.js`

```js
import Emitterware from "@emitterware/core";
import HTTPServer, { httpIfMethod, ifHTTP } from "@emitterware/http";
import WebsocketServer, { ifWebsocket } from "@emitterware/websocket";
import sessionHandler from "@emitterware/session";

import spaHandler from "./handlers/http/spa";
import bodyParser from "./handlers/http/bodyParser";
import httpAuth from "./handlers/auth/http";
import websocketAuth from "./handlers/auth/websocket";
import websocketError from "./handlers/websocket/error";
import booksHandler from "./handlers/books";

const app = new Emitterware();
const http = new HTTPServer({ app });
const websocket = new WebsocketServer({ app });

http.use("*", sessionHandler);

// when using app.use, all HTTP methods (GET, POST, etc...) are served
app.use("ping", pingHandler);

// the http provider exports the httpIfMethod to customize this behavior
app.use("books", httpIfMethod("GET", booksHandler));

// or handlers can be specifically registered with providers
http.use("/protected/*", httpAuth);
websocket.use("/protected/*", websocketAuth);
app.use("/protected/profile", profileHandler);

// wildcard handlers are supported on all providers
app.use("*", [ifWebsocket(websocketError), ifHTTP(spaHandler)]);
```
