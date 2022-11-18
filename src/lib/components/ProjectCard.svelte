<script lang="ts">
  import { cssVars } from "$lib/util";
  import type Project from "$lib/project";

  const from = Math.floor(Math.random() * 360);
  const to = from + Math.floor(Math.random() * 30) + 30;
  const deg = Math.floor(Math.random() * 150) + 30;

  const project_style = cssVars({
    bg_deg: `${deg}deg`,
    bg_from: `hsl(${from},50%,45%)`,
    bg_to: `hsl(${to},50%,45%)`
  });

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
</script>

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
    scrollbar-color var(--scroll-color) var(--bg-light)

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
