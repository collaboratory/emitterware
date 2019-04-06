const readline = require("readline");

class CLIProvider {
  constructor({ commands = {}, ...options } = {}) {
    this.commands = {
      quit: async (params, ctx, next) => {
        ctx.log(`Exiting application`);
        process.exit();
      },
      ...commands
    };
    this.options = options;
  }

  addCommand(name, command) {
    this.commands[name] = command;
  }

  addCommands(commands = {}) {
    this.commands = {
      ...this.commands,
      ...commands
    };
  }

  handler(onRequest) {
    const [engine, script, ...params] = process.argv;
    const baseContext = {
      log: (...args) => {
        console.log(...[` > `, ...args]);
      }
    };

    onRequest({ ...baseContext, type: "init", engine, script, params }, "cli");

    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    rl.on("line", line => {
      onRequest(
        { ...baseContext, type: "line", params: line.split(" ") },
        "cli"
      );
    });
  }

  async middleware(ctx, next) {
    const params = [];
    const options = {};
    const flags = {};
    if (typeof ctx.params === "string") {
      ctx.params = ctx.params.split(" ");
    }
    ctx.params.forEach(entry => {
      if (entry.indexOf("--") === 0) {
        const [variable, value = true] = entry.substring(2).split("=");
        options[variable] = value;
      } else if (entry.indexOf("-") === 0) {
        flags[entry.substring(1)] = true;
      } else {
        params.push(entry);
      }
    });
    ctx.params = params;
    ctx.options = options;
    ctx.flags = flags;

    const [command, ...args] = ctx.params;
    if (this.commands.hasOwnProperty(command)) {
      await this.commands[command].run(args, ctx, next);
    } else if (command) {
      ctx.log(`Invalid or unregistered command: ${command}`);
    } else {
      await next();
    }
  }
}

module.exports = CLIProvider;
