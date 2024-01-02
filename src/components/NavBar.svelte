<script>
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import Compass from "./Compass.svelte";
  import NavLinks from "./NavLinks.svelte";
  import SchemeSwitch from "./SchemeSwitch.svelte";

  export let navigate = false;

  /**
   * @param {boolean} [force]
   */
  function toggleNavigate(force = undefined) {
    return () => {
      if (force != null) {
        navigate = force;
      } else {
        navigate = !navigate;
      }
    };
  }

  /**
   * @type {MediaQueryList}
   */
  let compact_layout_query = null;
  let compact_layout = false;

  function handleQueryChange() {
    if (!compact_layout_query) return;
    compact_layout = compact_layout_query.matches;
  }

  onMount(() => {
    compact_layout_query = window.matchMedia("(max-width: 770px)");
    compact_layout = compact_layout_query.matches;
    compact_layout_query.addEventListener("change", handleQueryChange);
  });
</script>

<nav id="navbar" class:fixed={navigate} class:compact={compact_layout}>
  <a href="/" class="name"><h1>tinsvagelj<span>::</span>net</h1></a>
  <div class="spacer" />

  {#if !compact_layout}
    <ul id="nav-links">
      <NavLinks />
    </ul>
  {/if}

  {#if browser && compact_layout}
    <Compass
      on:mouseup={toggleNavigate()}
      color={navigate ? "var(--accent)" : "var(--fg)"}
      spin={navigate}
    />
  {/if}
  <SchemeSwitch />
</nav>

{#if browser && compact_layout}
  <ul id="mobile-links" class:navigate>
    <NavLinks on:click={toggleNavigate(false)} />
  </ul>
{/if}

{#if navigate}
  <style>
    #portfolio {
      height: 100vh;
      height: 100svh;
      overflow: hidden;
    }
    .layout-root {
      display: none;
    }
  </style>
{/if}

<style lang="stylus">
#navbar
  display flex
  align-items flex-end

  width 100vw
  height var(--nav-height)
  background var(--bg)

  border-bottom solid 0.15rem var(--bg-accent)
  z-index 1000

  padding 0.2rem 1rem

  &.fixed
    position fixed
    top 0
    left 0

  a.name
    height min-content
    width max-content

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

#navbar :global(.compass)
  position absolute
  top 0
  right 0

  width var(--nav-height)
  height var(--nav-height)

  padding 0.6rem 0.5rem 0.4rem 0.5rem

  border-left solid 0.2rem var(--bg-accent)

#nav-links
  display flex
  justify-content space-around
  align-items flex-start
  margin-bottom 0.5rem

  height calc(100% - 2rem)

  :global(li>a)
    padding-right 1rem

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

#navbar.compact :global(#scheme-toggle)
  display none
  position absolute
  top calc(var(--nav-height) + 1rem)
  right 1rem
  z-index 200

#navbar.compact.fixed :global(#scheme-toggle)
  display block

#mobile-links
  visibility collapse
  opacity 0

  display flex
  flex-direction column
  justify-content space-around
  align-items center

  font-family Quicksand
  background var(--bg)
  text-align center

  position fixed
  top var(--nav-height)
  left 0
  width 100vw
  width 100svw
  height 100vh
  height calc(100vh - var(--nav-height))
  height calc(100svh - var(--nav-height))
  z-index -100

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
    z-index 100
    opacity 1
</style>
