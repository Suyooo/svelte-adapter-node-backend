import nodeAdapter from "@sveltejs/adapter-node";
import { appendFileSync, readFileSync, unlinkSync } from "node:fs";
import { BACKEND_OPTIONS_DEFAULTS } from "./shared.js";

/**
 * @param {import("@sveltejs/adapter-node").AdapterOptions & import("./shared").BackendOptions} options
 * @returns {import("@sveltejs/kit").Adapter}
 */
export default function (options = {}) {
	const baseAdapter = nodeAdapter(options);
	const { entryPoint = BACKEND_OPTIONS_DEFAULTS.entryPoint, out = "build" } = options;

	return {
		name: "svelte-adapter-node-backend-adapter",
		async adapt(builder) {
			// The backend code has been already built through the config change in the Vite plugin (see plugin.js)
			// Re-export backend from server/index.js to avoid it being eliminated by tree-shaking
			builder.log.minor("Adding backend module to server build output");
			appendFileSync(
				`${builder.config.kit.outDir}/output/server/index.js`,
				`
export { startBackend } from "./backend.js";
`
			);

			// Adapt Node standalone server as usual, the backend is now included
			await baseAdapter.adapt(builder);

			// Remove unused backend bundle in client folder
			builder.log.minor("Remove backend bundle from client folder");
			const manifest = JSON.parse(
				readFileSync(`${builder.config.kit.outDir}/output/client/.vite/manifest.json`, "utf8")
			);
			const backendClientFile = manifest[entryPoint]["file"];
			unlinkSync(`${out}/client/${backendClientFile}`);

			// Append backend injection code to end of index.js
			builder.log.minor("Appending backend injection code to server/index.js");
			appendFileSync(
				`${out}/index.js`,
				`
import { startBackend } from "./server/index.js";
startBackend(server.server);
`
			);
		},
	};
}
