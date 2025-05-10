<script lang="ts">
	import '../app.css';
	import MenuIcon from "$lib/assets/icons/menu.svelte";
	import GithubIcon from "$lib/assets/icons/github.svelte";
	import ThemeIcon from "$lib/assets/icons/theme.svelte";
	import SearchIcon from "$lib/assets/icons/search.svelte";
	import CrossIcon from "$lib/assets/icons/cross.svelte";
	import UpArrowIcon from "$lib/assets/icons/up-arrow.svelte";
	import { onMount } from 'svelte'
	import { page } from '$app/state';
	import MiniSearch from "minisearch";
	import FormDialog from './FormDialog.svelte';
	import { BooleanFilter, FilterField, NegFilter, type Filter, type SearchEntry } from '$lib/search';
	import NewSearchFieldFilterOption from './NewSearchFieldFilterOption.svelte';

	let { children, data } = $props();
	let sidebarOpen = $state(true);
	let themeDropdownOpen = $state(false);
	const themes = {
		"auto": "Auto",
		"light": "Light",
		"dark": "Dark",
	}
	let selectedTheme = $state<unknown>(undefined);
	let currentTheme = $state<unknown>(undefined);
	let systemTheme = $state<unknown>(undefined);
	onMount(() => {
		if (window.innerWidth < 1024) sidebarOpen = false;
		selectedTheme = (localStorage.getItem("theme") || "auto") as keyof typeof themes;
		const mediaQuery = matchMedia("(prefers-color-scheme: dark)");
		systemTheme = mediaQuery.matches ? "dark" : "light";
		if (selectedTheme === "auto") currentTheme = systemTheme;
		mediaQuery.addEventListener("change", () => {
			systemTheme = mediaQuery.matches ? "dark" : "light";
			if (selectedTheme === "auto") currentTheme = systemTheme;
		});
	});
	const selectTheme = (theme: keyof typeof themes) => {
		selectedTheme = theme;
		if (theme === "auto") {
			localStorage.removeItem("theme");
			currentTheme = systemTheme;
		} else {
			localStorage.setItem("theme", theme);
			currentTheme = theme;
		}
	};

	const miniSearch = new MiniSearch<SearchEntry>({
		idField: "id",
		fields: ["title", "content"],
		searchOptions: { fuzzy: .2 },
		autoSuggestOptions: { fuzzy: .2 },
	});

	miniSearch.addAll(data.searchEntries);
	const filterFields = {
		created: new FilterField<Date>("created"),
		category: new FilterField<App.EfpData["category"]>("category"),
		status: new FilterField<App.EfpData["status"]>("status"),
		obsoletedBy: new FilterField<string>("obsoletedBy"),
		updatedBy: new FilterField<string>("updatedBy"),
		obsoletes: new FilterField<string>("obsoletes"),
		updates: new FilterField<string>("updates"),
		pullRequests: new FilterField<string>("pullRequests"),
	};
	let searchFilter = $state<Filter>();
	let searchDialog = $state<HTMLDialogElement>();
</script>

