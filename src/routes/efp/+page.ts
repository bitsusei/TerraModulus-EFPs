import type { PageLoadEvent } from './$types';

export async function load({ parent }: PageLoadEvent) {
	return await parent();
}
