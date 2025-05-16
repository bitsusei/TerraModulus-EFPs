import { error } from '@sveltejs/kit';
import { readFileSync } from 'node:fs';

export async function GET({ params }) {
	if (params.asset.endsWith(".xml")) throw error(404, "Not Found");
	try {
		return new Response(readFileSync(`efp/${params.id}/${params.asset}`));
	} catch (err) {
		console.error(err);
		throw error(404, "Not Found");
	}
}
