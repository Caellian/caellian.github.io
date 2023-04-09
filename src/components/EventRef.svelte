<script lang="ts">
  import MouseShine from "./MouseShine.svelte";
  import Spinner from "./Spinner.svelte";

  export var name: string;
  export var description: string;
  export var url: string | null | undefined = undefined;
  export var time: string | null;
</script>

<MouseShine>
  {#if url}
    <a class="container" href={url}>
      {#if time != null}
        <h4 style="grid-area: 1/1/2/2">{name}</h4>
        <p style="grid-area: 1/2/3/3" class="time">{time}</p>
      {:else}
        <h4 style="grid-area: 1/1/2/3">{name}</h4>
        <Spinner clazz="time" size="2rem" />
      {/if}
      <p style="grid-area: 2/1/3/3">{description}</p>
    </a>
  {:else}
    <div class="container">
      {#if time != null}
        <h4 style="grid-area: 1/1/2/2">{name}</h4>
        <p style="grid-area: 1/2/3/3" class="time">{time}</p>
      {:else}
        <h4 style="grid-area: 1/1/2/3">{name}</h4>
        <Spinner clazz="time" size="2rem" />
      {/if}
      <p style="grid-area: 2/1/3/3">{description}</p>
    </div>
  {/if}
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
  .time,
  :global(.spinner)
    grid-area: 1/2/3/3

  :global(*)
    pointer-events none

  h4
    font-family 'Quicksand', sans-serif
    font-size 1.4rem
    color var(--fg)

    padding 0

  p
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

    h4
      color var(--accent-7)

    &:before
      opacity 1

  &:active
    h4
      color var(--accent)

    p
      color var(--accent-7)

</style>
