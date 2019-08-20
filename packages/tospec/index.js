const tospec = {
  config: {
    config_filenames: ["tospec.config.js", "tospec.json", ".tospecrc"]
  },
  procedures: new Map(),
  register: function(name, procedure, force = false) {
    if (tospec.procedures.has(name)) {
      throw new Error(
        `Refusing to register existing procedure "${name}" without force parameter`
      );
    }
    tospec.scaffolds.set(name, procedure);
  }
};
