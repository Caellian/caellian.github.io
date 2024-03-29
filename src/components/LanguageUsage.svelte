<script>
  import { browser } from "$app/environment";

  import language_data from "$data/used_languages.json";

  import Donut from "./Donut.svelte";
  import { cssVars, LIMITS } from "$lib/util";

  /**
   * @typedef {Object} Language
   * @prop {string} name
   * @prop {string} color
   * @prop {number} weight
   */

  /**
   * @type {Language[]}
   */
  const languages = language_data;

  let lang_name = "";
  let lang_style = "";

  /**
   * @param {Language} lang
   */
  function languageSelected(lang) {
    lang_name = lang.name;
    lang_style = cssVars({
      lang_color: lang.color,
    });
  }
</script>

<div class="language-usage">
  {#if !browser}
    <ul class="lang-list pagewide">
      {#each languages as entry}
        <li class="lang-entry" style="--color:{entry.color};">
          <p class="name">{entry.name}</p>
          <p class="weight">{entry.weight.toPrecision(2)}%</p>
        </li>
      {/each}
    </ul>
  {:else if languages === null}
    <p>Missing language data! This is an error.</p>
  {:else if languages.length > 0}
    {#if LIMITS.is_mobile || LIMITS.is_webkit}
      <ul class="lang-list pagewide">
        {#each languages as entry}
          <li class="lang-entry" style="--color:{entry.color};">
            <p class="name">{entry.name}</p>
            <p class="weight">{entry.weight.toPrecision(2)}%</p>
          </li>
        {/each}
      </ul>
    {:else}
      <div class="labeled-donut center">
        <div class="donut">
          <Donut
            entries={languages}
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

  background-color var(--bg-accent)
  border solid 0.2rem var(--bg-light)
  border-radius 0.2rem

  .lang-entry
    display flex

    padding 0.5rem 1rem

    border-bottom solid 0.2rem var(--color)

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
      color var(--fg)

      padding 0

</style>
