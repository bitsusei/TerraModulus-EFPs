<script lang="ts">
	import '../app.css';
	import MenuIcon from "$lib/assets/icons/menu.svelte";
	import GithubIcon from "$lib/assets/icons/github.svelte";
	import ThemeIcon from "$lib/assets/icons/theme.svelte";
	import SearchIcon from "$lib/assets/icons/search.svelte";
	import CrossIcon from "$lib/assets/icons/cross.svelte";
	import { onMount } from 'svelte'
	import { page } from '$app/state';
	import MiniSearch from "minisearch";

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

	const miniSearch = new MiniSearch<App.EfpList["searchEntries"][0]>({
		idField: "id",
		fields: ["title", "content"],
		searchOptions: { fuzzy: .2 },
		autoSuggestOptions: { fuzzy: .2 },
	});

	interface Equalable<T> {
		equals(other: T): boolean;
	}
	abstract class Comparable<T> implements Equalable<T> {
		equals(other: T) { return this.compare(other) === 0; }
		/** +ve when > `other`; 0 when === `other`; -ve when < `other` */
		abstract compare(other: T): number;
	}
	class NumberCmp extends Comparable<number> {
		readonly val: number;
		constructor(val: number) { super(); this.val = val; }
		compare(other: number) { return this.val - other; }
	}
	class DateCmp extends Comparable<Date> {
		readonly val: Date;
		constructor(val: Date) { super(); this.val = val; }
		compare(other: Date) { return this.val.getTime() - other.getTime(); }
	}
	interface IFilter<T> {
		filter: (val: T) => boolean;
	};
	class RangeFilter<T extends Comparable<T>> implements IFilter<T> {
		readonly op: "gt" | "eq" | "lt";
		readonly val: T;

		constructor(op: typeof this.op, val: typeof this.val) {
			this.op = op;
			this.val = val;
		}

		filter(val: T) {
			switch (this.op) {
				case "gt": return this.val.compare(val) > 0;
				case "eq": return this.val.compare(val) === 0;
				case "lt": return this.val.compare(val) < 0;
			}
		}
	};
	class BooleanFilter<T extends IFilter<T>> implements IFilter<T> {
		readonly op: "and" | "or";
		readonly val: [T, T, ...T[]];

		constructor(op: typeof this.op, val: typeof this.val) {
			this.op = op;
			this.val = val;
		}

		filter(val: T) {
			switch (this.op) {
				case "and": return this.val.every(f => f.filter(val));
				case "or": return this.val.some(f => f.filter(val));
			}
		}
	};
	class MatchFilter<T extends Equalable<T>> implements IFilter<T> {
		readonly val: T;
		constructor(val: T) { this.val = val; }
		filter(val: T) { return this.val.equals(val); }
	}
	class NegFilter<T extends IFilter<T>> implements IFilter<T> {
		readonly val: T;
		constructor(val: T) { this.val = val; }
		filter(val: T) { return !this.val.filter(val); }
	}

	miniSearch.addAll(data.searchEntries);
	let searchFilters = $state<{
		created?: IFilter<Date>,
		category?: IFilter<App.EfpData["category"]>,
		status?: IFilter<App.EfpData["status"]>,
		obsoletedBy?: IFilter<string>,
		updatedBy?: IFilter<string>,
		obsoletes?: IFilter<string>,
		updates?: IFilter<string>,
		pullRequests?: IFilter<string>,
	}>({});

	const dispatchFocusOut = (e: Element, callback: () => void) => {
		const listener = () => {
			if (!e.contains(document.activeElement)) {
				callback();
				document.removeEventListener("focusin", listener);
				document.removeEventListener("click", listener);
			}
		};
		document.addEventListener("focusin", listener);
		document.addEventListener("click", listener);
	};

	let searchActive = $state(false);
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
			<div class="w-full h-1 mt-1 bg-theme-sidebar-divide transition-all [&:has(+button+div+:hover)]:scale-y-200 [&:has(+:hover)]:scale-y-200"></div>
			<button class="[&:hover>div>div]:size-fit -my-4 [&:hover+div]:scale-y-200 [&:hover>div>div]:scale-x-100 relative p-1.25 left-3/4 z-2 transform -translate-x-1/2 rounded-lg flex justify-center items-center scale-0 size-fit
						   transition-all ease-in-out [&:has(+div+:hover)]:translate-x-2 [&:has(+div+:hover)]:scale-100 hover:scale-100 hover:translate-x-2 bg-theme-search-button-bg text-theme-header-text hover:text-theme-header-hover-text"
					onclick={ () => searchActive = true }>
				<div class="flex justify-center items-center size-fit">
					<SearchIcon class="size-5 fill-current transition-colors" />
					<div class="text-md size-0 leading-none font-bold overflow-hidden scale-x-0 transform transition-all">
						EFP
					</div>
				</div>
			</button>
			<div class="w-full h-1 mb-1 bg-theme-sidebar-divide transition-all [&:has(~:hover)]:scale-y-200"></div>
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
				<div class="dropdown">
					<button aria-controls="theme-menu" aria-expanded="{ themeDropdownOpen }" aria-haspopup="true" class={{"size-fit outline-none p-2 cursor-pointer rounded-lg hover:text-theme-header-hover-text": true, "bg-theme-header-active-bg": themeDropdownOpen}} title="Switch Theme"
						onclick={ () => themeDropdownOpen = !themeDropdownOpen } onfocus={ e => dispatchFocusOut(e.currentTarget.parentElement as HTMLElement, () => themeDropdownOpen = false) }>
						<ThemeIcon class="size-5 fill-current transition-colors" />
					</button>
					<div id="theme-menu" role="menu" class="dropdown-menu float-left top-13 font-normal text-theme-main-text bg-theme-header-bg border border-theme-header-border overflow-hidden flex flex-col z-60 rounded-lg shadow-sm absolute" class:active={ themeDropdownOpen }>
						{#each Object.keys(themes) as theme, i}
							<button tabindex="{i}" role="menuitem" class="p-3 outline-none cursor-pointer hover:bg-theme-header-active-bg transition-colors" class:font-bold={ theme === selectedTheme }
								onclick={ () => selectTheme(theme as keyof typeof themes) }>
								{ themes[theme as keyof typeof themes] }
							</button>
						{/each}
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
		<div>
			<main class="p-8">
				{@render children()}
			</main>
			{#if searchActive}
			<div class="absolute inset-0 z-60 size-full bg-[#0008] animate-[200ms_ease-in-out_0s_1_fade-in]">
				<div class="size-full flex justify-center items-center">
					<div class="size-[80%] flex flex-col items-center rounded-4xl bg-theme-main-bg">
						<div class="w-full flex items-center">
							<div class="size-15"></div>
							<h1 class="grow-2 text-center text-2xl font-bold">
								Search EFP
							</h1>
							<button class="flex-none cursor-pointer p-5 size-fit text-theme-header-text hover:text-theme-header-hover-text rounded-4xl overflow-hidden" onclick={ () => searchActive = false } aria-label="close" title="Close">
								<CrossIcon class="fill-current size-5" />
							</button>
						</div>
					</div>
				</div>
			</div>
			{/if}
		</div>
	</div>
</div>
