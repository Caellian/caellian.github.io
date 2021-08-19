<script lang="ts">
	import { onMount } from 'svelte';

	import userInfo from '$lib/user';
	import jsonp from '$lib/jsonp';

	import Donut from './Donut.svelte';
	import type { ChartEntry, EntrySelection } from './Donut.svelte';

	var langName: string = '';
	var langColor: string = '#fff';

	let mobile = false;

	const LANGUAGE_CHART_COUNT = 6;
	const IGNORED_LANGS = [
		'other',
		'text',
		'markdown',
		'git config',
		'pacmanconf',
		'html',
		'ini',
		'xml',
		'yaml',
		'toml',
		'json',
		'gettext catalog'
	];

	const USED_LANGUAGES =
		'https://wakatime.com/share/@Caellian/ece394af-3d6b-43d3-8743-8f8b00426216.json';

	interface WakaTimeEntry {
		name: string;
		color: string;
		percent: number;
	}

	function languageSelected(l: EntrySelection) {
		langName = l.name;
		langColor = l.color;
	}

	async function loadLanguages() {
		let data: WakaTimeEntry[];
		try {
			data = (await jsonp(USED_LANGUAGES))['data'] as WakaTimeEntry[];
		} catch (error) {
			console.error('Unable to get data from WakaTime.');
			data = [];
		}

		let curr = 0;
		const collected = [];
		while (curr < data.length && curr < 10) {
			if (IGNORED_LANGS.indexOf(data[curr].name.toLowerCase()) == -1) {
				collected.push({
					name: data[curr].name,
					color: data[curr].color,
					weight: Math.round(data[curr].percent)
				});
			}
			curr += 1;
		}

		return collected;
	}

	var entries_promise: Promise<ChartEntry[]> = loadLanguages();

	onMount(() => {
		mobile = userInfo().mobile;

		return () => {};
	});
</script>

<div class="language-donut">
	{#await entries_promise}
		<p>Loading...</p>
	{:then value}
		{#if mobile}
			<ul>
				{#each value as entry}
					<li>{entry.name}</li>
				{/each}
			</ul>
		{:else}
			<Donut
				entries={value.slice(0, LANGUAGE_CHART_COUNT)}
				background="var(--bg-accent)"
				onSelect={languageSelected}
			/>
			<span class="lang-name" style="--shadow-color:{langColor};">
				{langName}
			</span>
		{/if}
	{:catch _}
		<p>Unable to load.</p>
	{/await}
</div>

<style lang="less" global>
	@import '../../style/constants.less';

	.language-donut {
		display: grid;
		place-items: center;

		width: 100%;

		> * {
			grid-area: 1 / 1 / 2 / 2;
		}

		.lang-name {
			font-size: 2rem;

			transition: all 0.2s linear;

			@media (min-width: @mobile-size) {
				text-shadow: 0 0 1rem var(--shadow-color);
			}
		}
	}
</style>
