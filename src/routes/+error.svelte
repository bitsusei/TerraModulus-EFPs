<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>Error {page.status} - The TerraModulus EFP Book</title>
</svelte:head>

<div class="p-4 flex flex-col justify-center items-center">
	<h1 class="text-[60px] p-6 font-extrabold">Error {page.status}</h1>
	<h2 class="text-[40px] p-6 bold">{page.error?.message}</h2>
</div>
