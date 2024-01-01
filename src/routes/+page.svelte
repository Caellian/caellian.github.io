<script>
  import LanguageDonut from "$components/LanguageUsage.svelte";
  import ProjectCard from "$components/ProjectCard.svelte";

  import projects from "$data/projects.json";
  //import jobs from "$data/job_history.json";
  import education from "$data/official_education.json";
  import languages from "$data/used_languages.json";
  import EventRef from "$components/EventRef.svelte";
  import About from "$content/About.svx";
  import { BUILD_DATE, LIMITS } from "$lib/util";

  const active_projects = projects.filter((it) => it && it.active);

  import "../style/global.styl";
</script>

<main>
  <section id="hero">
    <img src="/profile.png" alt="profile" />
    <div class="wrapper">
      <span>
        <p>Hi, my name is</p>
        <h1><span class="name">Tin Švagelj</span>.</h1>
        <h2>I write fast,<br />well-behaved software.</h2>

        <p>
          I'm a software developer based in Croatia who loves graphics
          programming.
        </p>
        <p>
          Currently, I'm studying Information Technologies at University of
          Rijeka.
        </p>
      </span>
    </div>

    {#if !LIMITS.is_mobile}
      <div class="bg-layer" />
      <div class="bg-layer" />
      <div class="bg-layer" />
    {/if}
  </section>

  <section class="pagewide">
    <About />
    <a class="hidden" rel="me" href="https://mastodon.social/@caellian"
      >Mastodon</a
    >
  </section>

  {#if active_projects.length > 0}
    <section class="pagewide current">
      <h1 class="title">Personal Projects</h1>

      <div class="cards">
        {#each projects.filter((it) => it && it.active) as p}
          <ProjectCard project={p} />
        {/each}
      </div>

      <a class="button" href="/projects">See More</a>
    </section>
  {/if}

  <!--<section class="pagewide">
    <h1 class="title">Employment History</h1>

    <ul class="event-list">
      {#each jobs as job}
        <li>
          <EventRef
            name={job.name}
            description={job.desc}
            time={job.duration}
          />
        </li>
      {/each}
    </ul>
  </section>-->

  <section class="pagewide">
    <h1 class="title">Official Education</h1>

    <ul class="event-list">
      {#each education as edu}
        <li>
          <EventRef
            name={edu.name}
            description={edu.degree}
            time={edu.completion}
            url={edu.url}
          />
        </li>
      {/each}
    </ul>
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
        >, last updated {BUILD_DATE}.
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
  display flex
  flex-direction column
  justify-content space-evenly
  place-items center

  min-height calc(100vh - var(--nav-height) + 0.5rem)
  height max-content
  max-width 100%
  padding 0
  padding-inline 1ch
  margin-bottom 10vh

  overflow hidden
  border-bottom solid 0.15rem var(--bg-accent)

  @media screen and (min-width: desktop-size)
    display grid
    padding-block 0
    grid-template-columns 1fr 3fr 2fr 2fr 1fr

  .bg-layer
    display none

    @media screen and (min-width: desktop-size)
      display block
      margin 0
      padding 0
      width 100vw
      height 100vh
      z-index -100

      --dots-color var(--accent) 
      background-image radial-gradient(var(--dots-color) 0.12rem, transparent 0)
      background-position 50% 50%
      background-attachment fixed
      background-size 5rem 5rem
      transition background-size ease-in-out transition-medium
  
  img[alt="profile"]
    width 10rem
    width @css{max(15vw, 10rem)}
    aspect-ratio 1 / 1
    border-radius 100%
    padding 0.5rem
    margin 1rem
    outline solid 2px var(--accent)

    @media screen and (min-width: tablet-size)
      grid-area 1 / 4 / 2 / 5

  .wrapper
    display grid
    align-items center
    grid-area 1 / 2 / 2 / 3
    height 100%

    @media screen and (min-width: tablet-size)
      padding 1.5rem
    @media screen and (min-width: desktop-size)
      backdrop-filter blur(1px)
      background-color @css { hsla(0, 0%, var(--bg-light-l), 0.3) }

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
      max-width 60ch

    .name
      color var(--accent)
      transition color ease-in-out transition-short

      &:hover
        color var(--fg)
  
  .bg-layer
    grid-row 1 / 2
    grid-column 1 / -1

  @media screen and (min-width: tablet-size)
    >div:nth-child(1 of .bg-layer)
      --dots-color var(--accent-3)
    >div:nth-child(2 of .bg-layer)
      --dots-color var(--accent-4)
    >div:nth-child(3 of .bg-layer)
      --dots-color var(--accent-5)

    .wrapper
      transition background-color transition-medium ease-in-out, backdrop-filter transition-medium ease-in-out

    &:hover
      >div:nth-child(1 of .bg-layer)
        background-size 3.25rem 3.25rem
      >div:nth-child(2 of .bg-layer)
        background-size 3.5rem 3.5rem
      >div:nth-child(3 of .bg-layer)
        background-size 3.75rem 3.75rem

    @media screen and (min-width: desktop-size)
      &:hover
        .wrapper
          backdrop-filter blur(4px)
          background-color @css { hsla(0, 0%, var(--bg-light-l), 0.5) }

section.current a
  margin 1rem auto

.cards
  display flex
  flex-wrap wrap
  gap 1rem
  justify-content center

.event-list
  display flex
  flex-direction column
  gap 1rem

.current-langs
  .donut
    margin 2rem 0
</style>
