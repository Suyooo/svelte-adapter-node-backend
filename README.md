# svelte-adapter-node-backend

[Install from NPM](https://www.npmjs.com/package/svelte-adapter-node-backend): `npm install svelte-adapter-node-backend`

Uses adapter-node to build a standalone Node server from a SvelteKit app, but allows injecting additional code into the
server. This can be used to attach services to the server instance, such as a Socket.IO server.

In most cases, seperating the frontend and backend services is the better option in production. This module is meant
more for prototyping, or cases where a monolithic application is preferred for ease of setup.

Tested using Node v20.11 on Linux.

## Setup

Add the plugin to your `vite.config.ts`:

```javascript
import backend from "svelte-adapter-node-backend/plugin";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [sveltekit(), backend()],
});
```

Use the adapter in your `svelte.config.js`:

```javascript
import adapter from "svelte-adapter-node-backend/adapter";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),
	},
};

export default config;
```

Then, create the entry point file (`src/lib/server/index.ts` by default, see Options below). You must export two
functions:

- `startBackend(server: Server)` takes an instance of the Node built-in `http.Server`. You can pass the object to other
  modules so they can attach to the existing server.
- `stopBackend()` must stop all services you have started in `startBackend`. This is used for HMR during development, to
  shutdown the previous version of the module before it is replaced and the new version is started. The method will not
  be called in production - so do not use it to, for example, persist data, as it will never be executed (see also:
  [the adapter-node FAQ on the Svelte site](https://kit.svelte.dev/docs/adapter-node#troubleshooting)).

Both of these functions can optionally be `async`. The functions will be `await`ed in development mode.

## Options

You can pass an options object to both the plugin and adapter functions. Make sure both recieve the same options.

```javascript
{
	// default options are shown
	entryPoint: "src/lib/server/index.ts", // file exporting the startBackend/stopBackend functions
}
```

The options object for the adapter function can also contain any of
[the options for `adapter-node`](https://kit.svelte.dev/docs/adapter-node#options), which will be forwarded to that
adapter.

## Examples

- [twitch-tgar-rating](https://github.com/Suyooo/twitch-tgar-rating/blob/main/src/lib/server/index.ts) sets up a
  Socket.IO server and a Twitch chatbot in the backend.
