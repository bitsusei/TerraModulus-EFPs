<script lang="ts">
	import { App } from "$lib";
	import { DateCmp, type Filter, filterFields, MatchFilter, RangeFilter, StringEq } from "./search.svelte";
	import FormDialog from "./FormDialog.svelte";

	let { key, oncomplete }: { key: keyof typeof filterFields, oncomplete: (f: Filter) => void } = $props();

	let items: Record<string, {
		type: "date" | "idInput";
	} | {
		type: "options";
		param: string[];
	}> = $state({});

	switch (key) {
		case "created":
			items["Operator"] = { type: "options", param: Object.keys(RangeFilter.opMap) };
			items["Value"] = { type: "date" };
			break;
		case "category":
			items["Value"] = { type: "options", param: [...App.EfpEntry.category.values()] };
			break;
		case "status":
			items["Value"] = { type: "options", param: [...App.EfpEntry.status.values()] };
			break;
		case "obsoletedBy":
			items["Value"] = { type: "idInput" };
			break;
		case "updatedBy":
			items["Value"] = { type: "idInput" };
			break;
		case "obsoletes":
			items["Value"] = { type: "idInput" };
			break;
		case "updates":
			items["Value"] = { type: "idInput" };
			break;
		case "pullRequests":
			items["Value"] = { type: "idInput" };
			break;
	}

	let dialog: HTMLDialogElement = $state<any>();
</script>

<div class="w-full">
	<button class="w-full flex items-center justify-start cursor-pointer transition-colors hover:text-theme-header-hover-text" onclick={ () => dialog.showPopover() }>
		<div class="flex items-center justify-center italic text-base me-1 h-8 w-12 my-0.5 rounded-lg bg-theme-search-filter-primary-bg">
			Field
		</div>
		<div class="px-2 grow rounded-lg bg-theme-search-filter-secondary-bg">
			{ filterFields[key].name }
		</div>
	</button>
	<FormDialog floatingParams={{ selectAnchor: e => e.parentElement!.querySelector(":scope > button")!, offset: 6, shift: 6 }} bind:dialog {items} oncomplete={data => {
		switch (key) {
			case "created":
				oncomplete(new RangeFilter(filterFields.created.field, RangeFilter.opMap[data["Operator"] as keyof typeof RangeFilter.opMap], new Date(data["Value"]), new DateCmp()));
				return;
			case "category":
				oncomplete(new MatchFilter(filterFields.category.field, App.EfpEntry.category.getKey(data["Value"]), new StringEq()));
				return;
			case "status":
				oncomplete(new MatchFilter(filterFields.status.field, App.EfpEntry.status.getKey(data["Value"]), new StringEq()));
				return;
			case "obsoletedBy":
				oncomplete(new MatchFilter(filterFields.obsoletedBy.field, data["Value"], new StringEq()));
				return;
			case "updatedBy":
				oncomplete(new MatchFilter(filterFields.updatedBy.field, data["Value"], new StringEq()));
				return;
			case "obsoletes":
				oncomplete(new MatchFilter(filterFields.obsoletes.field, data["Value"], new StringEq()));
				return;
			case "updates":
				oncomplete(new MatchFilter(filterFields.updates.field, data["Value"], new StringEq()));
				return;
			case "pullRequests":
				oncomplete(new MatchFilter(filterFields.pullRequests.field, data["Value"], new StringEq()));
				return;
		}
	}} />
</div>
