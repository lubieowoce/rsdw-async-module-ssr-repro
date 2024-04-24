const React = require("react");
const { One } = require("./client/one.rsc.js");
const { Two } = require("./client/two.rsc.js");

function ServerRoot() {
  return React.createElement(
    "html",
    null,
    React.createElement(One),
    React.createElement(Two)
  );
}

module.exports.__esModule = true;
module.exports.ServerRoot = ServerRoot;
