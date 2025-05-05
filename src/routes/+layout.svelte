<script lang="ts">
	import '../app.css';

	let { children } = $props();
	let sidebarOpen = $state(true);
</script>

<div class="flex h-lvh overflow-hidden bg-amber-50">
	<aside class="flex-shrink-0 w-72 flex flex-col border-r transition-all duration-300 overflow-y-auto" class:-ml-72={ !sidebarOpen }>
		<nav class="flex-1 flex flex-col mt-3">
			ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>ABC<br/>
		</nav>
	</aside>
	<div class="flex-1 overflow-y-auto justify-center content-center bg-inherit">
		<header class="p-4 text-semibold bg-inherit sticky z-50 top-0 overflow-clip">
			<div class="mx-auto flex">
				<button aria-label="sidebar-toggle" class="size-fit" onclick={ () => sidebarOpen = !sidebarOpen }>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-6 w-6">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>
				<div class="mx-auto text-xl">
					The TerraModulus EFP Book
				</div>
				<button aria-label="git-repo" class="size-fit">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-6 w-6">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>
			</div>
		</header>
		<main class="p-4 max-w-200 mx-auto">
			{@render children()}
		</main>
	</div>
</div>
