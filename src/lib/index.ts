// place files you want to import through the `$lib` alias in this folder.
import { base } from '$app/paths';
import BiMap from 'bidirectional-map';

export { BiMap };

export namespace App.EfpEntry {
	// key/ID: display name
	export const category = new BiMap({
		informational: "Informational",
		process: "Process",
		standard: "Standard",
	});
	export type CategoryKey = "informational" | "process" | "standard";
	export type CategoryName = "Informational" | "Process" | "Standard";

	export const status = new BiMap({
		draft: "Draft",
		deferred: "Deferred",
		provisional: "Provisional",
		final: "Final",
	});
	export type StatusKey = "draft" | "deferred" | "provisional" | "final";
	export type StatusName = "Draft" | "Deferred" | "Provisional" | "Final";
}

export const resolveLink = (link: string) => link;
