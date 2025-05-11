<script lang="ts">
	let { dialog = $bindable(), items, oncomplete }: {
		dialog?: HTMLDialogElement,
		items: Record<string, { type: "date" | "idInput" } | { type: "options", param: string[] }>,
		oncomplete: (data: Record<string, any>) => void,
	} = $props();

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

<dialog bind:this={dialog} class="dialog-fade" closedby="any" onclose={e => {
	if (e.currentTarget.returnValue === "ok") oncomplete(data);
}} onclick={ e => e.stopPropagation() }>
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
			<button type="submit" formmethod="dialog" value="cancel">Cancel</button>
			<button type="submit" formmethod="dialog" value="ok">Ok</button>
		</div>
	</form>
</dialog>
