import { error } from "@sveltejs/kit";
import fs from "fs";
import { BookEfpPathResolver, parseEfp } from "$lib/efp";

export async function load(): Promise<App.EfpList> {
	const list: App.EfpList = {
		indexMap: {},
		map: {},
		indices: [],
		searchEntries: [],
	};
	for (const d of fs.readdirSync("efp")) {
		let main: App.EfpData | undefined;
		const subpages: App.EfpEntry["subpages"] = {};
		const assets: App.EfpEntry["assets"] = [];
		for (const dd of fs.readdirSync(`efp/${d}`)) {
			if (dd.endsWith(".xml")) {
				const efp = await parseEfp(new BookEfpPathResolver(d), fs.readFileSync(`efp/${d}/${dd}`, 'utf-8'))
				if (dd === "main.xml") {
					main = efp;
				} else {
					subpages[dd.substring(0, dd.length - 4)] = efp;
				}
			} else {
				assets.push(dd);
			}
		}

		if (main === undefined) {
			error(500, `main.xml not found for \`${d}\``);
		}

		list.indexMap[main.id] = d;
		list.indices.push(main.id);
		list.searchEntries.push({
			id: main.id,
			title: main.title,
			content: main.body.replaceAll(/<[^>]+>/g, "")
				.replaceAll(/[^\S\n]+/g, " ")
				.replaceAll(/[^\S\n]*\n[^\S\n]*/g, "\n")
				.trim(),
			created: main.created,
			category: main.category,
			status: main.status,
			obsoletedBy: main.obsoletedBy,
			updatedBy: main.updatedBy,
			obsoletes: main.obsoletes,
			updates: main.updates,
			pullRequests: main.pullRequests,
		});
		list.map[d] = {
			main,
			subpages,
			assets,
		};
	}

	return list;
}
