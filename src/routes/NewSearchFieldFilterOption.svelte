<script lang="ts">
	import { DateCmp, FieldFilter, type Filter, filterFields, MatchFilter, RangeFilter, StringEq } from "$lib/search";
	import FormDialog from "./FormDialog.svelte";

	let { key, oncomplete }: { key: keyof typeof filterFields, oncomplete: (f: Filter) => void } = $props();

	let items: Record<string, {
		type: "date" | "options" | "idInput";
		param: string[] | undefined;
	}> = $state({});

	switch (key) {
		case "created":
			items["Operator"] = { type: "options", param: [ "==", "!=", ">", "<", ">=", "<=" ] };
			items["Value"] = { type: "date", param: undefined };
			break;
		case "category":
			items["Value"] = { type: "options", param: [ "Informational", "Process", "Standard" ] };
			break;
		case "status":
			items["Value"] = { type: "options", param: [ "Draft", "Deferred", "Provisional", "Final" ] };
			break;
		case "obsoletedBy":
			items["Value"] = { type: "idInput", param: undefined };
			break;
		case "updatedBy":
			items["Value"] = { type: "idInput", param: undefined };
			break;
		case "obsoletes":
			items["Value"] = { type: "idInput", param: undefined };
			break;
		case "updates":
			items["Value"] = { type: "idInput", param: undefined };
			break;
		case "pullRequests":
			items["Value"] = { type: "idInput", param: undefined };
			break;
	}

	let dialog: HTMLDialogElement = $state<any>();
</script>

<div>
	<button class="flex items-center justify-start" onclick={ () => dialog.show() }>
		<div class="flex items-center justify-center italic text-md h-8 w-8">
			Field
		</div>
		<div class="p-2">
			{ filterFields[key].name }
		</div>
	</button>
	<FormDialog bind:dialog {items} oncomplete={data => {
		switch (key) {
			case "created":
				let op: "eq" | "ne" | "gt" | "lt" | "ge" | "le";
				switch (data["Operator"] as "==" | "!=" | ">" | "<" | ">=" | "<=") {
					case "==": op = "eq"; break;
					case "!=": op = "ne"; break;
					case ">": op = "gt"; break;
					case "<": op = "lt"; break;
					case ">=": op = "ge"; break;
					case "<=": op = "le"; break;
				}
				oncomplete(new RangeFilter(filterFields.created.field, op, new Date(data["Value"]), new DateCmp()));
				return;
			case "category":
				let v: "informational" | "process" | "standard";
				switch (data["Value"] as "Informational" | "Process" | "Standard") {
					case "Informational": v = "informational"; break;
					case "Process": v = "process"; break;
					case "Standard": v = "standard"; break;
				}
				oncomplete(new MatchFilter(filterFields.category.field, v, new StringEq()));
				break;
			case "status":
				let vv: "draft" | "deferred" | "provisional" | "final";
				switch (data["Value"] as "Draft" | "Deferred" | "Provisional" | "Final") {
					case "Draft": vv = "draft"; break;
					case "Deferred": vv = "deferred"; break;
					case "Provisional": vv = "provisional"; break;
					case "Final": vv = "final"; break;
				}
				oncomplete(new MatchFilter(filterFields.status.field, vv, new StringEq()));
				break;
			case "obsoletedBy":
				oncomplete(new MatchFilter(filterFields.obsoletedBy.field, data["Value"], new StringEq()));
				break;
			case "updatedBy":
				oncomplete(new MatchFilter(filterFields.updatedBy.field, data["Value"], new StringEq()));
				break;
			case "obsoletes":
				oncomplete(new MatchFilter(filterFields.obsoletes.field, data["Value"], new StringEq()));
				break;
			case "updates":
				oncomplete(new MatchFilter(filterFields.updates.field, data["Value"], new StringEq()));
				break;
			case "pullRequests":
				oncomplete(new MatchFilter(filterFields.pullRequests.field, data["Value"], new StringEq()));
				break;
		}
	}} />
</div>
