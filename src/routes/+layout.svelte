<script lang="ts">
	import '../app.css';
	import MenuLogo from "$lib/assets/icons/menu.svelte";
	import GithubLogo from "$lib/assets/icons/github.svelte";
	import ThemeLogo from "$lib/assets/icons/theme.svelte";
	import { onMount } from 'svelte'
	import { page } from '$app/state';

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
</script>

<div class="flex h-lvh overflow-hidden divide-solid divide-x-8 divide-theme-main-bg text-theme-main-text bg-theme-main-bg scrollbar-thumb-theme-scrollbar-thumb scrollbar-track-theme-scrollbar-track" data-theme={ currentTheme }>
	<aside class="flex-shrink-0 w-72 flex flex-col bg-theme-sidebar-bg text-theme-sidebar-text transition-all duration-300 overflow-y-auto scrollbar" class:-ml-72={ !sidebarOpen }>
		<nav class="flex-1 flex flex-col mt-4">
			{#each Object.keys(data.map) as efp}
				<a class={{"p-2 hover:bg-theme-sidebar-hover transition-colors divide-solid divide-theme-sidebar-divide divide-y": true, "text-theme-sidebar-active font-bold": page.url.pathname === `/efp/${ efp }`}} href="/efp/{ efp }">
					EFP { data.map[efp].main.id } - { data.map[efp].main.title }
				</a>
			{/each}
		</nav>
	</aside>
	<div class="flex-1 overflow-y-auto scrollbar justify-center content-center bg-inherit">
		<header class="p-2 font-semibold bg-theme-header-bg sticky z-50 top-0 shadow border-b text-theme-header-text border-b-theme-header-border">
			<div class="mx-auto flex items-center content-center gap-x-4 transition-colors">
				<button aria-label="sidebar-toggle" class={{"size-fit outline-none p-2 cursor-pointer rounded-lg hover:text-theme-header-hover-text": true, "bg-theme-header-active-bg": sidebarOpen}} title="Toggle Nav"
					onclick={ () => sidebarOpen = !sidebarOpen }>
					<MenuLogo class="size-5 fill-current transition-colors" />
				</button>
				<div class="dropdown">
					<button aria-controls="theme-menu" aria-expanded="{ themeDropdownOpen }" aria-haspopup="true" class={{"size-fit outline-none p-2 cursor-pointer rounded-lg hover:text-theme-header-hover-text": true, "bg-theme-header-active-bg": themeDropdownOpen}} title="Switch Theme"
						onclick={ () => themeDropdownOpen = !themeDropdownOpen } onfocus={ e => dispatchFocusOut(e.currentTarget.parentElement as HTMLElement, () => themeDropdownOpen = false) }>
						<ThemeLogo class="size-5 fill-current transition-colors" />
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
						<GithubLogo class="size-5 fill-current transition-colors" />
					</button>
				</a>
			</div>
		</header>
		<main class="p-8">
			{@render children()}
		</main>
	</div>
</div>
