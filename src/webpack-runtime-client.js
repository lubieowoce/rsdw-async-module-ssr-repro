// @ts-check
const chalk = require("chalk");
const { runAsClient } = require("./patch-require");

/** @type {Map<string, Promise<any>>} */
const webpackRequireCache = new Map();

/**
 * Call require, cache the result, and wrap the exports in a promise with extra status fields for sync access.
 * @param {string} file
 * @returns {Promise<any>}
 * */
const getOrImport = (file) => {
  let promise = webpackRequireCache.get(file);
  if (!promise) {
    const newPromise = runAsClient(() => {
      const moduleExports = require(file);
      // the ssr file exports a promise to pretend it's an async module.
      // (we can't make it ESM, because then our require() patch breaks)
      return isThenable(moduleExports)
        ? trackThenableState(moduleExports)
        : createFulfilledPromise(moduleExports);
    });
    webpackRequireCache.set(file, newPromise);
    promise = newPromise;
  }
  return /** @type {NonNullable<typeof promise>}*/ (promise);
};

/** @param {string} chunkId */
globalThis.__webpack_chunk_load__ = (chunkId) => {
  console.log(chalk.gray(`__webpack_chunk_load__("${chunkId}")`));
  // no good way to preload a chunk, because we're not in webpack.
  // assume it's just a filename and require() it.
  return getOrImport(chunkId);
};

/** @param {string} file */
globalThis.__webpack_require__ = (file) => {
  console.log(chalk.gray(`__webpack_require__("${file}")`));
  const promise = /** @type {any} */ (getOrImport(file));

  if (promise.status === "rejected") {
    throw promise.reason;
  }
  if (promise.status === "fulfilled") {
    return promise.value;
  }

  return promise;
};

function isThenable(value) {
  return value && typeof value === "object" && typeof value.then === "function";
}

function createFulfilledPromise(value) {
  const promise = Promise.resolve(value);
  // @ts-expect-error
  promise.status = "fulfilled";
  // @ts-expect-error
  promise.value = value;
  return promise;
}

function trackThenableState(promise) {
  if (typeof promise.status === "string") {
    return promise;
  }
  promise.status = "pending";
  promise.then(
    (value) => {
      promise.status = "fulfilled";
      promise.value = value;
    },
    (error) => {
      promise.status = "rejected";
      promise.reason = error;
    }
  );
  return promise;
}

module.exports = {};
