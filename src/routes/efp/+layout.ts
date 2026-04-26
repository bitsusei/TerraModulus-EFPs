import { error, redirect } from "@sveltejs/kit";
import type { LayoutLoad } from "../$types";

export const load: LayoutLoad = ({ route, url }) => {
	if (route.id === null && url.searchParams.get("fallback") !== null) {
		if (url.searchParams.get("fallback") === "preview") {
			const source = url.searchParams.get("source");
			const raw = url.searchParams.get("raw");
			if (source === null || raw === null) throw error(400, "Bad Request");
			const target = new URL("/preview", url);
			target.searchParams.set("source", source);
			target.searchParams.set("raw", raw);
			redirect(303, target);
		} else throw error(400, "Bad Request");
	}
}
