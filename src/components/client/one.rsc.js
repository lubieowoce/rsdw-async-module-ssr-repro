const RSDWServer = require("react-server-dom-webpack/server");
const url = require("node:url");

const proxy = RSDWServer.createClientModuleProxy(
  url.pathToFileURL(require.resolve("./one.js")).href
);

module.exports.__esModule = true;
module.exports.One = proxy.One;
