// @ts-check
const { Module } = require("node:module");
const { AsyncLocalStorage } = require("node:async_hooks");
const { create: createResolver } = require("enhanced-resolve");
const isBuiltinModule = require("is-builtin-module");

/** @type {AsyncLocalStorage<boolean>} */
const IsReactServerStorage = new AsyncLocalStorage();

/** @template T */
function runAsServer(/** @type {() => T}} */ callback) {
  return IsReactServerStorage.run(true, callback);
}

/** @template T */
function runAsClient(/** @type {() => T}} */ callback) {
  return IsReactServerStorage.run(false, callback);
}

const Module$_load = Module["_load"];

Module["_load"] = function (request, context) {
  // if we've been wrapped in `runAsClient` or `runAsServer`,
  // we want to hijack module resolution to:
  // - apply the "react-server" condition (for server)
  // - not apply it (for client)
  const isReactServer = IsReactServerStorage.getStore();
  if (isReactServer === undefined) {
    // no wrapper, do nothing.
    return Module$_load.call(this, request, context);
  }

  let resolvedRequest = request;
  // enhanced-resolve doesn't like resolving imports of node builtins, so skip them.
  if (!isBuiltinModule(request)) {
    const resolver = isReactServer ? resolverServer : resolverClient;
    resolvedRequest = resolver({}, context?.path ?? "/", request);
  }

  return Module$_load.call(this, resolvedRequest, context);
};

const resolverServer = createResolver.sync({
  conditionNames: ["react-server", "webpack", "node", "require"],
  fullySpecified: false,
});

const resolverClient = createResolver.sync({
  conditionNames: ["node", "webpack", "require"],
  fullySpecified: false,
});

module.exports.runAsServer = runAsServer;
module.exports.runAsClient = runAsClient;
