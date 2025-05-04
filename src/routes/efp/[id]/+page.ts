import type { PageLoadEvent } from './$types';

export async function load({ parent, params }: PageLoadEvent) {
	return { efp: (await parent())[params.id], id: params.id };
}
