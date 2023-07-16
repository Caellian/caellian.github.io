<script lang="ts">
  import { browser } from "$app/environment";
  import Icon from "$components/Icon.svelte";
  import ProjectResult from "$components/ProjectResult.svelte";
  import type Project from "$lib/project";
  import projects from "$data/projects.json";
  import { deboundce } from "$lib/util";
  import { onMount } from "svelte";

  let tags: string[] = [];

  let results: Project[] = projects;
  let shown_langs: string[] = show_languages();
  let shown_tags: string[] = show_tags();

  let show_filters = true;
  let search_query = "";

  const MAX_TAGS = 12;

  function toggle_tag(tag: string) {
    return () => {
      if (tags.find((it) => it == tag) != undefined) {
        tags = tags.filter((it) => it != tag);
      } else {
        tags.push(tag);
        tags = tags;
      }
      update_results();
    };
  }

  let scroll_value = 0;
  let result_list_el: HTMLUListElement;

  function update_results() {
    results = get_results();
    shown_langs = show_languages();
    shown_tags = show_tags();

    let rect = result_list_el.getBoundingClientRect();
    scroll_value = Math.min(scroll_value, rect.height);
  }

  function show_languages() {
    const s: Set<string> = new Set();

    for (const proj of results) {
      s.add(proj.lang);
    }
    for (const lang of get_tag_langs()) {
      s.add(lang);
    }

    const result = Array.from(s);
    result.sort((a, z) => a.localeCompare(z));
    return result;
  }

  function show_tags() {
    const s: Map<string, number> = new Map();

    for (const proj of results) {
      for (const tag of proj.tags) {
        s.set(tag, (s.get(tag) || 0) + 1);
      }
    }

    const sorted = [...s.entries()]
      .sort((a, z) => z[1] - a[1])
      .slice(0, MAX_TAGS);
    const result = [...new Map(sorted).keys()];
    result.sort((a, z) => a.localeCompare(z));
    return result;
  }

  function get_tag_langs(): string[] {
    return Array.from(
      tags.filter((it) => it.startsWith("lang:")).map((it) => it.substring(5))
    );
  }
  function get_tags(): string[] {
    return Array.from(
      tags.filter((it) => it.startsWith("tag:")).map((it) => it.substring(4))
    ).sort((a, b) => b.localeCompare(a));
  }

  function find_words(words: string[], text: string | string[]) {
    if (Array.isArray(text)) {
      const joined = text.join(" ").toLowerCase();
      return words.filter((word) => joined.includes(word)).length > 0;
    } else {
      text = text.toLowerCase();
      return words.filter((word) => text.includes(word)).length > 0;
    }
  }

  function get_results(): Project[] {
    const words = search_query
      .toLowerCase()
      .trim()
      .replace(/[ \t]+/, " ")
      .split(" ");

    if (tags.length == 0 && words.length == 0) {
      return projects;
    }

    let result: Project[] = [];

    const active = tags.includes("active");
    const project = tags.includes("project");
    const contrib = tags.includes("contrib");
    const fork = tags.includes("fork");
    const any_kind = !project && !contrib && !fork;

    const langs = get_tag_langs();
    const clean_tags = get_tags();

    for (const proj of projects) {
      const active_ = !active || proj.active;
      const contrib_ = contrib && proj.contribution;
      const fork_ = fork && proj.fork;
      const project_ = project && !proj.contribution && !proj.fork;

      const lang_ = langs.length == 0 || langs.includes(proj.lang);
      const tags_ =
        clean_tags.length == 0 ||
        clean_tags
          .map((tag) => proj.tags.includes(tag))
          .reduce((prev, curr) => prev && curr);

      if (
        active_ &&
        (project_ || contrib_ || fork_ || any_kind) &&
        lang_ &&
        tags_
      ) {
        result.push(proj);
      }
    }

    result = result.filter(
      (p) =>
        words.length == 0 ||
        find_words(words, p.name) ||
        find_words(words, p.description) ||
        find_words(words, p.tags) ||
        find_words(words, p.lang)
    );

    return result;
  }

  function clear_query() {
    console.log("Clickeded");
    search_query = "";
  }

  onMount(() => {
    window.addEventListener("scroll", () => {
      const nav = document.querySelector("nav#navbar");

      let content_bounds = result_list_el.getBoundingClientRect();

      scroll_value = Math.min(
        Math.max(window.scrollY - (nav?.clientHeight || 0) - 4, 0),
        content_bounds.height
      );
    });
  });
