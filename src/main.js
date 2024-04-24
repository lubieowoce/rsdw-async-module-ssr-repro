// @ts-check
const { runAsServer, runAsClient } = require("./patch-require");
const { PassThrough, Readable } = require("node:stream");
const url = require("node:url");
const chalk = require("chalk");

const clientManifest = {
  [url.pathToFileURL(require.resolve("./components/client/one.js")).href]: {
    id: require.resolve("./components/client/one.js"),
    name: "*",
    chunks: [],
    async: false,
  },
  [url.pathToFileURL(require.resolve("./components/client/two.js")).href]: {
    id: require.resolve("./components/client/two.js"),
    name: "*",
    chunks: [],
    async: false,
  },
};

const ssrManifest = {
  moduleLoading: null,
  moduleMap: {
    // async!!!!
    [require.resolve("./components/client/one.js")]: {
      "*": {
        // redirect imports to `.ssr.` versions of a module (the non-ssr ones are placeholders anyway)
        id: require.resolve("./components/client/one.ssr.js"),
        name: "*",
        chunks: [], // make sure it can't be preloaded and has to use requireAsyncModule
        async: true, // <----------- this should work, but only works after patching react
      },
    },
    // not async
    [require.resolve("./components/client/two.js")]: {
      "*": {
        id: require.resolve("./components/client/two.ssr.js"),
        name: "*",
        chunks: [],
        async: false,
      },
    },
  },
};

async function main() {
  const serverStream = await runAsServer(async () => {
    // @ts-expect-error
    const RSDWServer = require("react-server-dom-webpack/server");
    const React = require("react");

    console.assert(
      typeof React.useState === "undefined",
      "Server got the client build of react"
    );

    const { ServerRoot } = require("./components/server-root");

    const serverRoot = React.createElement(ServerRoot, null);

    const serverStream = RSDWServer.renderToPipeableStream(
      serverRoot,
      clientManifest
    );

    return serverStream.pipe(new PassThrough());
  });

  const clientStream = await runAsClient(async () => {
    require("./webpack-runtime-client");
    const RSDWClient = require("react-server-dom-webpack/client");
    const ReactDOMServer = require("react-dom/server");
    const React = require("react");

    console.assert(
      typeof React.useState === "function",
      "Client got the server build of react"
    );

    serverStream.on("data", (chunk) =>
      console.log(chalk.gray(new TextDecoder().decode(chunk)))
    );

    // @ts-expect-error
    const clientRoot = await RSDWClient.createFromNodeStream(
      serverStream,
      ssrManifest
    );

    const clientStream = ReactDOMServer.renderToPipeableStream(clientRoot).pipe(
      new PassThrough()
    );

    return clientStream;
  });

  const textDecoder = new TextDecoder();
  for await (const chunk of Readable.toWeb(clientStream)) {
    console.log(chalk.blueBright(textDecoder.decode(chunk)));
  }
}

main();
