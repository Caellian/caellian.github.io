<script lang="ts">
  import type Project from "$lib/project";
  import Icon from "./Icon.svelte";
  import RepoLink from "./RepoLink.svelte";

  export let project: Project;

  function merge_color(project: Project) {
    if (project.fork) {
      return "var(--blue)";
    } else if (project.contribution) {
      if (!project.active) {
        return "var(--green)";
      } else {
        return "var(--yellow)";
      }
    }
  }
</script>

{#if project != null}
  <li>
    <a class="title" href={project.url}>
      {project.name}
    </a>
    {#if project.contribution || project.fork}
      <div class="merge-status">
        <Icon size="2rem" name="merge" color={merge_color(project)} />
      </div>
    {/if}
    <p class="description">{@html project.description.join("<br>")}</p>
    <div class="bg" />
    <RepoLink link={project.url} />
  </li>
{/if}

<style lang="stylus">
li
    display grid
    position relative

    grid-template-columns auto 1fr auto
    grid-template-rows auto
    justify-items end
    gap 0.5rem

    padding 1rem

    border 0.1rem solid var(--accent)
    border-radius 0.5rem
    transition opacity 200ms ease-in

    .title
        grid-column-start 1
        grid-column-end 3

        width 100%

    .description
        grid-column-start 1
        grid-column-end 4

    .bg
        position absolute
        top 0
        left 0
        z-index -1

        width 100%
        height 100%

        border-radius 0.5rem

        background repeating-linear-gradient(45deg, transparent, transparent 0.2rem, var(--bg-light) 3px, var(--bg-light) 5px, transparent 6px)
        opacity 0
        transition opacity 200ms ease-in

    :global(.repo-link)
        grid-column-start 3

    .merge-status
        :global(.icon)
            margin-left auto

    &:hover
        border 0.1rem solid var(--accent-7)
        .bg
            opacity 1

</style>
