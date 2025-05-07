import type { PageLoadEvent } from './$types';

export async function load({ parent, params }: PageLoadEvent) {
	return { efp: (await parent()).map[params.id] };
}
