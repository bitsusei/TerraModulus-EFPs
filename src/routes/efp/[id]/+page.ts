import { error } from '@sveltejs/kit';
import type { PageLoadEvent } from './$types';
import { redirect } from '@sveltejs/kit';

export async function load({ parent, params, url }: PageLoadEvent) {
	const map = (await parent()).map;
	if (map[params.id] === undefined) {
		if (url.searchParams.get("fallback") !== null) {
			if (url.searchParams.get("fallback") === "preview") {
				const source = url.searchParams.get("source");
				const raw = url.searchParams.get("raw");
				if (source === null || raw === null) throw error(400, "Bad Request");
				const target = new URL("/preview", url);
				target.searchParams.set("source", source);
				target.searchParams.set("raw", raw);
				redirect(303, target);
			} else throw error(400, "Bad Request");
		} else throw error(404, "Not Found");
	}

	const efp = map[params.id].main;
	return { efpId: params.id, title: `EFP ${efp.id} - ${efp.title}`, tableOfContents: efp.tableOfContents };
}
