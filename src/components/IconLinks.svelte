<script context="module" lang="ts">
  export interface Entry {
    name: string;
    icon: string;
    url: string;
  }

  export type Data = Map<string, Array<Entry>>;
</script>

<script lang="ts">
  import { browser } from "$app/environment";
  import Icon from "./Icon.svelte";

  export const data: Data = new Map([
    [
      "Social",
      [
        {
          name: "Telegram",
          icon: "telegram",
          url: "tg://resolve?domain=caellian",
        },
        {
          name: "Mastodon",
          icon: "mastodon",
          url: "https://mastodon.social/@caellian",
        },
        {
          name: "matrix.org",
          icon: "matrix",
          url: "https://matrix.to/#/@caellian:matrix.org",
        },
        {
          name: "LinkedIn",
          icon: "linkedin",
          url: "https://www.linkedin.com/in/tinsvagelj/",
        },
      ],
    ],
    [
      "Code",
      [
        {
          name: "GitHub",
          icon: "github",
          url: "https://github.com/Caellian",
        },
        {
          name: "BitBucket",
          icon: "bitbucket",
          url: "https://bitbucket.org/Caellian",
        },
        {
          name: "GitLab",
          icon: "gitlab",
          url: "https://gitlab.com/Caellian",
        },
      ],
    ],
  ]);
</script>

<ul class="links">
  {#each [...data.keys()] as name}
    <li class="bracket">
      <p>{name}</p>
      <ul class="icons">
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
  flex-direction column

  width min-content
  max-width 100%

  @media screen and (min-width 450px)
    flex-direction row

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
      font-family "Quicksand", sans-serif
      font-weight bold
      color var(--fg)
      transition color ease-in-out transition-medium

    &:hover
      &:before
        border solid 0.15rem var(--fg)
        border-bottom none
      p
        color var(--accent-7)

      .icons>li
        :global(svg path),
        :global(svg text)
          fill var(--fg)
          stroke-opacity 0
          transition fill ease-in-out transition-short

.icons
  display flex
  flex-direction column
  justify-content space-around

  @media screen and (min-width 250px)
    flex-direction row

li.link
  :global(svg)
    margin 1rem
  :global(svg path),
  :global(svg text)
    fill var(--bg-light)
    stroke #fff5
    stroke-weight 0.15rem
    transition fill ease-in-out transition-medium, stroke-opacity ease-in-out transition-medium

  a
    display flex
    align-items center
    flex-direction column
    overflow-y hidden

    p
      display block
      background var(--bg-accent)
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
      fill var(--accent-7) !important
      stroke var(--accent-7) !important
      stroke-opacity 0
      transition fill ease-in-out transition-short
  a:active
    :global(.icon:active path),
    :global(.icon:active text)
      fill var(--accent-6) !important
      stroke var(--accent-6) !important

</style>
