<script>
  import { DEFAULT_LOCALE, getLocaleHighlights } from "../lib/project";
  import Icon from "./Icon.svelte";
  import RepoLink from "./RepoLink.svelte";
  import Spinner from "./Spinner.svelte";

  /**
   * @type {import("../lib/project".Project}
   */
  export let project;

  /**
   * @param {import("../lib/project".Project} project
   */
  function merge_color(project) {
    if (project.fork) {
      return "var(--clr-blue)";
    } else if (project.contribution) {
      if (!project.active) {
        return "var(--clr-green)";
      } else {
        return "var(--clr-yellow)";
      }
    }
  }

  async function getDescription() {
    return getLocaleHighlights(project, DEFAULT_LOCALE).join("<br>");
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
    <p class="description">
      {#await getDescription()}
        <Spinner size="2rem" />
      {:then description}
        {@html description}
      {:catch error}
        <p>Failed to load description.</p>
      {/await}
    </p>
    <div class="bg" />
    {#if project.url}
      <RepoLink link={project.url} />
    {/if}
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
        font-size 1.25rem

        width 100%

    .description
        grid-column-start 1
        grid-column-end 4
        background-color var(--bg)
        padding 0.5rem
        border-radius 0.5rem

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
