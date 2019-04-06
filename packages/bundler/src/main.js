const { convertMiddleware } = require("@emitterware/http");
const Bundler = require("parcel-bundler");
export function bundler(entry = "./static/index.html", options = {}) {
	console.log(process.env.PARCEL_AUTOINSTALL);
  return convertMiddleware(new Bundler(entry, options).middleware(), true);
}
export default bundler;
