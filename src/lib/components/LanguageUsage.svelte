<script lang="ts">
  import { onMount } from "svelte";

  import { prerendering } from "$app/env";
  import userInfo from "$lib/user";
  import {
    USED_LANGUAGES,
    languages as language_data,
    TimedLocalStorageStore,
  } from "$lib/stores";

  import Donut from "./Donut.svelte";
  import type { ChartEntry, EntrySelection } from "./Donut.svelte";
  import { css_vars } from "$lib/css";

  const LANGUAGE_CHART_COUNT = 6;

  let lang_name: string = "";
  let lang_style: string = "";

  let mobile = false;

  function languageSelected(l: EntrySelection) {
    lang_name = l.name;
    lang_style = css_vars({
      lang_color: l.color,
    });
  }

  let languages: TimedLocalStorageStore<ChartEntry[]> = null;

  onMount(async () => {
    mobile = userInfo().mobile;

    languages = await language_data;
  });
</script>

<div class="language-usage">
  {#if prerendering}
    <p>
      You can locate language list in JSON format <a href={USED_LANGUAGES}
        >here</a
      >.
    </p>
  {:else if languages === null}
    <p>Loading...</p>
  {:else if $languages.length > 0}
    {#if mobile}
      <ul class="lang-list pagewide">
        {#each $languages as entry}
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
            entries={$languages.slice(0, LANGUAGE_CHART_COUNT)}
            background="var(--bg-accent)"
            onSelect={languageSelected}
          />
        </div>
        <p class="lang-name" style={lang_style}>
          {lang_name}
        </p>
      </div>
    {/if}
  {:else}
    <p>Unable to load language list.</p>
  {/if}
</div>

<style lang="stylus">
	@import '../../style/constants'

	.labeled-donut
		width 50%
		margin auto

		.lang-name
			font-size 2rem
			padding 0

			transition all 0.2s linear

			@media (min-width: mobile-size)
				text-shadow 0 0 1rem var(--lang-color, transparent)

			z-index -1

	.language-usage
		width 100%

	.lang-list
		display flex
		flex-direction column

		background var(--bg-accent)
		border solid 2px var(--bg-light)
		border-radius 0.2rem

		.lang-entry
			display flex

			padding 0.5rem 1rem

			border-bottom solid 2px var(--color)

			&:nth-last-child(1)
				border-radius 0.2rem

			.name
				flex-grow 1
				color var(--color)

				font-size 1.5rem
				font-weight bold

				padding 0

			.weight
				flex-basis content
				color var(--text)

				padding 0

</style>
