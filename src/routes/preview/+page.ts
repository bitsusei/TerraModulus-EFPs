import { error } from '@sveltejs/kit';
import type { PageLoadEvent } from './$types';
import { concatAndResolveUrl, parseEfp, PreviewEfpPathResolver, type PreviewEfpAssetFetcher } from "$lib/efp";

export const ssr = false;

export async function load({ fetch, url }: PageLoadEvent) {
	if (url.searchParams.get("source") === "github") {
		const raw = url.searchParams.get("raw");
		if (raw === null) throw error(400, "Bad Request");
		const res = await fetch("https://github.com/" + raw)
		if (!res.ok) throw error(400, "Bad Request");
		const efp = await parseEfp(new PreviewEfpPathResolver({
			fetchAsset: async p => {
				const asset = await fetch("https://github.com/" + concatAndResolveUrl(concatAndResolveUrl(raw, "../"), p), { mode: "cors" });
				if (!asset.ok) throw error(400, "Bad Request");
				return `data:${asset.headers.get("Content-Type")};base64,${btoa(String.fromCharCode(...await asset.bytes()))}`;
			}
		} as PreviewEfpAssetFetcher), await res.text());
		return { efp, title: `EFP ${efp.id} - ${efp.title}`, tableOfContents: efp.tableOfContents };
	} else {
		throw error(400, "Bad Request");
	}
}
