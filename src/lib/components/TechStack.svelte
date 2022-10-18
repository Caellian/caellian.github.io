<script lang="ts">
  import Icon from "./Icon.svelte";

  const stack = {
    Rust: {
      Rocket: "https://rocket.rs",
      glow: "https://github.com/grovesNL/glow",
      wgpu: "https://wgpu.rs",
      tracing: "https://tokio.rs/",
      bevy: "https://bevyengine.org/",
    },
    "JS/TS": {
      SvelteKit: "https://kit.svelte.dev/",
      Stylus: "https://stylus-lang.com/",
    },
  };
</script>

<ul class="stack">
  {#each Object.keys(stack) as s}
    <li>
      <h2>{s}</h2>
      <ul class="items">
        {#each Object.keys(stack[s]) as el}
          <li>
            <a href={stack[s][el]}>{el}</a>
          </li>
        {/each}
      </ul>
    </li>
  {/each}
</ul>

<style lang="stylus">
ul.stack
    display flex
    flex-wrap wrap
    justify-content center
    align-items flex-start

    @media screen and (min-width 300px)
        align-items flex-end

ul.stack>li
    display grid
    align-items center
    text-align center

    @media screen and (min-width 300px)
        width 40vw

        ul.items
            grid-area 1/1/2/2
        h2
            grid-area 2/1/3/2

ul.items
    display flex
    flex-direction row
    flex-wrap wrap
    align-content flex-start

    padding 0.5rem
    margin 1rem

    border 0.2rem solid var(--bg-accent)
    border-radius 0.2rem

ul.items>li
    display flex
    align-items center
    text-align center
    justify-content space-between
    flex-grow 1

    border-style solid
    border-width 0.2rem
    border-color var(--bg-accent)
    border-radius 0.2rem

    background-color var(--transparent)

    margin 0.2rem

    transition 200ms ease-in-out border-color, 200ms ease-in-out background-color
    box-sizing border-box

    a
        flex-grow 1
        padding 0.5rem
        font-family monospace

    &:hover
        background-color var(--bg-accent)
        border-color var(--accent-7)
</style>
