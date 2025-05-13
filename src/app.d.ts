// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			message: string;
		}
		interface Locals {}
		interface PageData {}
		interface PageState {}
		interface Platform {}
		interface EfpData {
			id: number;
			tableOfContents: TableOfContents;
			created: Date;
			category: import("$lib").App.EfpEntry.CategoryKey;
			status: import("$lib").App.EfpEntry.StatusKey;
			title: string;
			obsoletedBy: string[];
			updatedBy: string[];
			obsoletes: string[];
			updates: string[];
			pullRequests: [string, ...string[]];
			body: string;
			// TODO references
		}
		interface EfpEntry {
			/** Main XML body */
			main: EfpData;
			/** Other XML pages */
			subpages: Record<string, EfpData>;
			/** Other non-XML files */
			assets: Record<string, any>;
		}
		interface EfpList {
			map: Record<string, EfpEntry>;
			indexMap: Record<number, string>;
			indices: number[];
			searchEntries: {
				id: number,
				title: string,
				content: string,
				created: Date,
				category: EfpData["category"],
				status: EfpData["status"],
				obsoletedBy: string[],
				updatedBy: string[],
				obsoletes: string[],
				updates: string[],
				pullRequests: [string, ...string[]],
			}[];
		}
		interface TableOfContents {
			tree: [{
				header: string,
				id: string,
				tree?: TableOfContents["tree"],
			}, ...{
				header: string,
				id: string,
				tree?: TableOfContents["tree"],
			}[]];
		}
	}
}

export {};
