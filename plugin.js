import { BACKEND_OPTIONS_DEFAULTS } from "./shared.js";

/**
 * @param {import("./shared").BackendOptions} options
 * @returns {import("vite").Plugin}
 */
export default function (options = {}) {
	const { entryPoint = BACKEND_OPTIONS_DEFAULTS.entryPoint } = options;
	let lastStopBackend = undefined;

	return {
		name: "svelte-adapter-node-backend-plugin",
		enforce: "post",
		config: (config, env) => {
			// In build mode, add the backend as an entrypoint, so the regular build process catches it
			// The adapter can then import and call the module
			if (env.command === "build") {
				/* @ts-ignore - svelte-vite-plugin-setup is creating this object for sure */
				config.build.rollupOptions.input["backend"] = "$lib/server/index.ts";
			}
			return config;
		},
		configureServer: (server) => {
			// In dev mode, attach the backend to the dev server
			return async () => {
				if (!server.httpServer) {
					throw new Error("No httpServer to inject into");
				}
				const { startBackend, stopBackend } = await server.ssrLoadModule(entryPoint);
				await startBackend(server.httpServer);
				lastStopBackend = stopBackend;
			};
		},
		handleHotUpdate: async (ctx) => {
			// If a backend module is updated, restart all services
			for (const module of ctx.modules) {
				for (const importer of module.importers) {
					if (importer.url === entryPoint) {
						if (lastStopBackend !== undefined) {
							await lastStopBackend();
						}

						try {
							const { startBackend, stopBackend } = await ctx.server.ssrLoadModule(entryPoint);
							await startBackend(ctx.server.httpServer);
							lastStopBackend = stopBackend;
							return ctx.modules;
						} catch (e) {
							lastStopBackend = undefined;
							throw e;
						}
					}
				}
			}
			return ctx.modules;
		},
	};
}
