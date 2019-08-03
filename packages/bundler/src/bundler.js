const { convertMiddleware } = require("@emitterware/http");
const Bundler = require("parcel-bundler");
module.exports = function bundler(entry = "./static/index.html", options = {}) {
  return convertMiddleware(new Bundler(entry, options).middleware(), true);
};
