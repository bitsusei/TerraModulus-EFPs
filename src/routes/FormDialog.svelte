<script lang="ts">
	import { FloatingHelper, type FloatingHelperParams } from '$lib/floating';
	import { fade } from 'svelte/transition';

	let { dialog = $bindable() as HTMLDialogElement, items, oncomplete, floatingParams }: {
		dialog?: HTMLDialogElement,
		floatingParams?: Omit<FloatingHelperParams<HTMLDialogElement>, "arrow">,
		items: Record<string, { type: "date" | "idInput" } | { type: "options", param: string[] }>,
		oncomplete: (data: Record<string, any>) => void,
	} = $props();

	let data: Record<string, any> = $state({});
	let arrow: HTMLElement = $state<any>();
	let completed = $state(false);
	const floatingParamsSet = floatingParams && ({
		...floatingParams,
		arrow: { selectElement: () => arrow },
		flip: true,
	} satisfies FloatingHelperParams<HTMLDialogElement>)
	let floatingHelper = $derived.by(() => floatingParamsSet && new FloatingHelper(dialog, floatingParamsSet));
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

<dialog transition:fade|global bind:this={dialog} class="popover-fade overflow-visible text-theme-main-text bg-theme-main-bg absolute inset-auto"
	closedby="any" onclick={ e => e.stopPropagation() } popover onbeforetoggle={e => {
	switch (e.newState) {
		case "open":
			completed = false;
			floatingHelper?.start();
			break;
		case "closed":
			if (completed) oncomplete(data);
			floatingHelper?.close();
			break;
	}
}}>
	<div bind:this={arrow} class="absolute bg-inherit size-2 rotate-45"></div>
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
			<button class="m-1 mx-auto p-1 flex-none leading-none rounded-md bg-theme-search-bar-border" onclick={ e => dialog.hidePopover() }>Cancel</button>
			<button class="m-1 mx-auto p-1 flex-none leading-none rounded-md bg-theme-search-bar-border" onclick={e => {
				if ((<HTMLFormElement> dialog.querySelector(":scope > form")).reportValidity()) {
					completed = true;
					dialog.hidePopover();
				}
			}}>Ok</button>
		</div>
	</form>
</dialog>
