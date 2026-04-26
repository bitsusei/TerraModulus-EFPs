import { error } from '@sveltejs/kit';
import type { PageLoadEvent } from './$types';

export async function load({ parent, params }: PageLoadEvent) {
	const map = (await parent()).map;
	if (map[params.id] === undefined) throw error(404, "Not Found");
	const efp = map[params.id].main;
	return { efpId: params.id, title: `EFP ${efp.id} - ${efp.title}`, tableOfContents: efp.tableOfContents };
}
