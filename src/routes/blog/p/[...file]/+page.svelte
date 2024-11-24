<script>
  import { mount, onMount } from "svelte";
  import { BASE_URL } from "$lib/store";
  import { postDateISO } from "$lib/posts";
  import { debounce } from "$lib/util";
  import Icon from "$components/Icon.svelte";
  import Comments from "$components/Comments.svelte";
  import TagList from "$components/TagList.svelte";

  export let data;

  function formatDate(date) {
    let iso = postDateISO(date);
    return iso.slice(0, 10);
  }

  const BLOG_GITHUB_REPO = "https://github.com/Caellian/blog";

  const MASTODON_INSTANCE_KEY = "user-mastodon-instance";
  let mastodon_instance;

  let SHARE_CONTENT;

  let article;

  function shareMastodon() {
    if (!mastodon_instance) {
      let instance = window.prompt(
        "Enter your mastodon instance",
        "mastodon.social"
      );
      if (!instance || instance.length === 0) {
        alert("Instance required");
        return;
      }
      localStorage.setItem(MASTODON_INSTANCE_KEY, instance);
      mastodon_instance = instance;
    }

    open(
      `https://${mastodon_instance}/share?text=${encodeURIComponent(
        SHARE_CONTENT
      )}`,
      "blank",
      "noreferrer noopener"
    );
  }

  function reanimateButtons() {
    let codeBlocks = article.querySelectorAll("div.code-block");
    for (let block of codeBlocks) {
      let button = block.querySelector("button.copy");
      if (!button) {
        continue;
      }

      button.innerHTML = "";
      mount(Icon, {
        target: button,
        props: {
          name: "copy",
        },
      });

      let code = block.querySelector("code");
      let resetLabel = debounce(() => {
        button.innerHTML = "";
        mount(Icon, {
          target: button,
          props: {
            name: "copy",
          },
        });
      }, 3000);
      button.onclick = () => {
        navigator.clipboard.writeText(code.innerText);
        button.innerHTML = "";
        mount(Icon, {
          target: button,
          props: {
            name: "copied",
          },
        });
        resetLabel();
      };
    }
  }

  function reevaluateJS() {
    let scripts = article.querySelectorAll("script");
    for (const script of scripts) {
      eval(script.textContent);
    }
  }

  onMount(() => {
    SHARE_CONTENT = `Check out Tin's post "${data.title}": ${BASE_URL}/blog/${data.slug}`;
    mastodon_instance =
      localStorage.getItem(MASTODON_INSTANCE_KEY) || undefined;

    reanimateButtons();
    reevaluateJS();
  });
</script>

<svelte:head>
  {#if data.summary}
    <meta name="description" content={data.summary} />
  {:else}
    <meta
      name="description"
      content="Tin Švagelj's '{data.title}' blog post."
    />
  {/if}
  <link
    href="/blog/p/{data.slug}/data.json"
    rel="alternate"
    type="application/json"
    title="Post Data"
  />
  <title>{data.title} - tinsvagelj::net</title>
</svelte:head>

<article bind:this={article} class="island">
  <h1 class="title">{data.title}</h1>
  <div class="dates">
  {#if data.update}
    <p class="date">
      <Icon name="history" size="1.5em" />
      <span>Updated:</span>
      <a href="{BLOG_GITHUB_REPO}/commits/main/{data.slug}.md">{formatDate(data.update)}</a>
    </p>
  {/if}
  <p class="date">
    <Icon name="pen" size="1.5em" />
    <span>Published:</span>
    <span>{formatDate(data.create)}</span>
  </p>
  </div>
  <TagList tags={data.tags} />
  <hr />
  {@html data.content}
</article>

{#if data.prevTitle || data.nextTitle}
  <aside class="island related">
    {#if data.prevTitle}
      <div class="prev">
        <a href="/blog/p/{data.prev}">
          <Icon size="1.5rem" name="arrow-left" />
          <span>Previous</span>
          <span class="title">{data.prevTitle}</span>
        </a>
      </div>
    {/if}
    {#if data.nextTitle}
      <div class="next">
        <a href="/blog/p/{data.next}">
          <span>Next</span>
          <Icon size="2rem" name="arrow-right" />
          <span class="title">{data.nextTitle}</span>
        </a>
      </div>
    {/if}
  </aside>
{/if}

<aside class="share island">
  <p>Share</p>
  <div class="share-targets">
    <button on:click={shareMastodon}>
      <Icon size="2rem" name={"mastodon"}></Icon>
    </button>
  </div>
</aside>

<Comments slug={data.slug} rootToot={data.toot}></Comments>

<style lang="stylus" global>
#blog-layout
  padding-bottom 2rem

  >h1,
  >h2,
  >h3,
  >h4,
  >h5,
  >h6
    margin-left: 1rem

#blog-layout article
  .title
    padding-top 0
    padding-bottom 0.2rem
  
  hr
    margin 1rem 0

  p
    text-align justify

  .dates
    display: flex
    justify-content: flex-start
    gap: 1em
    font-size: 0.8rem

  .date
    display: flex
    width: max-content
    gap: 0.2em
    color: var(--fg-muted)
    align-items: center

  aside
    margin-top: 0.5rem

  aside.related
    display: grid
    grid-template-columns: 1fr 1fr
    padding: 0

    >div
      background-color: var(--bg-accent)

      a
        display: grid
        align-items: center
        padding: 0.5rem 1rem

      span
        color: var(--fg-muted)

      .title
        font-weight: bold
        font-size: 1.2rem

      .icon
        margin-inline: 0.25rem
        transition: margin-left ease-in-out transition-medium, margin-right ease-in-out transition-medium
        --icon-color var(--fg-muted)
      

    .icon
        grid-row: 1 / span 2

    .prev
      grid-column: 1 / 2
      text-align: left

      a
        grid-template-columns: auto 1fr

        .icon
          grid-column: 1 / 2
          margin-left: 0.5rem

        &:hover
          .icon
            margin-left: 0rem

    .next
      grid-column: 2 / 3
      text-align: right

      a
        grid-template-columns: 1fr auto

        .icon
          grid-column: 2 / 3
          margin-right: 0.5rem

        &:hover
          .icon
            margin-right: 0rem

  aside.share
    display: flex
    align-items: center

    p
        width: max-content
        padding: 0
        padding-right: 1rem
        font-weight: bold
        color: var(--fg-muted)

    div.share-targets
      display: flex
      gap: 0.5rem

      button
        display: flex
        align-items: center
        gap: 0.5rem
        padding: 0.5rem
        border-radius: 0.2rem
        background-color: var(--bg-accent)
        color: var(--fg)
        border: 2px solid var(--bg-accent)

        &:hover
          background-color: var(--bg-accent-2)
          border-color: var(--bg-accent-2)

@import "../../../../style/article";
</style>
