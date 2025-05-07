<script lang="ts">
	import RightArrowIcon from '$lib/assets/icons/right-arrow.svelte';
	import capitalize from "lodash/capitalize";

	let { data } = $props();
	const formatEfpList = (list: string[]) => list.map(n => (
		`<a href="./efp${ n.padStart(3, "0") }" target="_blank" class="hyperlink">EFP ${n}</a>`
	)).join(", ");
	const formatDate = (date: Date) => {
		const formatter = new Intl.NumberFormat(undefined, { minimumIntegerDigits: 2 });
		return `${ date.getUTCFullYear() }-${ formatter.format(date.getUTCMonth() + 1) }-${ formatter.format(date.getUTCDate()) }`;
	}
	let containerWidth = $state(0);
	// assume findIndex() != -1
	let previousChapter = $derived(data.indices.findIndex(i => i === data.efp.main.id) - 1); // -1 if unavailable
	let nextChapter = $derived(data.indices.findIndex(i => i === data.efp.main.id) + 1); // data.indices.length if unavailable
</script>

<div class="h-full w-full" bind:clientWidth={containerWidth}>
	<div class="max-w-3xl mx-auto flex flex-col [&>*]:flex-none">
		<h2 class="text-center text-xl">EFP { data.efp.main.id }</h2>
		<h1 class="text-center text-3xl mb-3">{ data.efp.main.title }</h1>
		<ol class="list-disc my-5">
			<li>Creation Date: { formatDate(data.efp.main.created) }</li>
			<li>Category: { capitalize(data.efp.main.category) }</li>
			<li>Status: { capitalize(data.efp.main.status) }</li>
			{#if data.efp.main.obsoletedBy.length != 0}
			<li>Obsoleted By: {@html formatEfpList(data.efp.main.obsoletedBy) }</li>
			{/if}
			{#if data.efp.main.updatedBy.length != 0}
			<li>Obsoleted By: {@html formatEfpList(data.efp.main.updatedBy) }</li>
			{/if}
			{#if data.efp.main.obsoletes.length != 0}
			<li>Obsoleted By: {@html formatEfpList(data.efp.main.obsoletes) }</li>
			{/if}
			{#if data.efp.main.updates.length != 0}
			<li>Obsoleted By: {@html formatEfpList(data.efp.main.updates) }</li>
			{/if}
			<li>Pull Requests: {@html data.efp.main.pullRequests.map(n => (
				`<a href="https://github.com/AnvilloyDevStudio/TerraModulus-EFPs/pull/${n}" class="hyperlink">#${n}</a>`
			)).join(", ")}</li>
		</ol>
		<div id="efp-body" class="mb-4">{@html data.efp.main.body }</div>
		{#if containerWidth < 1024}
		<div class="flex mt-4">
			{#if previousChapter !== -1}
			<a href="./{ data.indexMap[data.indices[previousChapter]] }" class="grid place-items-center cursor-pointer w-32 h-20 rounded-lg duration-300 hover:bg-theme-nav-button-hover transition-colors" aria-label="previous-chapter" title="Previous chapter">
				<RightArrowIcon class="size-10 fill-current scale-x-[-1]" />
			</a>
			{:else}
			<button class="grid place-items-center w-32 h-20 rounded-lg text-theme-nav-button-disabled" aria-label="previous-chapter" title="Previous chapter">
				<RightArrowIcon class="size-10 fill-current scale-x-[-1]" />
			</button>
			{/if}
			<div class="grow"></div>
			{#if nextChapter !== data.indices.length}
			<a href="./{ data.indexMap[data.indices[nextChapter]] }" class="grid place-items-center cursor-pointer w-32 h-20 rounded-lg duration-300 hover:bg-theme-nav-button-hover transition-colors" aria-label="next-chapter" title="Next chapter">
				<RightArrowIcon class="size-10 fill-current" />
			</a>
			{:else}
			<button class="grid place-items-center w-32 h-20 rounded-lg text-theme-nav-button-disabled" aria-label="next-chapter" title="Next chapter">
				<RightArrowIcon class="size-10 fill-current" />
			</button>
			{/if}
		</div>
		{/if}
	</div>
	{#if containerWidth >= 1024}
	{#if previousChapter !== -1}
	<a href="./{ data.indexMap[data.indices[previousChapter]] }" class="grid place-items-center cursor-pointer w-32 float-left fixed top-0 bottom-0 duration-300 left-auto mr-auto h-full hover:bg-theme-nav-button-hover transition-colors" aria-label="previous-chapter" title="Previous chapter">
		<RightArrowIcon class="size-10 fill-current scale-x-[-1]" />
	</a>
	{:else}
	<button class="grid place-items-center w-32 float-left fixed top-0 bottom-0 left-auto mr-auto h-full text-theme-nav-button-disabled" aria-label="previous-chapter" title="Previous chapter">
		<RightArrowIcon class="size-10 fill-current scale-x-[-1]" />
	</button>
	{/if}
	{#if nextChapter !== data.indices.length}
	<a href="./{ data.indexMap[data.indices[nextChapter]] }" class="grid place-items-center cursor-pointer w-32 float-right fixed top-0 bottom-0 duration-300 right-10 ml-auto h-full hover:bg-theme-nav-button-hover transition-colors" aria-label="next-chapter" title="Next chapter">
		<RightArrowIcon class="size-10 fill-current" />
	</a>
	{:else}
	<button class="grid place-items-center w-32 float-right fixed top-0 bottom-0 right-8 ml-auto h-full text-theme-nav-button-disabled" aria-label="next-chapter" title="Next chapter">
		<RightArrowIcon class="size-10 fill-current" />
	</button>
	{/if}
	{/if}
</div>
