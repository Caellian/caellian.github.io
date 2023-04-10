<script lang="ts">
  import { cssVars, LIMITS, Limits } from "$lib/util";
  import type Project from "$lib/project";
  import { onMount } from "svelte";

  export var project: Project = {
    id: "none",
    name: "None",
    tags: [],
    lang: "No lang",
    url: ".",
    description: [],
    active: false,
    contribution: false,
    fork: false,
  };

  function start_color(name: string) {
    let result = 0;
    for (let i = 0; i < name.length; i++) {
      result += name.charCodeAt(i);
    }
    return result % 360;
  }

  function color_rotation(name: string) {
    let result = 0;
    for (let i = 0; i < name.length; i++) {
      result += name.charCodeAt(i);
    }
    return 30 + (result % 150);
  }

  const from = start_color(project.id);
  const deg = color_rotation(project.id);

  const project_style = cssVars({
    bg_deg: `${deg}deg`,
    bg_from: `hsl(${from},50%,var(--accent-l))`,
    bg_to: `hsl(${from + 40},50%,var(--accent-l))`,
  });

  let container: HTMLDivElement;

  const t = (x: number, y: number) =>
    `perspective(20rem) rotateX(${x}deg) rotateY(${y}deg) `;

  onMount(() => {
    if (!LIMITS.is_mobile) {
      const child = container.firstElementChild as HTMLDivElement;

      container.onmousemove = (e) => {
        e.stopPropagation();
        const bounds = child.getBoundingClientRect();
        const center = {
          x: window.scrollX + bounds.left + bounds.width / 2,
          y: window.scrollY + bounds.top + bounds.height / 2,
        };

        window.requestAnimationFrame(() => {
          const offsetX = e.pageX - center.x;
          const offsetY = e.pageY - center.y;
          let x = (offsetX / bounds.width) * 4;
          let y = -(offsetY / bounds.height) * 4;

          child.style.transform = t(y, x);
        });
      };

      container.onmouseleave = (e) => {
        e.stopPropagation();
        window.requestAnimationFrame(() => {
          child.style.transform = t(0, 0);
        });
      };
    }
  });
</script>

<div bind:this={container} class="container">
  <div class="project" style={project_style}>
    <a href={project.url || "."} class="project-inner">
      <span class="lang">{project.lang}</span>
      <h1>{project.name}</h1>
      <div class="desc">
        {#each project.description as d}
          <p>{d}</p>
        {/each}
      </div>
      <ul class="tags">
        {#each project.tags as t}
          <li>{t}</li>
        {/each}
      </ul>
    </a>
  </div>
</div>

<style lang="stylus">
shaded = #0004

.project
  padding 0.25rem

  height fit-content
  width 25ch
  aspect-ratio 2.25/3.5
  margin auto

  background var(--bg-from)
  background linear-gradient(var(--bg-deg), var(--bg-from), var(--bg-to))
  border-radius 0.75rem

  transition transform ease-out transition-short

  &:hover
    transform scale(1.05)

.project-inner
  display grid
  grid-template-columns 1fr
  grid-template-rows repeat(2, auto) 1fr auto

  width 100%
  height 100%

  background transparent
  color var(--fg)

  transition background ease-in 200ms
  border-radius 0.75rem

  .lang
    grid-area 1 / 1 / 2 / 2

    background var(--bg-accent)

    @media (min-width: tablet-size)
      background shaded

    font-size 0.8rem
    text-align right

    padding 0.25rem 0.5rem 0.2rem 0
    border-radius 0.75rem 0.75rem 0 0

  h1
    grid-area 2 / 1 / 3 / 2

    width 100%
    color var(--fg)

    border-top 1px dashed var(--fg)
    border-bottom 1px dashed var(--fg)

    padding 0

    text-align center
    font-size 1.4rem

    transition color ease-in 200ms

  .desc
    grid-area 3 / 1 / 4 / 2

    padding 0.2rem 0.5rem
    overflow-y scroll

    background var(--bg-accent)

    @media (min-width: tablet-size)
      background shaded

    p
      margin 0
      text-align justify

  .tags
    grid-area 4 / 1 / 5 / 2

    padding 0.2rem

    border-top 1px dashed var(--fg)

    background var(--bg-accent)

    @media (min-width: tablet-size)
      background none

    &::before
      content "tags:"
      margin-right 0.2rem

    li
      display inline-block

      padding 0 0.1rem
      margin-right 0.2rem

      border 1px solid var(--bg-from)
      border-radius 0.25rem

      background shaded

  &:hover
    background var(--bg)

    h1
      color var(--accent)
</style>
