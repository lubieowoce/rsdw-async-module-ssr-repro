const React = require("react");

console.log("hello from two [ssr]");

function Two() {
  React.useState();
  return React.createElement("article", null, "Two!");
}

module.exports.__esModule = true;
module.exports.Two = Two;