<div class="flex h-lvh overflow-hidden divide-solid divide-x-8 divide-theme-main-bg text-theme-main-text bg-theme-main-bg scrollbar-thumb-theme-scrollbar-thumb scrollbar-track-theme-scrollbar-track" data-theme={ currentTheme }>
	<aside class="flex-shrink-0 w-72 flex flex-col bg-theme-sidebar-bg text-theme-sidebar-text transition-all duration-300 overflow-y-auto scrollbar" class:-ml-72={ !sidebarOpen }>
		<nav class="relative grow gap-0 flex flex-col mt-4 divide-solid divide-theme-sidebar-divide transition-all">
			<div class="flex flex-col pb-2 divide-solid divide-theme-sidebar-divide divide-y">
				{#snippet mainPage(path: string, title: string)}
					<a class={{"p-2 hover:bg-theme-sidebar-hover transition-colors": true, "text-theme-sidebar-active font-bold": page.url.pathname === path}} href={path}>
						{title}
					</a>
				{/snippet}
				{@render mainPage("/", "Introduction")}
			</div>
			<div class="w-full h-1 mt-1 bg-theme-sidebar-divide transition-all [&:has(+*+*+:hover)]:scale-y-200 [&:has(+*>button:hover)]:scale-y-200"></div>
			<div class="peer group">
				<button class="absolute -translate-y-1/2 [&:hover>div>div]:me-0 p-1.25 left-3/4 z-2 transform -translate-x-1/2 rounded-lg flex justify-center items-center scale-0 size-fit
							   transition-all ease-in-out group-[:has(+*+:hover)]:translate-x-2 group-[:has(+*+:hover)]:scale-100 hover:scale-100 hover:translate-x-2 bg-theme-search-button-bg text-theme-header-text hover:text-theme-header-hover-text"
						onclick={ () => searchDialog!.showModal() }>
					<div class="flex justify-center items-center size-fit overflow-hidden">
						<SearchIcon class="size-5 fill-current transition-colors" />
						<div class="text-md ms-1 w-8 h-5 -me-9 leading-none flex items-center justify-center font-bold text-center overflow-hidden transform transition-all">
							EFP
						</div>
					</div>
				</button>
				<dialog bind:this={ searchDialog } class="dialog-fade max-h-full max-w-full size-full bg-transparent backdrop:backdrop-blur-sm backdrop:bg-black/30" closedby="closerequest">
					<div class="size-full flex items-center justify-center">
						<div class="h-[min(80lvh,100lvw)] w-[min(100lvh,80lvw)] flex flex-col items-center rounded-4xl bg-theme-main-bg text-theme-main-text">
							<div class="w-full flex items-center">
								<div class="size-15"></div>
								<h1 class="grow-2 text-center text-2xl font-bold">
									Search EFP
								</h1>
								<button class="flex-none cursor-pointer p-5 size-fit text-theme-header-text hover:text-theme-header-hover-text rounded-4xl overflow-hidden" onclick={ () => searchDialog!.close() } aria-label="close" title="Close">
									<CrossIcon class="fill-current size-5 transition-colors" />
								</button>
							</div>
							<div class="h-fit w-[95%] flex flex-col bg-theme-search-bar-border rounded-[20px] overflow-hidden">
								<div class="h-10 w-full flex items-center bg-theme-search-bar-bg rounded-[40px] overflow-hidden divide-x-2 divide-theme-search-bar-border border-2 border-theme-search-bar-border">
									<div class="h-full w-20">
										<button popovertarget="filters-menu" popovertargetaction="toggle" class="flex group/close transform size-full items-center justify-center cursor-pointer text-theme-header-text hover:text-theme-header-hover-text transition-colors">
											Filters
											<UpArrowIcon class="fill-current size-2.5 ml-1 transition-all group-hover/close:translate-y-0.5 transform -scale-y-100 group-[&:has(+div:popover-open)]/close:scale-y-100" />
										</button>
										<div id="filters-menu" class="popover-fade absolute inset-auto top-[anchor(bottom)] rounded-b-lg left-[calc(anchor(left)-2px)] shadow-sm border-2 border-theme-search-bar-border bg-theme-search-bar-border" popover="auto">
											<div class="flex flex-col">
												{#snippet opButton(key: string, name: string)}
													<button popovertarget={key} popovertargetaction="toggle" class="size-full rounded-lg bg-theme-search-bar-bg flex items-center justify-center cursor-pointer text-theme-header-text hover:text-theme-header-hover-text">
														{name}
													</button>
												{/snippet}
												{#snippet wrapFilterOption(name: string, callback: () => void)}
													<button class="flex items-center justify-start" onclick={callback}>
														<div class="flex items-center justify-center italic text-md h-8 w-8">
															Wrap
														</div>
														<div class="p-2">
															{name}
														</div>
													</button>
												{/snippet}
												{#snippet newFilter(key: string, callback: (f: Filter) => void)}
													<div id={key} class="popover-fade overflow-y-auto scrollbar absolute inset-auto top-[anchor(top)] p-2 rounded-b-md left-[anchor(right)] shadow-sm" popover="auto">
														<div class="flex flex-col">
															<NewSearchFieldFilterOption key="created" oncomplete={callback} />
															<NewSearchFieldFilterOption key="category" oncomplete={callback} />
															<NewSearchFieldFilterOption key="status" oncomplete={callback} />
															<NewSearchFieldFilterOption key="obsoletedBy" oncomplete={callback} />
															<NewSearchFieldFilterOption key="updatedBy" oncomplete={callback} />
															<NewSearchFieldFilterOption key="obsoletes" oncomplete={callback} />
															<NewSearchFieldFilterOption key="updates" oncomplete={callback} />
															<NewSearchFieldFilterOption key="pullRequests" oncomplete={callback} />
															{@render wrapFilterOption("And", () => callback(new BooleanFilter("and", [])))}
															{@render wrapFilterOption("Or", () => callback(new BooleanFilter("or", [])))}
															{@render wrapFilterOption("Not", () => callback(new NegFilter()))}
														</div>
													</div>
												{/snippet}
												{#if searchFilter === undefined}
												<div class="text-lg h-8 w-30 m-1">
													{@render opButton("add-filter-menu", "Add")}
													{@render newFilter("add-filter-menu", f => searchFilter = f)}
												</div>
												<!-- TODO -->
												{/if}
											</div>
										</div>
									</div>
									<input class="h-8 p-1 grow placeholder:italic placeholder:text-base placeholder:opacity-80" placeholder="Type keywords..." />
									<button class="h-full w-20 flex items-center justify-center cursor-pointer text-theme-header-text hover:text-theme-header-hover-text">
										<SearchIcon class="fill-current size-5 transition-colors" />
									</button>
								</div>
								<div class="h-10 w-full flex bg-theme-search-bar-border -mb-10 mb-0">
									<div class="h-full w-20 flex items-center justify-center">Filters:</div>
								</div>
							</div>
						</div>
					</div>
				</dialog>
			</div>
			<div class="w-full h-1 mb-1 bg-theme-sidebar-divide transition-all peer-[&:has(>button:hover)]:scale-y-200 [&:has(+:hover)]:scale-y-200"></div>
			<div class="flex grow-2 flex-col pt-2 divide-solid divide-theme-sidebar-divide divide-y">
				{#each Object.keys(data.map) as efp}
					<a class={{"p-2 hover:bg-theme-sidebar-hover transition-colors": true, "text-theme-sidebar-active font-bold": page.url.pathname === `/efp/${ efp }`}} href="/efp/{ efp }">
						EFP { data.map[efp].main.id } - { data.map[efp].main.title }
					</a>
				{/each}
			</div>
		</nav>
	</aside>
	<div class="flex-1 overflow-y-auto scrollbar justify-center items-start bg-inherit">
		<header class="p-2 font-semibold bg-theme-header-bg sticky z-50 top-0 shadow border-b text-theme-header-text border-b-theme-header-border">
			<div class="mx-auto flex items-center content-center gap-x-4 transition-colors">
				<button aria-label="sidebar-toggle" class={{"size-fit outline-none p-2 cursor-pointer rounded-lg hover:text-theme-header-hover-text": true, "bg-theme-header-active-bg": sidebarOpen}} title="Toggle Nav"
					onclick={ () => sidebarOpen = !sidebarOpen }>
					<MenuIcon class="size-5 fill-current transition-colors" />
				</button>
				<div>
					<button aria-controls="theme-menu" popovertarget="theme-menu" popovertargetaction="toggle" class="size-fit outline-none p-2 cursor-pointer rounded-lg hover:text-theme-header-hover-text [&:has(+:popover-open)]:bg-theme-header-active-bg" title="Switch Theme"
						onclick={ () => themeDropdownOpen = !themeDropdownOpen }>
						<ThemeIcon class="size-5 fill-current transition-colors" />
					</button>
					<div id="theme-menu" role="menu" class="absolute popover-fade left-[anchor(left)] top-[calc(anchor(bottom)+8px)] font-normal text-theme-main-text bg-theme-header-bg border border-theme-header-border overflow-hidden z-60 rounded-lg shadow-sm" popover>
						<div class="size-full flex flex-col">
							{#each Object.keys(themes) as theme, i}
								<button tabindex="{i}" role="menuitem" class="p-3 outline-none cursor-pointer hover:bg-theme-header-active-bg transition-colors" class:font-bold={ theme === selectedTheme }
									onclick={ () => selectTheme(theme as keyof typeof themes) }>
									{ themes[theme as keyof typeof themes] }
								</button>
							{/each}
						</div>
					</div>
				</div>
				<div class="mx-auto text-xl">
					The TerraModulus EFP Book
				</div>
				<a href="https://github.com/AnvilloyDevStudio/TerraModulus-EFPs">
					<button aria-label="git-repo" class="size-fit outline-none p-2 cursor-pointer hover:text-theme-header-hover-text" title="GitHub repository">
						<GithubIcon class="size-5 fill-current transition-colors" />
					</button>
				</a>
			</div>
		</header>
		<main class="p-8">
			{@render children()}
		</main>
	</div>
</div>
