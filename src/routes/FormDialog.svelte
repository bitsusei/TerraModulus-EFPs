<script lang="ts">
	import type { Snippet } from 'svelte';

	type types = {
		options: string[],
		date: undefined,
		idInput: undefined,
	}

	// export interface FormItem {
	// 	create(key: string): ReturnType<Snippet<[]>>;
	// }
	// export class OptionsItem implements FormItem {
	// 	constructor(
	// 		public readonly options: string[]
	// 	) {}
	// 	create(key: string) {
	// 		return optionsItem(key, this.options);
	// 	} // return single `string`
	// }
	// export class DateItem implements FormItem {
	// 	create(key: string): ReturnType<Snippet<[]>> {
	// 		return dateItem(key);
	// 	} // return date as YYYY-MM-DD as string
	// }
	// export class IdInputItem implements FormItem {
	// 	create(key: string): ReturnType<Snippet<[]>> {
	// 		return idInputItem(key);
	// 	} // return +ve integer as string
	// }

	let { dialog = $bindable(), items, oncomplete }: {
		dialog: HTMLDialogElement,
		items: Record<string, { type: keyof types, param: types[keyof types] }>,
		oncomplete: (data: Record<string, any>) => void,
	} = $props();

	// let itemss: [string, DateItem][] = Object.entries(items).map(([k, { type, param }]) => {
	// 	switch (type) {
	// 		case "options": return [k, new OptionsItem(param as string[])];
	// 		case "date": return [k, new DateItem()];
	// 		case "idInput": return [k, new IdInputItem()];
	// 	}
	// });

	let data: Record<string, any> = $state({});
</script>

{#snippet optionsItem(key: string, options: string[])}
	<label>
		{key}:&nbsp;
		<select bind:value={ data[key] } required>
			{#each options as option}
				<option>{option}</option>
			{/each}
		</select>
	</label>
{/snippet}

{#snippet dateItem(key: string)}
	<label>
		{key}:&nbsp;
		<input type="date" bind:value={ data[key] } required />
	</label>
{/snippet}

{#snippet idInputItem(key: string)}
	<label>
		{key}:&nbsp;
		<input type="text" inputmode="numeric" pattern="[1-9][0-9]*" bind:value={ data[key] } required />
	</label>
{/snippet}

<dialog bind:this={dialog} closedby="any" onclose={e => {
	if (e.currentTarget.returnValue === "ok") oncomplete(data);
}}>
	<form method="dialog">
		{#each Object.entries(items) as item}
			{#if item[1].type === "options"}
			{@render optionsItem(item[0], item[1].param as string[])}
			{:else if item[1].type === "date"}
			{@render dateItem(item[0])}
			{:else}
			{@render idInputItem(item[0])}
			{/if}
		{/each}
		<div>
			<button type="submit" formmethod="dialog">Cancel</button>
			<button type="submit" formmethod="dialog" value="ok">Ok</button>
		</div>
	</form>
</dialog>
