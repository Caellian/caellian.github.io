<script lang="ts">
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
    <div class="wrapper">
      <p>Hi, my name is</p>
      <h1><span class="name">Tin Švagelj</span>.</h1>
      <h2>I write fast,<br />well-behaved software.</h2>

      <p>
        I'm a software engineer based in Croatia who specializes in building
        desktop applications.
      </p>
      <p>
        Currently, I'm studying Information Technologies at University of
        Rijeka.
      </p>
    </div>

    <div class="bg-layer"></div>
    <div class="bg-layer"></div>
    <div class="bg-layer"></div>
  </section>

  <section class="pagewide">
    <h1 class="title">About Me</h1>

    <p>Hello! My name is Tin and I like developing desktop applications and graphics software.</p>
    <p>My current area of interest is WASM+WGPU rendering.</p>
    <p>I'm available for hire and contracting.</p>
  </section>

  <section class="pagewide current">
    <h1 class="title">I'm Currently Working On</h1>

    <div class="cards">
      {#each projects.filter((it) => it && it.active) as p}
        <ProjectCard project={p} />
      {/each}
    </div>

    <a class="button" href="/projects">See More</a>
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
        >.
      </p>
    </section>
  {/if}
</main>

<style lang="stylus">
main
  width 100vw

section
  padding 2vh 0
  margin 0 auto

  @media screen and (min-width: tablet-size)
    padding 15vh 0

    > *
      padding-left 2rem
      padding-right 2rem
    .title
      padding-left 0
      padding-right 0

#hero
  position relative
  display grid
  grid-template-columns 1rem 1fr 1rem
  place-items center

  min-height calc(100vh - var(--nav-height) + 0.5rem)
  height max-content
  padding 0
  margin-bottom 10vh

  overflow hidden
  border-bottom solid 0.15rem var(--bg-accent)

  .bg-layer
    display block
    margin 0
    padding 0
    width 100vw
    height 100vh
    z-index -100

    background-image radial-gradient(var(--dots-color) 0.12rem, transparent 0)
    background-position 50% 50%
    background-attachment fixed
    transition background-size ease-in-out transition-medium

  div
    grid-area 1 / 2 / 2 / 3

  .wrapper
    margin-bottom 1rem

    background-color hsla(0, 0%, 0%, 0.2)
    padding 2rem
    border-radius 1rem

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

  @media screen and (min-width: 1050px)
    grid-template-columns 1fr 3fr 3fr

  @media screen and (min-width: tablet-size)
    :nth-child(2).bg-layer
      --dots-color var(--accent-1)
      background-size 3rem 3rem
    :nth-child(3).bg-layer
      --dots-color var(--accent-2)
      background-size 3.5rem 3.5rem
    :nth-child(4).bg-layer
      --dots-color var(--accent-3)
      background-size 4rem 4rem

    .wrapper
      transition background-color transition-medium ease-in-out

    &:hover
      .bg-layer
        background-size 5rem 5rem

      .wrapper
        background-color hsla(0, 0%, 0%, 0.6)
section.current a
  margin 1rem auto

.cards
  display flex
  flex-wrap wrap
  gap 1rem

.current-langs
  .donut
    margin 2rem 0
</style>
