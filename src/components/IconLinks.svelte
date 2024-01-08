<script context="module">
  /**
   * @typedef {Object} Entry
   * @prop {string} name
   * @prop {string} icon
   * @prop {string} url
   *
   * @typedef {Object.<string, Entry[]>} Data
   */
</script>

<script>
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import Icon from "./Icon.svelte";
  import LINKS from "$data/social.json";
  import { LIMITS } from "$lib/util";

  /**
   * @type {Data}
   */
  export const data = new Map(Object.entries(LINKS));

  /**
   * @type {HTMLUListElement}
   */
  let links = null;

  let display_width = 600;
  let max_width = 540;
  let short_width = 310;

  onMount(() => {
    const children_widths = Array.from(links?.children || []).map(
      (it) => it.getBoundingClientRect().width
    );

    short_width = Math.max(...children_widths);
    max_width = children_widths.reduce((sum, it) => sum + it, 0);

    window.addEventListener("resize", () => {
      display_width = document.body.clientWidth;
    });
    display_width = document.body.clientWidth;
  });
</script>

<ul
  bind:this={links}
  class="links"
  style={`flex-direction:${display_width >= max_width ? "row" : "column"};`}
>
  {#each [...data.keys()] as name}
    <li class={`bracket ${LIMITS.is_mobile ? "mobile" : ""}`}>
      <p>{name}</p>
      <ul
        class="icons"
        style={`flex-direction:${
          display_width >= short_width ? "row" : "column"
        };`}
      >
        {#each data.get(name) || [] as link}
          <li class="link">
            <a href={link.url} target="_blank" rel="noreferrer">
              {#if !browser}
                {link.name}
              {:else}
                <Icon size="2rem" name={link.icon} />
                <p>{link.name}</p>
              {/if}
            </a>
          </li>
        {/each}
      </ul>
    </li>
  {/each}
</ul>

<style lang="stylus">

ul.links
  display flex
  gap 1rem

  width min-content
  max-width 100%

  .bracket
    &:before
      content ""
      display block

      height 0.5em
      width 95%
      margin 0 auto
      margin-top 2rem
      margin-bottom -2.5rem

      border solid 0.15rem var(--bg-accent)
      border-bottom none

      transition border-color ease-in-out transition-long

    p
      font-family var(--fnt-rounded)
      font-weight bold
      color var(--fg)
      transition color ease-in-out transition-medium

    &:hover,
    .mobile
      &:before
        border solid 0.15rem var(--fg)
        border-bottom none
      p
        color var(--accent-7)

      .icons>li
        :global(svg path),
        :global(svg text)
          --icon-fill var(--fg)
          --icon-stroke var(--fg)
          transition fill ease-in-out transition-short, stroke ease-in-out transition-short

.icons
  display flex
  justify-content space-around

li.link
  :global(svg)
    margin 1rem
  :global(svg path),
  :global(svg text)
    --icon-fill var(--bg-light)
    --icon-stroke var(--bg-light)
    stroke-weight 0.15rem
    transition fill ease-in-out transition-medium, stroke ease-in-out transition-medium

  a
    display flex
    align-items center
    flex-direction column
    overflow-y hidden

    p
      display block
      background-color var(--bg-accent)
      padding 0.2rem
      border-radius 0.25rem

      opacity 0
      margin-top 2.5rem
      transition opacity ease-in-out transition-short, margin-top ease-in-out transition-short !important

  a:hover
    p
      opacity 1
      margin-top -0.5rem
    :global(.icon path),
    :global(.icon text)
      --icon-fill var(--accent-7) !important
      --icon-stroke var(--accent-7) !important
      transition fill ease-in-out transition-short
  a:active
    :global(.icon:active path),
    :global(.icon:active text)
      --icon-fill var(--accent-6) !important
      --icon-stroke var(--accent-6) !important

</style>
