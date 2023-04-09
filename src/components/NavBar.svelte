<script lang="ts">
  import { browser } from "$app/environment";
  import Compass from "./Compass.svelte";
  import NavLinks from "./NavLinks.svelte";

  export let navigate = false;

  function toggleNavigate(force: boolean | undefined = undefined) {
    return () => {
      if (force != null) {
        navigate = force;
      } else {
        navigate = !navigate;
      }
    };
  }
</script>

<nav id="navbar" class:fixed={navigate}>
  <a href="/" class="name"><h1>caellian<span>::</span>me</h1></a>

  <ul id="nav-links">
    <NavLinks />
  </ul>

  {#if browser}
    <Compass
      on:mouseup={toggleNavigate()}
      color={navigate ? "var(--accent)" : "var(--fg)"}
      spin={navigate}
    />
  {/if}
</nav>

{#if browser}
  <ul id="mobile-links" class:navigate>
    <NavLinks on:click={toggleNavigate(false)} />
  </ul>
{/if}

{#if navigate}
  <style>
    #portfolio {
      height: 100vh;
      overflow: hidden;
    }
  </style>
{/if}

<style lang="stylus">
#navbar
  display flex
  justify-content space-between
  align-items flex-end

  width 100vw
  height var(--nav-height)
  background var(--bg)

  border-bottom solid 0.15rem var(--bg-accent)
  z-index 1000

  &.fixed
    position fixed
    top 0
    left 0

  a.name
    padding 0.2rem 1rem
    height min-content
    width max-content
    flex-shrink 1
    flex-basis 0

    h1
      padding 0

      z-index 2

      font-size 2rem
      color var(--fg)

      transition color transition-short

      span
        color var(--accent)

        transition color transition-short
      &:hover
        color var(--accent)

        span
          color var(--fg)

:global(#navbar>.compass)
  min-width var(--nav-height)
  height var(--nav-height)

  padding 0.6rem 0.5rem 0.4rem 0.5rem

  border-left solid 0.2rem var(--bg-accent)
  cursor pointer // Not really needed, but hey, it's here

  @media screen and (min-width: 690px)
    display none

#nav-links
  display flex
  justify-content space-around
  align-items flex-start

  margin-top 2rem

  height calc(100% - 2rem)

  @media screen and (max-width 690px)
    display none

:global(#nav-links>li>a)
    padding-right 1rem
    margin-bottom 0.5rem

    font-family 'Quicksand', sans-serif
    font-size 1.5rem
    color var(--fg)

    &:hover
      color var(--accent-7)
    &:active
      color var(--accent)
    &:after
      visibility hidden

      content '_'
      font-weight bold

      animation blinking transition-medium steps(2, start) infinite

:global(#nav-links>li.current>a)
  color var(--accent)

  &:hover
    color var(--accent)
  &:after
    visibility visible

@keyframes blinking
    to
        visibility hidden

#mobile-links
  visibility collapse
  opacity 0

  display flex
  flex-direction column
  justify-content space-around
  align-items center

  font-family Quicksand
  background var(--bg)

  position fixed
  top var(--nav-height)
  left 0
  width 100vw
  height calc(100vh - var(--nav-height))
  z-index -100

  text-align center

  @media screen and (min-width: mobile-size)
    display none

  :global(li)
    display block
    width max-content

  :global(li>a)
    font-family 'Quicksand', sans-serif
    color var(--fg)
    font-size 1.3rem

    padding 0.5rem

  :global(li.current>a)
    border-bottom solid 0.2rem var(--accent-7)
    color var(--accent-7)
  :global(li:active>a)
    border-color var(--accent)
    color var(--accent)

  &.navigate
    visibility visible
    z-index 1000
    opacity 1
</style>
