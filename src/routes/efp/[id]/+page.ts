import type { PageLoadEvent } from './$types';

export async function load({ parent, params }: PageLoadEvent) {
	return { efpId: params.id, tableOfContents: (await parent()).map[params.id].main.tableOfContents };
}
