<script lang="ts">
	import type { PageData } from './$types';
	import capitalize from "lodash/capitalize";

	export let data: PageData;
	export const formatEfpList = (list: string[]) => list.map(n => (
		`<a href="./efp${ n.padStart(3, "0") }" target="_blank">EFP ${n}</a>`
	)).join(", ");
</script>

<h2>EFP { parseInt(data.id.substring(3)) }</h2>
<h1>{ data.efp.main.title }</h1>
<ol>
	<li>Creation Date: { data.efp.main.created.toDateString() }</li>
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
		`<a href="https://github.com/AnvilloyDevStudio/TerraModulus-EFPs/pull/${n}">#${n}</a>`
	)).join(", ")}</li>
</ol>
<div>{@html data.efp.main.body }</div>
