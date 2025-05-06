<script lang="ts">
	import type { PageData } from './$types';
	import capitalize from "lodash/capitalize";

	export let data: PageData;
	export const formatEfpList = (list: string[]) => list.map(n => (
		`<a href="./efp${ n.padStart(3, "0") }" target="_blank" class="hyperlink">EFP ${n}</a>`
	)).join(", ");
	const formatDate = (date: Date) => {
		const formatter = new Intl.NumberFormat(undefined, { minimumIntegerDigits: 2 });
		return `${ date.getUTCFullYear() }-${ formatter.format(date.getUTCMonth() + 1) }-${ formatter.format(date.getUTCDate()) }`;
	}
</script>

<h2 class="text-center text-xl">EFP { parseInt(data.id.substring(3)) }</h2>
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
<div id="efp-body" class="mb-12">{@html data.efp.main.body }</div>
