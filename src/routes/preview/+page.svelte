<script lang="ts">
	import capitalize from "lodash/capitalize";

	const formatEfpList = (list: string[]) => list.map(n => (
		`<a href="/efp/efp${n.padStart(3, "0")}" class="hyperlink">EFP ${n}</a>`
	)).join(", ");
	const formatDate = (date: Date) => {
		const formatter = new Intl.NumberFormat(undefined, { minimumIntegerDigits: 2 });
		return `${ date.getUTCFullYear() }-${ formatter.format(date.getUTCMonth() + 1) }-${ formatter.format(date.getUTCDate()) }`;
	};

	let { data } = $props();
	const efp = $derived(data.efp);
</script>

<div class="h-full w-full [anchor-name:--content-container]">
	<div class="max-w-3xl mx-auto flex flex-col [&>*]:flex-none">
		<h2 class="text-center text-xl">EFP { efp.id }</h2>
		<h1 class="text-center text-3xl mb-3">{ efp.title }</h1>
		<ol class="list-disc my-5">
			<li>Creation Date: { formatDate(efp.created) }</li>
			<li>Category: { capitalize(efp.category) }</li>
			<li>Status: { capitalize(efp.status) }</li>
			{#if efp.obsoletedBy.length != 0}
			<li>Obsoleted By: {@html formatEfpList(efp.obsoletedBy) }</li>
			{/if}
			{#if efp.updatedBy.length != 0}
			<li>Obsoleted By: {@html formatEfpList(efp.updatedBy) }</li>
			{/if}
			{#if efp.obsoletes.length != 0}
			<li>Obsoleted By: {@html formatEfpList(efp.obsoletes) }</li>
			{/if}
			{#if efp.updates.length != 0}
			<li>Obsoleted By: {@html formatEfpList(efp.updates) }</li>
			{/if}
			<li>Pull Requests: {@html efp.pullRequests.map(n => (
				`<a href="https://github.com/AnvilloyDevStudio/TerraModulus-EFPs/pull/${n}" class="hyperlink">#${n}</a>`
			)).join(", ")}</li>
		</ol>
		<div id="efp-body" class="mb-4">{@html efp.body }</div>
	</div>
</div>
