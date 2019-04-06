const { EmitterwareApp } = require("@emitterware/app");
const CLIProvider = require("../main");

const app = new EmitterwareApp();
const cli = new CLIProvider();

const quotes = [
  "No problem can withstand the assault of sustained thinking",
  "Those who can make you believe absurdities can make you commit atrocities.",
  "Best is the enemy of good",
  "Common sense is not so common"
];
cli.addCommand("quote", {
  run: async (ctx, next) => {
    ctx.log(quotes[Math.round(Math.random() * quotes.length)]);
  }
});
app.subscribe(cli);

app.on(
  "cli",
  async (ctx, next) => {
    console.log("CLI Input", ctx);
    await next();
  },
  "cli"
);
