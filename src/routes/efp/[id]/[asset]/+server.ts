import { error } from '@sveltejs/kit';
import { readdirSync, readFileSync } from 'node:fs';

export const prerender = true;
export const entries = () => {
	const entries = [];
	for (const d of readdirSync("efp")) {
		for (const dd of readdirSync(`efp/${d}`)) {
			if (!dd.endsWith(".xml")) {
				entries.push({ id: d, asset: dd });
			}
		}
	}

	return entries;
}

export async function GET({ params }) {
	if (params.asset.endsWith(".xml")) throw error(404, "Not Found");
	try {
		return new Response(readFileSync(`efp/${params.id}/${params.asset}`).buffer as ArrayBuffer);
	} catch (err) {
		console.error(err);
		throw error(404, "Not Found");
	}
}
