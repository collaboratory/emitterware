const uuid = require("uuid/v4");
module.exports = config => {
  if (!config.store) {
    config.store = {
      set: (id, key, value) => {
        config.store.sessions[id][key] = value;
        console.log(config.store.sessions[id][key]);
      },
      get: (id, key) => {
        return config.store.sessions[id][key];
      },
      initSession: id => {
        if (!config.store.sessions.hasOwnProperty(id)) {
          config.store.sessions[id] = {};
        }
      },
      sessions: {}
    };
  }

  return async (ctx, next) => {
    const sessionID = ctx.request.cookies.sessionID || uuid();
    config.store.initSession(sessionID);

    ctx.session = {
      id: sessionID,
      set: (key, value) => {
        return config.store.set(sessionID, key, value);
      },
      get: key => {
        return config.store.get(sessionID, key);
      },
      destroy: () => {
        delete config.store.sessions[sessionID];
      },
      data: config.store.sessions[sessionID]
    };
    ctx.response.cookies.sessionID = sessionID;

    await next();
  };
};