</script>

<div class="content-wrapper">
  {#if browser}
    <aside class="filters" style="--scroll-y:{Math.round(scroll_value)}px">
      <section class="search row">
        <div class="search" class:ready={search_query.trim().length > 0}>
          {#if search_query.trim().length == 0}
            <Icon name="search" size="2rem" />
          {/if}
          <input
            type="text"
            bind:value={search_query}
            on:keyup={deboundce(update_results)}
          />
          {#if search_query.trim().length > 0}
            <div
              class="clear-query-button"
              on:click={clear_query}
              on:keyup={clear_query}
            >
              <Icon name="remove" size="2rem" />
            </div>
          {/if}
        </div>
        <button on:click={() => (show_filters = !show_filters)}>
          {#if show_filters}
            <p>i</p>
          {:else}
            <Icon name="filter" size="2.5rem" />
          {/if}
        </button>
      </section>

      {#if show_filters}
        <section>
          <p>Category:</p>
          <ul class="choices">
            <li
              on:mouseup={toggle_tag("active")}
              class:active={tags.includes("active")}
            >
              <Icon name="remove" size="1.4rem" color="var(--accent)" />
              <p>Current</p>
            </li>
            <li
              on:mouseup={toggle_tag("project")}
              class:active={tags.includes("project")}
            >
              <Icon name="remove" size="1.4rem" color="var(--accent)" />
              <p>Project</p>
            </li>
            <li
              on:mouseup={toggle_tag("contrib")}
              class:active={tags.includes("contrib")}
            >
              <Icon name="remove" size="1.4rem" color="var(--accent)" />
              <p>Contribution</p>
            </li>
            <li
              on:mouseup={toggle_tag("fork")}
              class:active={tags.includes("fork")}
            >
              <Icon name="remove" size="1.4rem" color="var(--accent)" />
              <p>Fork</p>
            </li>
          </ul>
        </section>
        {#if shown_langs.length > 0}
          <section>
            <p>Language:</p>
            <ul class="choices">
              {#each shown_langs as lang (lang)}
                <li
                  on:mouseup={toggle_tag(`lang:${lang}`)}
                  class:active={tags.find((it) => it == `lang:${lang}`) !=
                    undefined}
                >
                  <Icon name="remove" size="1.4rem" color="var(--accent)" />
                  <p>{lang}</p>
                </li>
              {/each}
            </ul>
          </section>
        {/if}
        {#if shown_tags.length > 0}
          <section>
            <p>Tags:</p>
            <ul class="tags choices">
              {#each shown_tags as tag (tag)}
                <li
                  on:mouseup={toggle_tag(`tag:${tag}`)}
                  class:active={tags.find((it) => it == `tag:${tag}`) !=
                    undefined}
                >
                  <Icon name="remove" size="1.4rem" color="var(--accent)" />
                  <p>{tag}</p>
                </li>
              {/each}
            </ul>
          </section>
        {/if}
      {:else}
        <section class="info">
          <h3>Legend</h3>
          <div class="row">
            <Icon name="merge" size="2rem" />
            <h4>Fork</h4>
          </div>
          <ul>
            <li class="row">
              <span class="color" style="background-color:var(--green)" />
              <p>Merged</p>
            </li>
            <li class="row">
              <span class="color" style="background-color:var(--yellow)" />
              <p>Not merged</p>
            </li>
            <li class="row">
              <span class="color" style="background-color:var(--blue)" />
              <p>Custom fork</p>
            </li>
          </ul>
        </section>
      {/if}
    </aside>
  {/if}

  <main class="results">
    <ul bind:this={result_list_el}>
      {#each results as pr}
        <ProjectResult project={pr} />
      {/each}
    </ul>
  </main>
</div>

<style lang="stylus">
.content-wrapper
  display flex
  flex-direction column
  gap 0.5rem

  max-width 120ch
  margin 0 auto

  @media screen and (min-width 750px)
    display grid
    grid-template-columns 2fr 3fr
    gap 1rem

.row
  display flex
  gap 0.5rem


aside.filters
  display flex
  gap 0.5rem
  flex-direction column

  max-height calc(100vh - var(--nav-))
  padding 0.5rem
  margin 0.5rem
  margin-bottom 0

  background var(--bg-light)
  border-radius 1rem

  overflow-x hidden
  overflow-y scroll

  @media screen and (min-width 750px)
    height min-content

    padding 1rem
    margin calc(var(--scroll-y, 0) + 1rem) 0 1rem 1rem

    transition margin-top ease-out 200ms


  .choices
    display flex
    align-items center
    width 100%
    overflow-x scroll
    scrollbar-color transparent transparent

    background var(--bg)
    border-radius 1rem
    padding 0.5rem

    @media screen and (min-width 600px) and (min-height 720px)
      width 100%
      flex-wrap wrap

    @media screen and (max-height 720px)
      scrollbar-color var(--accent) transparent

    li
      display flex

      padding 0.1rem 0.75rem
      margin 0.25rem

      border 0.1rem solid var(--accent)
      border-radius 2rem

      cursor pointer

      :global(.icon-remove)
        opacity 0
        margin auto
        margin-left -0.30rem
        margin-right -1.2rem
        transform scale(0.25) rotateY(-120deg)
        transition opacity 200ms ease-in, margin-right 200ms ease-in, transform 300ms ease-in

      p
        padding 0
        font-family monospace
        width max-content

      &:hover
        background-color var(--bg-accent)

      &.active
        background-color var(--bg-accent)

        p
          color var(--accent)

        :global(.icon-remove)
          opacity 1
          margin-right 0.2rem
          transform scale(1) rotateY(0deg)

aside.filters>.search.row
  display flex
  gap 1rem

  .search
    flex-grow 1

    display flex
    align-items stretch

    --icon-color var(--fg)
    border 0.15rem solid var(--accent)
    border-radius 2rem

    height 3.5rem
    padding 0 0.75rem

    input
      display block
      margin 0
      border none
      flex-grow 1
      font-size 1.2rem

    .clear-query-button
      border 0.15rem solid var(--accent)
      border-radius 100vw
      margin auto -0.25rem
      width 2.25rem
      height 2.25rem
      cursor pointer

    :global(.icon-search)
      width 2.25rem
      border-radius 1rem
      margin auto 0
    :global(.icon-search>path)
      transform translateX(-5%)

  button
    min-width 3rem
    min-height 3rem
    max-height 3rem

    margin auto 0
    padding 0

    border 0.15rem solid var(--accent)
    border-radius 1rem

    transition all ease-in-out 200ms
    :global(.icon-filter)
      margin auto
      transition all ease-in-out 200ms
    :global(.icon-filter>path)
      transform translateY(5%)
    p
      font-size 1.75rem
      font-weight bold
      padding 0
      transform translateY(-5%)

    &:hover
      --icon-color var(--accent)
      p
        color var(--accent-7)
    &:active
      --icon-color var(--accent-7)
      p
        color var(--bg)

aside.filters>.info
  ul
    margin-left 1rem
    .row
      align-items center
      background var(--bg-accent)
      border-radius 0.25rem
      padding 0.15rem
      margin 0.25rem
      p
        padding 0
  .color
    min-width 1.25rem
    min-height 1.25rem
    border-radius 0.5rem
    border 0.3rem solid var(--bg)


main.results
  margin 0.5rem
  margin-top 0

  ul
    display flex
    flex-direction column
    gap 1rem

    list-style none

  @media screen and (min-width 750px)
    margin 1rem 1rem 0 0
</style>
