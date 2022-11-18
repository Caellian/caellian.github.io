<script lang="ts">
  import { openUrl } from "$lib/util";
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

  var pos = [0, 0];
  var item_pos: number[] | null = null;

  function on_mousemove(ev: MouseEvent) {
    if (
      ev.target != null &&
      (ev.target as HTMLElement).tagName.toUpperCase() == "A"
    ) {
      let parent = (
        (ev.target as HTMLElement).parentElement as Element
      ).getBoundingClientRect();
      pos = [ev.clientX - parent.x, ev.clientY - parent.y];
      item_pos = [ev.offsetX, ev.offsetY];
    } else {
      pos = [ev.offsetX, ev.offsetY];
      item_pos = null;
    }
  }
</script>

<ul class="stack">
  {#each Object.keys(stack) as s (s)}
    <li>
      <h2>{s}</h2>
      <div
        class="items"
        on:mousemove={on_mousemove}
        style="--pos-x:{pos[0]}px;--pos-y:{pos[1]}px;"
      >
        {#each Object.keys(stack[s]) as el (el)}
          <a
            class="item button"
            href={stack[s][el]}
            style={item_pos != null
              ? `--pos-x:${item_pos[0]}px;--pos-y:${item_pos[1]}px;`
              : ""}
            rel="noreferrer"
            target="_blank"
          >
            {el}
          </a>
        {/each}
      </div>
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

  border 0.15rem solid var(--bg-light)
  border-radius 0.25rem
  margin 0.25rem
  padding 0.5rem

  h2
    font-size 1.25rem
    padding 0.25rem

  @media screen and (min-width 300px)
    width 40vw

    ul.items
      grid-area 1/1/2/2
    h2
      grid-area 2/1/3/2

.items
  display flex
  flex-direction row
  flex-wrap wrap
  align-content flex-start
  gap 0.5rem

  padding 0.5rem

  border 0.2rem solid var(--bg-accent)
  border-radius 0.2rem

a.item
  &.button
    flex-grow 1

    background-color var(--transparent)

    padding 0.2rem
    border-radius 0.2rem

    transition border-color ease-in-out 200ms, background ease-in-out 200ms
    box-sizing border-box

    &:hover
      background radial-gradient(circle at var(--pos-x) var(--pos-y), var(--accent-2) 0%, var(--accent-1) 50%)
      transition background ease-in-out 200ms

    &:active
      background radial-gradient(circle at var(--pos-x) var(--pos-y), var(--accent-4) 0%, var(--accent-2) 50%)

.items
  position relative

  &:before
    position absolute
    top 0
    left 0
    z-index -10

    display block

    content ""
    width 100%
    height 100%
    background radial-gradient(circle at var(--pos-x) var(--pos-y), var(--bg-light) 0%, transparent 50%)

    transition opacity ease-out 200ms
    opacity 0

  &:hover:before
    opacity 1

</style>
