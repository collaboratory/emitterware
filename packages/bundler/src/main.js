const { convertMiddleware } = require("@emitterware/http");
const Bundler = require("parcel-bundler");
export function bundler(options = "./static/index.html") {
  return convertMiddleware(new Bundler(options).middleware(), true);
}
export default bundler;
