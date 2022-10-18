<script lang="ts">
  import { BUILD_DATE } from "$lib/build_time";
  import LanguageDonut from "$lib/components/LanguageUsage.svelte";
  import ProjectCard from "$lib/components/ProjectCard.svelte";

  import projects from "$lib/projects.json";
  import education from "$lib/official_education.json";
  import languages from "$lib/used_languages.json";
  import EventRef from "$lib/components/EventRef.svelte";
  import TechStack from "$lib/components/TechStack.svelte";
</script>

<main>
  <section id="hero">
    <div>
      <p>Hi, my name is</p>
      <h1><span class="name">Tin Švagelj</span>.</h1>
      <h2>I write fast,<br />bleeding-edge software.</h2>

      <p>
        I'm a software engineer based in Croatia who specializes in building
        desktop applications.
      </p>
      <p>
        Currently, I'm studying Information Technologies at University of
        Rijeka.
      </p>
    </div>
  </section>

  <section class="pagewide">
    <h1 class="title">About Me</h1>

    <p style="margin-bottom: 4vh;">
      Hello! My name is Tin and I love programming and testing undocumented and
      experimental libraries.
    </p>
  </section>

  <section class="pagewide">
    <h1 class="title">I'm Currently Working On</h1>

    {#each projects.filter((it) => it.active) as p}
      <ProjectCard project={p} />
    {/each}

    <div class="center block">
      <a class="button" href="/projects">See More</a>
    </div>
  </section>

  <section class="pagewide">
    <h1 class="title">Official Education</h1>

    {#each education as edu}
      <EventRef
        name={edu.name}
        description={edu.degree}
        time={edu.completion}
        url={edu.url}
      />
    {/each}
  </section>

  <section class="pagewide">
    <h1 class="title">Tech Stack</h1>
    <p>Here's a list of technologies I'm up to speed with:</p>

    <TechStack />
  </section>

  {#if languages.length > 1}
    <section class="pagewide current-langs">
      <h1 class="title">Languages I'm Currently Using</h1>

      <div class="donut center">
        <LanguageDonut />
      </div>

      <p>
        Languages used within last 30 days collected using <a
          href="https://activitywatch.net/">Activity Watch</a
        >; last updated {BUILD_DATE}.
      </p>
    </section>
  {/if}
</main>

<style lang="stylus">
@import '../style/constants'

section
    padding 2vh 0
    margin 0 auto

    .block
        padding 1rem

    @media screen and (min-width: tablet-size)
        padding 15vh 0

        > *
            padding-left 2rem
            padding-right 2rem
        .title
            padding-left 0
            padding-right 0

#hero
    display grid
    grid-template-columns 1rem 1fr 1rem
    place-items center

    @media screen and (min-width: 1050px)
        grid-template-columns 1fr 3fr 3fr

    min-height calc(100vh - var(--nav-height) + 0.5rem)
    height fit-content

    margin-bottom 10vh

    background-image radial-gradient(var(--bg-accent) 0.12rem, transparent 0)
    background-attachment fixed
    background-size 4rem 4rem

    border-bottom solid 0.15rem var(--bg-accent)

    div
        grid-area 1 / 2 / 2 / 3

        margin-bottom 1rem

        h1
            margin-bottom 2rem

            font-size 4rem
            color var(--fg)

        h2
            font-size 2rem
            color var(--accent)

            &:hover
                color var(--accent)

        p
            margin 0

        .name
            color var(--accent)

            transition color ease-in-out transition-short
            &:hover
                color var(--fg)

.current-langs
    .donut
        margin 2rem 0
</style>
