<script lang="ts">
	import { fade } from 'svelte/transition';

	let { dialog = $bindable() as HTMLDialogElement, items, oncomplete }: {
		dialog?: HTMLDialogElement,
		items: Record<string, { type: "date" | "idInput" } | { type: "options", param: string[] }>,
		oncomplete: (data: Record<string, any>) => void,
	} = $props();

	let data: Record<string, any> = $state({});
</script>

{#snippet optionsItem(key: string, options: string[])}
	<label class="p-1 flex justify-center items-center [&>*]:flex-none">
		<div class="me-1 italic">{key}:</div>
		<select class="bg-theme-main-bg" bind:value={ data[key] } required>
			{#each options as option}
				<option>{option}</option>
			{/each}
		</select>
	</label>
{/snippet}

{#snippet dateItem(key: string)}
	<label class="p-1 flex justify-center items-center [&>*]:flex-none">
		<div class="me-1">{key}:</div>
		<input type="date" bind:value={ data[key] } required />
	</label>
{/snippet}

{#snippet idInputItem(key: string)}
	<label class="p-1 flex justify-center items-center [&>*]:flex-none">
		<div class="me-1">{key}:</div>
		<input type="text" class="w-30" inputmode="numeric" pattern="[1-9][0-9]*" bind:value={ data[key] } required />
	</label>
{/snippet}

<dialog transition:fade|global bind:this={dialog} class="dialog-fade rounded-md overflow-visible text-theme-main-text bg-theme-main-bg absolute inset-auto top-[calc(anchor(bottom)+8px)] [justify-self:anchor-center]"
	closedby="any" onclick={ e => e.stopPropagation() } onclose={e => {
		if (e.currentTarget.returnValue === "ok") {
			oncomplete(data);
		}
	}}>
	<div class="absolute bg-inherit size-2 rotate-45 inset-auto [justify-self:anchor-center] -top-1"></div>
	<form class="m-1 flex flex-col [&>*]:flex-none justify-center items-center" method="dialog">
		{#each Object.entries(items) as item}
			{#if item[1].type === "options"}
			{@render optionsItem(item[0], item[1].param as string[])}
			{:else if item[1].type === "date"}
			{@render dateItem(item[0])}
			{:else}
			{@render idInputItem(item[0])}
			{/if}
		{/each}
		<div class="flex w-full justify-center items-center">
			<button class="m-1 mx-auto p-1 flex-none leading-none rounded-md bg-theme-search-bar-border" onclick={ () => dialog.close() }>Cancel</button>
			<button class="m-1 mx-auto p-1 flex-none leading-none rounded-md bg-theme-search-bar-border" type="submit" value="ok">Ok</button>
		</div>
	</form>
</dialog>
