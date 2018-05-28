const WebSocket = require("ws");

console.log("Connecting");
const sock = new WebSocket("ws://localhost:9000");
sock.on("message", message => {
  console.log("Incoming message:", message);
});
sock.on("open", () => {
  console.log("Socket opened, emitting 'test'");
  sock.send(
    JSON.stringify({
      url: "/test",
      help: true
    })
  );
});
