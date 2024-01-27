import { Adapter } from "@sveltejs/kit";
import { AdapterOptions } from "@sveltejs/adapter-node";
import { BackendOptions } from "./shared";

export default function adapter(options?: AdapterOptions & BackendOptions): Adapter;
