const React = require("react");
console.log("Hello from one [ssr, async]");

function One() {
  React.useState();
  return React.createElement("div", null, "One!");
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// pretend this is an async module, like ESM,
// so that our __webpack_require__ gives RSDW a promise.
module.exports = sleep(100).then(() => ({
  __esModule: true,
  One: One,
}));
