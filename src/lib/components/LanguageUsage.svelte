<script lang="ts">
	import { onMount } from 'svelte';

	import userInfo from '$lib/user';
	import jsonp from '$lib/jsonp';

	import Donut from './Donut.svelte';
	import type { ChartEntry, EntrySelection } from './Donut.svelte';

	var langName: string = '';
	var langColor: string = '#fff';

	var mobile = false;

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
		var data: WakaTimeEntry[];
		try {
			data = (await jsonp(USED_LANGUAGES))['data'] as WakaTimeEntry[];
		} catch (error) {
			console.error('Unable to get data from WakaTime.');
			data = [];
		}

		var curr = 0;
		var total_weight = 0;
		const collected = [] as ChartEntry[];
		while (curr < data.length && curr < 10) {
			if (IGNORED_LANGS.indexOf(data[curr].name.toLowerCase()) == -1) {
				total_weight += Math.round(data[curr].percent);
				collected.push({
					name: data[curr].name,
					color: data[curr].color,
					weight: Math.round(data[curr].percent)
				});
			}
			curr += 1;
		}

		if (mobile && collected.length > 0) {
			var recalc_total = 0;
			var biggest = collected[0];
			for (var e of collected) {
				e.weight = Math.round(e.weight / total_weight * 100);
				recalc_total += e.weight;
				if (biggest.weight < e.weight) {
					biggest = e;
				}
			}

			if (recalc_total < 100) {
				biggest.weight += 100 - recalc_total;
			}
		}

		return collected;
	}

	var entries_promise: Promise<ChartEntry[]> = loadLanguages();

	onMount(() => {
		mobile = userInfo().mobile;

		return () => {};
	});
</script>

<div class="language-usage">
	{#await entries_promise}
		<p>Loading...</p>
	{:then value}
		{#if mobile}
			<ul class="lang-list pagewide">
				{#each value as entry}
					<li class="lang-entry" style="--color:{entry.color};">
						<p class="name">{entry.name}</p>
						<p class="weight">{entry.weight}%</p>
					</li>
				{/each}
			</ul>
		{:else}
			<div class="labeled-donut center">
				<div class="donut">
					<Donut
						entries={value.slice(0, LANGUAGE_CHART_COUNT)}
						background="var(--bg-accent)"
						onSelect={languageSelected}
					/>
				</div>
				<p class="lang-name" style="--shadow-color:{langColor};">
					{langName}
				</p>
			</div>
		{/if}
	{:catch _}
		<p>Unable to load.</p>
	{/await}
</div>

<style lang="less">
	@import '../../style/constants.less';

	.labeled-donut {
		width: 50%;
		margin: auto;

		.lang-name {
			font-size: 2rem;

			transition: all 0.2s linear;

			@media (min-width: @mobile-size) {
				text-shadow: 0 0 1rem var(--shadow-color);
			}
		}
	}

	.language-usage {

		width: 100%;

	}

	.lang-list {
		display: flex;
		flex-direction: column;

		background: var(--bg-accent);
		border: solid 2px var(--bg-light);
		border-radius: 0.2rem;

		.lang-entry {
			display: flex;

			padding: 0.5rem 1rem;

			border-bottom: solid 2px var(--color);

			&:nth-last-child(1) {
				border-radius: 0.2rem;
			}

			.name {
				flex-grow: 1;
				color: var(--color);

				font-size: 1.5rem;
				font-weight: bold;

				padding: 0;
			}

			.weight {
				flex-basis: content;
				color: var(--text);

				padding: 0;
			}
		}
	}
</style>
