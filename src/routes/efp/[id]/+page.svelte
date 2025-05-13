<script lang="ts">
	import RightArrowIcon from '$lib/assets/icons/right-arrow.svelte';
	import capitalize from "lodash/capitalize";

	const formatEfpList = (list: string[]) => list.map(n => (
		`<a href="./efp${ n.padStart(3, "0") }" target="_blank" class="hyperlink">EFP ${n}</a>`
	)).join(", ");
	const formatDate = (date: Date) => {
		const formatter = new Intl.NumberFormat(undefined, { minimumIntegerDigits: 2 });
		return `${ date.getUTCFullYear() }-${ formatter.format(date.getUTCMonth() + 1) }-${ formatter.format(date.getUTCDate()) }`;
	};

	let { data } = $props();
	const efp = $derived(data.map[data.efpId]);
	let containerWidth = $state(0);
	// assume findIndex() != -1
	let previousChapter = $derived(data.indices.findIndex(i => i === efp.main.id) - 1); // -1 if unavailable
	let nextChapter = $derived(data.indices.findIndex(i => i === efp.main.id) + 1); // data.indices.length if unavailable
</script>

<div class="h-full w-full [anchor-name:--content-container]" bind:clientWidth={containerWidth}>
	<div class="max-w-3xl mx-auto flex flex-col [&>*]:flex-none">
		<h2 class="text-center text-xl">EFP { efp.main.id }</h2>
		<h1 class="text-center text-3xl mb-3">{ efp.main.title }</h1>
		<ol class="list-disc my-5">
			<li>Creation Date: { formatDate(efp.main.created) }</li>
			<li>Category: { capitalize(efp.main.category) }</li>
			<li>Status: { capitalize(efp.main.status) }</li>
			{#if efp.main.obsoletedBy.length != 0}
			<li>Obsoleted By: {@html formatEfpList(efp.main.obsoletedBy) }</li>
			{/if}
			{#if efp.main.updatedBy.length != 0}
			<li>Obsoleted By: {@html formatEfpList(efp.main.updatedBy) }</li>
			{/if}
			{#if efp.main.obsoletes.length != 0}
			<li>Obsoleted By: {@html formatEfpList(efp.main.obsoletes) }</li>
			{/if}
			{#if efp.main.updates.length != 0}
			<li>Obsoleted By: {@html formatEfpList(efp.main.updates) }</li>
			{/if}
			<li>Pull Requests: {@html efp.main.pullRequests.map(n => (
				`<a href="https://github.com/AnvilloyDevStudio/TerraModulus-EFPs/pull/${n}" class="hyperlink">#${n}</a>`
			)).join(", ")}</li>
		</ol>
		<div id="efp-body" class="mb-4">{@html efp.main.body }</div>
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
	<a href="./{ data.indexMap[data.indices[previousChapter]] }" class="grid place-items-center [position-anchor:--content-container] cursor-pointer w-32 inset-auto left-[anchor(left)] absolute top-0 bottom-0 duration-300 h-full hover:bg-theme-nav-button-hover transition-colors" aria-label="previous-chapter" title="Previous chapter">
		<RightArrowIcon class="size-10 fill-current scale-x-[-1]" />
	</a>
	{:else}
	<button class="grid place-items-center [position-anchor:--content-container] w-32 inset-auto left-[anchor(left)] absolute top-0 bottom-0 h-full text-theme-nav-button-disabled" aria-label="previous-chapter" title="Previous chapter">
		<RightArrowIcon class="size-10 fill-current scale-x-[-1]" />
	</button>
	{/if}
	{#if nextChapter !== data.indices.length}
	<a href="./{ data.indexMap[data.indices[nextChapter]] }" class="grid place-items-center [position-anchor:--content-container] cursor-pointer w-32 inset-auto right-[anchor(right)] absolute top-0 bottom-0 duration-300 h-full hover:bg-theme-nav-button-hover transition-colors" aria-label="next-chapter" title="Next chapter">
		<RightArrowIcon class="size-10 fill-current" />
	</a>
	{:else}
	<button class="grid place-items-center [position-anchor:--content-container] w-32 inset-auto right-[anchor(right)] absolute top-0 bottom-0 h-full text-theme-nav-button-disabled" aria-label="next-chapter" title="Next chapter">
		<RightArrowIcon class="size-10 fill-current" />
	</button>
	{/if}
	{/if}
</div>
