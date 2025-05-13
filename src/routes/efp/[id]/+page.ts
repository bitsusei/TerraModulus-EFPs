import type { PageLoadEvent } from './$types';

export async function load({ parent, params }: PageLoadEvent) {
	const efp = (await parent()).map[params.id].main;
	return { efpId: params.id, title: `EFP ${efp.id} - ${efp.title}`, tableOfContents: efp.tableOfContents };
}
