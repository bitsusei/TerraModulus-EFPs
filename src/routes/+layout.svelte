<script lang="ts">
	import '../app.css';
	import MenuIcon from "$lib/assets/icons/menu.svelte";
	import GithubIcon from "$lib/assets/icons/github.svelte";
	import ThemeIcon from "$lib/assets/icons/theme.svelte";
	import SearchIcon from "$lib/assets/icons/search.svelte";
	import CrossIcon from "$lib/assets/icons/cross.svelte";
	import UpArrowIcon from "$lib/assets/icons/up-arrow.svelte";
	import { onMount, type Snippet } from 'svelte'
	import { page } from '$app/state';
	import MiniSearch, { type SearchResult } from "minisearch";
	import FormDialog from './FormDialog.svelte';
	import { BooleanFilter, filterFields, MatchFilter, NegFilter, RangeFilter, type Filter, type SearchEntry } from './search.svelte';
	import NewSearchFieldFilterOption from './NewSearchFieldFilterOption.svelte';
	// import assert from 'assert';
	import { App, BiMap } from '$lib';
	import { fade } from 'svelte/transition';
	import highlightWords from 'highlight-words';
	import { explicitEffect } from './util.svelte';
	import { escapeRegExp } from 'lodash';

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

	const searchEntryMap: Record<number, (typeof data.searchEntries)[number]> = Object.fromEntries(data.searchEntries.map(e => [e.id, e]));
	miniSearch.addAll(data.searchEntries);
	interface FilterSelection {
		readonly empty: boolean;
	}
	class FilterSel implements FilterSelection {
		empty = false;
		public readonly instance: Filter = $state<any>(undefined);
		/** `undefined` if root */
		public readonly slot?: WrapFilterSlot = $state<any>(undefined);
		constructor(
			instance: Filter,
			slot?: WrapFilterSlot
		) { this.instance = instance; this.slot = slot; }
	}
	interface WrapFilterSlot {
		setSlot(f: Filter): void
		removeSlot(): void
	}
	interface WrapFilterSlotSelection extends FilterSelection, WrapFilterSlot {}
	class BooleanFilterSlot implements WrapFilterSlot {
		public readonly instance: BooleanFilter = $state<any>(undefined);
		constructor(
			instance: BooleanFilter,
			public readonly index: number
		) { this.instance = instance; }
		setSlot(f: Filter) {
			this.instance.val[this.index] = f;
		}
		removeSlot() {
			this.instance.val.splice(this.index, 1);
		}
	}
	class BooleanFilterSlotSel extends BooleanFilterSlot implements WrapFilterSlotSelection {
		empty = true;
	}
	class NegFilterSlot implements WrapFilterSlot {
		public readonly instance: NegFilter = $state<any>(undefined);
		constructor(
			instance: NegFilter
		) { this.instance = instance; }
		setSlot(f: Filter) {
			this.instance.val = f;
		}
		removeSlot() {
			this.instance.val = undefined;
		}
	}
	class NegFilterSlotSel extends NegFilterSlot implements WrapFilterSlotSelection {
		empty = true;
	}
	let searchFilter = $state<{ root?: Filter, selection?: FilterSel | BooleanFilterSlotSel | NegFilterSlotSel }>({});
	let searchDialog = $state<HTMLDialogElement>();
	let searchInput = $state("");
	let searchSuggestions = $derived(searchInput.length !== 0 ? miniSearch.autoSuggest(searchInput) : []);
	let searchResults: SearchResult[] = $state([]);
	let searchSuggestionSel: number | undefined = $state(undefined);
	explicitEffect(() => searchSuggestionSel = undefined, () => [searchInput]);
	$inspect(searchSuggestions)
	$inspect(searchResults)
	/** Selection must not be a slot (`WrapFilterSlotSelection`), thus FilterSel; `wrap` must be empty */
	const wrapSelectedFilter = (wrap: BooleanFilter | NegFilter) => {
		// assert(searchFilter.selection instanceof FilterSel); // TypeError: assert is not a function
		function noop(value: unknown): asserts value {}
		noop(searchFilter.selection instanceof FilterSel);
		const old = searchFilter.selection;
		if (wrap instanceof BooleanFilter)
			wrap.val[0] = old.instance;
		else
			wrap.val = old.instance;
		if (old.slot === undefined)
			searchFilter.root = wrap;
		else {
			old.slot.setSlot(wrap);
		}

		searchFilter.selection = new FilterSel(wrap, old.slot);
	};

	/** Return `value[0]` is the title; `value[1]` is the content */
	const highlightSearchResult = (r: SearchResult) => {
		// assume only keys of "title" and "content".
		const meta: Record<string, string[]> = {};
		r.terms.forEach(t => r.match[t].forEach(f => {
			if (meta[f] === undefined)
				meta[f] = [t];
			else
				meta[f].push(t);
		}))
		const result: Record<string, { match: boolean, text: string }[]> = {};
		const entry = searchEntryMap[r.id as number];
		Object.entries(meta).forEach(e => {
			result[e[0]] = highlightWords({
				text: entry[e[0] as keyof (typeof data.searchEntries)[number]] as string,
				query: `/\\b(${e[1].map(escapeRegExp).join("|")})\\b/gi`,
				clipBy: e[0] === "title" ? undefined : 6,
			}).map(c => ({ match: c.match, text: c.text }));
		});
		if (result.title === undefined)
			result.title = [{ match: false, text: entry.title }];
		else if (result.content === undefined)
			result.content = [{ match: false, text: entry.content.substring(0, 120) }];
		return [ result.title, result.content ];
	};
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
							<div class={{
								"h-fit w-[95%] flex-none flex flex-col bg-theme-search-bar-border rounded-[20px] overflow-hidden transition-all": true,
								"[&:has(>*>*>button+div:popover-open)]:rounded-bl-none": searchFilter.root === undefined
							}}>
								<div class="h-10 w-full flex items-center bg-theme-search-bar-bg rounded-[40px] overflow-hidden divide-x-2 divide-theme-search-bar-border border-2 border-theme-search-bar-border">
									<div class="h-full w-20">
										<button popovertarget="filters-menu" popovertargetaction="toggle" class="flex group/close transform size-full items-center justify-center cursor-pointer text-theme-header-text hover:text-theme-header-hover-text transition-colors">
											Filter
											<UpArrowIcon class="fill-current size-2.5 ml-1 transition-all group-hover/close:translate-y-0.5 transform -scale-y-100 group-[&:has(+div:popover-open)]/close:scale-y-100" />
										</button>
										<div id="filters-menu" class="popover-fade absolute inset-auto top-[anchor(bottom)] rounded-b-lg left-[calc(anchor(left)-2px)] shadow-sm border-2 border-theme-search-bar-border bg-theme-search-bar-border" popover="auto">
											<div class="flex flex-col">
												{#snippet opPopButton(key: string, name: string)}
													<button transition:fade|global popovertarget={key} popovertargetaction="toggle" class="h-8 w-full rounded-lg bg-theme-search-bar-bg flex items-center justify-center cursor-pointer transition-colors text-theme-header-text hover:text-theme-header-hover-text">
														{name}
													</button>
												{/snippet}
												{#snippet wrapFilterOption(name: string, callback: () => void)}
													<button class="flex items-center justify-start cursor-pointer transition-colors hover:text-theme-header-hover-text w-full" onclick={callback}>
														<div class="flex items-center justify-center italic text-base me-1 h-8 w-12 my-0.5 rounded-lg bg-theme-search-filter-primary-bg">
															Wrap
														</div>
														<div class="px-2 grow rounded-lg bg-theme-search-filter-secondary-bg">
															{name}
														</div>
													</button>
												{/snippet}
												{#snippet filterSelect(key: string, children: Snippet<[]>)}
												<div id={key} class="popover-fade overflow-y-auto scrollbar absolute inset-auto top-[calc(anchor(top)-52px)] p-1 rounded-lg left-[calc(anchor(right)+4px)] shadow-sm text-theme-header-text bg-theme-search-bar-border" popover="auto">
													<div class="flex [&>*]:flex-none flex-col basis-auto">
														{@render children()}
													</div>
												</div>
												{/snippet}
												{#snippet newFilter(key: string, callback: (f: Filter) => void)}
													{#snippet children()}
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
													{/snippet}
													{@render filterSelect(key, children)}
												{/snippet}
												<div class="text-lg h-fit w-30 mx-1 [&>button]:my-1">
													{#if searchFilter.root === undefined}
													{@render opPopButton("add-filter-menu", "Add")}
													{@render newFilter("add-filter-menu", f => searchFilter.root = f)}
													{:else}
													<button transition:fade|global class="h-8 w-full rounded-lg bg-theme-search-bar-bg flex items-center justify-center cursor-pointer text-theme-header-text hover:text-theme-header-hover-text"
														onclick={ () => searchFilter = {} }>
														Clear All
													</button>
													{#if searchFilter.selection !== undefined}
													<button transition:fade|global class="h-8 w-full rounded-lg bg-theme-search-bar-bg flex items-center justify-center cursor-pointer text-theme-header-text hover:text-theme-header-hover-text"
														onclick={ () => searchFilter.selection = undefined }>
														Unselect
													</button>
													{#if searchFilter.selection.empty}
													{@render opPopButton("insert-filter-menu", "Insert")}
													{@render newFilter("insert-filter-menu", f => {
														(<WrapFilterSlotSelection> searchFilter.selection).setSlot(f);
														if (searchFilter.selection instanceof BooleanFilterSlotSel)
															searchFilter.selection = new FilterSel(f, new BooleanFilterSlot(searchFilter.selection.instance, searchFilter.selection.index));
														else if (searchFilter.selection instanceof NegFilterSlotSel)
															searchFilter.selection = new FilterSel(f, new NegFilterSlot(searchFilter.selection.instance));
													})}
													{:else}
													{@render opPopButton("wrap-filter-menu", "Wrap")}
													{#snippet children()}
														{@render wrapFilterOption("And", () => wrapSelectedFilter(new BooleanFilter("and", [])))}
														{@render wrapFilterOption("Or", () => wrapSelectedFilter(new BooleanFilter("or", [])))}
														{@render wrapFilterOption("Not", () => wrapSelectedFilter(new NegFilter()))}
													{/snippet}
													{@render filterSelect("wrap-filter-menu", children)}
													<button transition:fade|global class="h-8 w-full rounded-lg bg-theme-search-bar-bg flex items-center justify-center cursor-pointer text-theme-header-text hover:text-theme-header-hover-text"
														onclick={() => {
															// assert(searchFilter.selection instanceof FilterSel); // TypeError: assert is not a function
															function noop(value: unknown): asserts value {}
															noop(searchFilter.selection instanceof FilterSel);
															if (searchFilter.selection.slot === undefined)
																searchFilter = {};
															else {
																searchFilter.selection.slot.removeSlot();
																if (searchFilter.selection.slot instanceof BooleanFilterSlot)
																	searchFilter.selection = new BooleanFilterSlotSel(searchFilter.selection.slot.instance, searchFilter.selection.slot.index)
																else if (searchFilter.selection.slot instanceof NegFilterSlot)
																	searchFilter.selection = new NegFilterSlotSel(searchFilter.selection.slot.instance)
																// no more else but above "if" is due to class extending; it is not sealed
															}
														}}>
														Remove
													</button>
													{/if}
													{/if}
													{/if}
												</div>
											</div>
										</div>
									</div>
									<form class="grow flex items-center h-full divide-x-2 divide-theme-search-bar-border">
										<div class="h-8 p-1 grow group/search">
											<input autocomplete="off" class="size-full [anchor-name:--input] placeholder:italic placeholder:text-base placeholder:opacity-80" bind:value={searchInput} type="search" placeholder="Type keywords..." onkeydown={e => {
												if (e.code === "Enter") {
													e.preventDefault();
													if (searchSuggestionSel === undefined) {
														(<HTMLElement> e.currentTarget.parentElement!.parentElement!.querySelector(":scope > button")).click();
														e.currentTarget.blur();
													} else
														searchInput = searchSuggestions[searchSuggestionSel].suggestion;
												} else if (e.code === "ArrowUp" && searchSuggestions.length !== 0) {
													searchSuggestionSel = searchSuggestionSel === undefined || searchSuggestionSel === 0 ? searchSuggestions.length - 1 : searchSuggestionSel - 1;
												} else if (e.code === "ArrowDown" && searchSuggestions.length !== 0) {
													searchSuggestionSel = searchSuggestionSel === undefined || searchSuggestionSel === searchSuggestions.length - 1 ? 0 : searchSuggestionSel + 1;
												} else if (e.code === "Escape" && searchSuggestionSel !== undefined) {
													e.preventDefault();
													searchSuggestionSel = undefined;
												}
											}} />
											{#if searchSuggestions.length !== 0}
											<div transition:fade class="absolute bg-theme-search-bar-bg [position-anchor:--input] inset-auto top-[calc(anchor(bottom)+6px)] left-[anchor(left)] right-[anchor(right)] hidden group-focus-within/search:block transition-all transition-discrete opacity-0 group-focus-within/search:opacity-100 starting:group-focus-within/search:opacity-0">
												{#each searchSuggestions as suggestion, i}
													<button class={{
														"w-full p-2 h-6 truncate flex justify-start items-center hover:bg-theme-search-bar-border transition-colors": true,
														"bg-theme-search-bar-border": i === searchSuggestionSel
													}} onmouseenter={ () => searchSuggestionSel = i } onclick={ () => searchInput = suggestion.suggestion }>
														{suggestion.suggestion}
													</button>
												{/each}
											</div>
											{/if}
										</div>
										<button type="button" class="h-full w-20 flex items-center justify-center cursor-pointer bg-theme-search-button-bg text-theme-header-text hover:text-theme-header-hover-text"
											onclick={ () => searchResults = miniSearch.search(searchInput, searchFilter.root !== undefined ? { filter: r => searchFilter.root!.filter(searchEntryMap[r.id as number]) } : undefined) }>
											<SearchIcon class="fill-current size-5 transition-colors" />
										</button>
									</form>
								</div>
								<div class="h-10 w-full py-1 flex bg-theme-search-bar-border -mb-10 transition-all" class:mb-0={ searchFilter.root !== undefined }>
									<div class="h-full w-20 flex items-center justify-center">Filters:</div>
									<div class="h-full grow flex ms-1 me-2 items-center overflow-hidden overflow-x-auto scrollbar-none bg-theme-search-bar-bg rounded-lg scroll-smooth" onwheel={e => {
										e.preventDefault(); // Prevent vertical scrolling
										e.currentTarget.scrollLeft += e.deltaY; // Scroll horizontally by vertical wheel delta
									}}>
										{#if searchFilter.root !== undefined}
										{#snippet renderFilter(f: Filter)}
											{@const dialogOpening = (e: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => {
												(<HTMLDialogElement> e.currentTarget.parentElement!.querySelector(":scope > dialog")).show();
												e.stopPropagation()
											}}
											<!-- svelte-ignore a11y_click_events_have_key_events -->
											<!-- svelte-ignore a11y_no_static_element_interactions -->
											<div class={{
												"h-full w-fit rounded-lg flex [&>*]:flex-none items-center justify-center mx-1.5 px-2 bg-theme-search-filter-secondary-bg outline-solid outline-2 outline-theme-search-bar-bg": true,
												"bg-theme-search-filter-primary-bg": f instanceof BooleanFilter || f instanceof NegFilter,
												"outline-theme-search-filter-outline": searchFilter.selection instanceof FilterSel && f === searchFilter.selection.instance
											}} onclick={ () => searchFilter.selection = new FilterSel(f) }> <!-- if this is in slot, the wrap filter handles this. -->
												{#snippet valueDisplay(value: string, editOption: { type: "date" | "idInput" } | { type: "options", param: string[] }, editCallback: (v: any) => void)}
													<div>
														<button class="p-1 leading-none cursor-pointer flex items-center justify-center rounded-md bg-theme-search-bar-bg border-2 border-theme-search-filter-primary-bg" onclick={dialogOpening}>
															{value}
														</button>
														<FormDialog items={ { "Value": editOption } } oncomplete={ data => editCallback(data["Value"]) } />
													</div>
												{/snippet}
												{#snippet operatorDisplay(value: string, editOptions: string[], editCallback: (v: string) => void)}
													<div>
														<button class="px-0.5 cursor-pointer flex items-center justify-center font-bold rounded-md bg-theme-search-filter-primary-bg border-2 border-theme-search-bar-border" onclick={dialogOpening}>
															{value}
														</button> <!-- Binding is avoided since this is not as a dedicated component -->
														<FormDialog items={ { "Operator": { type: "options", param: editOptions } } } oncomplete={ data => editCallback(data["Operator"]) } />
													</div>
												{/snippet}
												{#if f instanceof RangeFilter || f instanceof MatchFilter}
												{@const isRange = f instanceof RangeFilter}
												<div class="flex items-center justify-center font-bold">
													{ filterFields[f.key as keyof typeof filterFields].name }
												</div>
												{#if isRange}
												{@render operatorDisplay(f.op, Object.keys(RangeFilter.opMap), v => f.op = RangeFilter.opMap[v as keyof typeof RangeFilter.opMap])}
												{:else}
												<div class="p-2 flex items-center justify-center font-bold">
													==
												</div>
												{/if}
												<!-- Currently only Date and string ID as generic types -->
												{#if f.val instanceof Date}
												{@render valueDisplay(
													`${ f.val.getUTCFullYear() }-${ f.val.getUTCMonth().toString().padStart(2, "0") }-${ f.val.getUTCDate().toString().padStart(2, "0") }`,
													{ type: "date" }, v => f.val = v
												)}
												{:else if f.field === filterFields.category.field}
												{@render valueDisplay(App.EfpEntry.category.get(f.val)!,
													{ type: "options", param: [...App.EfpEntry.category.values()] },
													v => f.val = App.EfpEntry.category.getKey(v))}
												{:else if f.field === filterFields.status.field}
												{@render valueDisplay(App.EfpEntry.status.get(f.val)!,
													{ type: "options", param: [...App.EfpEntry.status.values()] },
													v => f.val = App.EfpEntry.status.getKey(v))}
												{:else if typeof f.val === "string"} <!-- string ID -->
												{@render valueDisplay(f.val, { type: "idInput" }, v => f.val = v)}
												{/if}
												{:else if f instanceof BooleanFilter}
												{@const map = new BiMap({ and: "&", or: "|" })}
												{@render operatorDisplay(map.get(f.op)!, [...map.values()], v => f.op = map.getKey(v) as typeof f.op)}
												<div class="flex h-full w-fit items-center justify-center">
													{#each f.val as ff, i}
														<div class="flex-none mx-1 h-full w-fit" onclick={e => {
															// due to bubbling
															searchFilter.selection = new FilterSel(ff, new BooleanFilterSlot(f, i));
															e.stopPropagation(); // stop more bubbling
														}}>
															{@render renderFilter(ff)}
														</div>
													{/each}
													<button class={{
														"flex-none mx-1 p-1 h-6 flex items-center justify-center font-bold rounded-md bg-theme-search-filter-secondary-bg hover:bg-theme-search-bar-bg border-2 border-theme-search-bar-border transition-colors": true,
														"outline-solid outline-2 outline-theme-search-filter-outline": searchFilter.selection instanceof BooleanFilterSlotSel && searchFilter.selection.instance === f
													}} onclick={e => {
														searchFilter.selection = new BooleanFilterSlotSel(f, f.val.length);
														e.stopPropagation(); // stop bubbling
													}}>
														+
													</button>
												</div>
												{:else if f instanceof NegFilter}
												<div class="flex items-center justify-center font-bold rounded-md bg-theme-search-filter-primary-bg">
													!
												</div>
												<div class="flex h-full w-fit items-center justify-center">
													{#if f.val !== undefined}
													<div class="flex-none mx-1 h-full w-fit" onclick={e => {
														// due to bubbling
														searchFilter.selection = new FilterSel(f.val!, new NegFilterSlot(f));
														e.stopPropagation(); // stop more bubbling
													}}>
														{@render renderFilter(f.val)}
													</div>
													{:else}
													<button class={{
														"flex-none mx-1 p-1 h-6 flex items-center justify-center font-bold rounded-md bg-theme-search-filter-secondary-bg hover:bg-theme-search-bar-bg border-2 border-theme-search-bar-border transition-colors": true,
														"outline-solid outline-2 outline-theme-search-filter-outline": searchFilter.selection instanceof NegFilterSlotSel && searchFilter.selection.instance === f
													}} onclick={e => {
														searchFilter.selection = new NegFilterSlotSel(f);
														e.stopPropagation(); // stop bubbling
													}}>
														+
													</button>
													{/if}
												</div>
												<!-- no more else but above "if" is due to class extending; it is not sealed  -->
												{/if}
											</div>
										{/snippet}
										{@render renderFilter(searchFilter.root)}
										{/if}
									</div>
								</div>
							</div>
							<div class="grow w-[95%] my-5 p-2 bg-theme-search-result-bg rounded-3xl overflow-x-hidden overflow-y-auto">
								{#each searchResults as result}
									{@const [ title, content ] = highlightSearchResult(result)}
									<a transition:fade class="w-full m-1 p-1 flex flex-col items-center justify-center [&>*]:flex-none rounded-xl bg-theme-search-result-item-bg border-2 border-theme-search-bar-border hover:bg-theme-search-bar-bg transition-colors" href="/efp/{ data.indexMap[result.id] }"
										onclick={ () => searchDialog!.close() }>
										{#snippet renderHighlights(meta: { match: boolean, text: string }[])}
											{#each meta as e}
												{#if e.match}
												<span class="font-extrabold inline text-theme-search-result-highlight-text">{e.text}</span>
												{:else}
												<span class="inline">{e.text}</span>
												{/if}
											{/each}
										{/snippet}
										<div class="w-full flex justify-start items-center [&>*]:flex-none">
											<div class="mx-1">
												EFP {result.id}
											</div>
											<div class="mx-1">-</div>
											<p class="p-1 grow truncate">
												{@render renderHighlights(title)}
											</p>
										</div>
										<hr class="flex-none w-full h-px my-1 bg-theme-search-bar-border border-0">
										<div class="p-1 w-full text-ellipsis flex justify-center items-center">
											<p class="w-full line-clamp-2 text-theme-search-result-minor-text">
												{@render renderHighlights(content)}
											</p>
										</div>
									</a>
								{/each}
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
