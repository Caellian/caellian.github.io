<script>
  import MouseShine from "./MouseShine.svelte";
  import Spinner from "./Spinner.svelte";

  export var name;
  export var description;
  export var url = undefined;
  export var time;
</script>

<MouseShine>
  <svelte:element this={url ? "a" : "div"} href={url} class="container">
    <p style="grid-area: 1/1/2/2" aria-label="event title">
      {name}
    </p>
    {#if time != null}
      <p style="grid-area: 1/2/3/3" aria-label="end time">{time}</p>
    {:else}
      <Spinner clazz="time" size="2rem" />
    {/if}
    <p style="grid-area: 2/1/3/3" aria-label="description">{description}</p>
  </svelte:element>
</MouseShine>

<style lang="stylus">
.container
  display grid
  position relative

  grid-template-columns 1fr auto
  grid-template-rows auto 1fr
  grid-column-gap 2rem
  align-items center

  padding 1rem 0.5rem

  border 0.2rem solid var(--bg-accent)
  border-radius 0.25rem
  background transparent

  transition background-color ease-in-out transition-medium, border-color ease-in-out transition-short

  @media screen and (min-width mobile-size)
    padding 1rem 2.5rem
  [aria-label="end time"],
  :global(.spinner)
    grid-area: 1/2/3/3

  :global(*)
    pointer-events none

  [aria-label="event title"]
    font-family 'Quicksand', sans-serif
    font-size 1.4rem
    color var(--fg)
    padding 0

  [aria-label="description"]
    font-size 1rem
    padding 0
    width max-content

  &:before
    position absolute
    top 0
    left 0
    z-index -10

    display block

    content ""
    width 100%
    height 100%
    
    transition opacity ease-out 200ms
    opacity 0

  &:hover
    border-color var(--accent)

    [aria-label="event title"]
      color var(--accent-4)
    [aria-label="description"]
      color var(--accent-3)

    &:before
      opacity 1

  &:active
    [aria-label="event title"]
      color var(--accent-3)
    [aria-label="description"]
      color var(--accent-2)

</style>
