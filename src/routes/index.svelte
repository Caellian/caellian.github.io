<script lang="ts">
  import Project from "$lib/components/FrontProject.svelte";
  import LanguageDonut from "$lib/components/LanguageUsage.svelte";

  import Timeline from "$lib/components/Timeline.svelte";
  import type { TimelineItem } from "$lib/components/Timeline.svelte";

  import Expand from "$lib/components/Expand.svelte";

  import projects from "$lib/projects.json";

  import timelineSource from "$lib/timeline.json";
  import EntryAnimation from "$lib/components/EntryAnimation.svelte";
import { Direction } from "$lib/animation";

  let timelineItems: TimelineItem[] = timelineSource as TimelineItem[];
</script>

<section id="hero">
  <div>
    <EntryAnimation duration={1000} direction={Direction.Left}>
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
    </EntryAnimation>
  </div>
</section>

<EntryAnimation>
  <section class="container pagewide">
    <h1 class="title">About Me</h1>

    <p style="margin-bottom: 4vh;">
      Hello! My name is Tin and I love programming and testing undocumented and
      experimental libraries.
    </p>

    <Expand>
      <Timeline items={timelineItems} />
      <span slot="button">Expand timeline</span>
    </Expand>
  </section>
</EntryAnimation>

<EntryAnimation>
  <section class="container pagewide">
    <h1 class="title">Projects I'm Working On</h1>

    {#each projects.active as p}
      <Project name={p.name} description={p.description[0]} link={p.url} />
    {/each}

    <div class="center block">
      <a class="button" href="/projects">See More</a>
    </div>
  </section>
</EntryAnimation>

<EntryAnimation>
<section class="container pagewide current-langs">
  <h1 class="title">What I'm Currently Using</h1>

  <p>
    As I love experimenting with different technology stacks, my preferences
    change frequently and thus the programming language I feel most comfortable
    with.
  </p>

  <div class="donut center">
    <LanguageDonut />
  </div>

  <p>
    Languages used within last 30 days; provided by
    <a href="https://wakatime.com">WakaTime</a>.
  </p>
</section>
</EntryAnimation>

<style lang="stylus">
	@import '../style/constants'

	.container
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

		@media screen and (min-width: 800px)
			grid-template-columns 1fr 3fr 3fr

		min-height calc(100vh - var(--nav-height))
		height calc(100vh - var(--nav-height))

		margin-bottom 10vh

		background-image radial-gradient(var(--bg-accent) 0.12rem, transparent 0)
		background-attachment fixed
		background-size 4rem 4rem

		border-bottom border-style

		div
			grid-area 1 / 2 / 2 / 3

			margin-bottom 1rem

			h1
				margin-bottom 2rem

				font-size 4rem
				color var(--text)

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
					color var(--text)

.current-langs
	.donut
		margin 2rem 0
</style>
