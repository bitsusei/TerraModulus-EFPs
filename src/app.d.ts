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
			id: string;
			created: Date;
			category: "informational" | "process" | "standard";
			status: "draft" | "deferred" | "provisional" | "final";
			title: string;
			obsoletedBy: string[];
			updatedBy: string[];
			obsoletes: string[];
			updates: string[];
			pullRequests: [string, ...string[]];
			body: string;
			// TODO references
		}
		interface EfpList {
			[key: string]: {
				/** Main XML body */
				main: EfpData;
				/** Other XML pages */
				subpages: Record<string, EfpData>;
				/** Other non-XML files */
				assets: Record<string, any>;
			};
		}
	}
}

export {};
