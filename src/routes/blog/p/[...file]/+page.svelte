<script>
  import { onMount } from "svelte";
  import { BASE_URL } from "$lib/store";
  import { postDateISO } from "$lib/posts";
  import Icon from "$components/Icon.svelte";
  import Comments from "$components/Comments.svelte";
  import CopyButton from "$components/CopyButton.svelte";
  import TagList from "$components/TagList.svelte";

  export let data;

  function formatDate(date) {
    let iso = postDateISO(date);
    return iso.slice(0, 10);
  }

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

  onMount(() => {
    SHARE_CONTENT = `Check out Tin's post "${data.title}": ${BASE_URL}/blog/${data.slug}`;
    mastodon_instance =
      localStorage.getItem(MASTODON_INSTANCE_KEY) || undefined;
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
  {#if data.update}
    <p class="date">✏️ Updated: {formatDate(data.update)}</p>
  {/if}
  <p class="date">📌 Published: {formatDate(data.create)}</p>
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

<style lang="stylus">
article
  .title
    padding-top 0
    padding-bottom 0.2rem
  
  hr
    margin 1rem 0

  :global(p)
    text-align justify

.date
  font-size: 0.8rem
  color: var(--fg-muted)

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

    :global(.icon)
      margin-inline: 0.25rem
      transition: margin-left ease-in-out transition-medium, margin-right ease-in-out transition-medium
      --icon-color var(--fg-muted)
    

  :global(.icon)
      grid-row: 1 / span 2

  .prev
    grid-column: 1 / 2
    text-align: left

    a
      grid-template-columns: auto 1fr

      :global(.icon)
        grid-column: 1 / 2
        margin-left: 0.5rem

      &:hover
        :global(.icon)
          margin-left: 0rem

  .next
    grid-column: 2 / 3
    text-align: right

    a
      grid-template-columns: 1fr auto

      :global(.icon)
        grid-column: 2 / 3
        margin-right: 0.5rem

      &:hover
        :global(.icon)
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

:global(pre:has(code[class*="language-"]))
  display: flex
  gap: 0.5rem

:global(#blog-layout)
  padding-bottom 2rem

  :global(>h1),
  :global(>h2),
  :global(>h3),
  :global(>h4),
  :global(>h5),
  :global(>h6)
    margin-left: 1rem

:global(span[data-paraphrase]:after)
  display block
  float inline-end
  content "~paraphrased"
  font-style italic
  font-size small
  color var(--fg-muted)
  border-radius 0.2rem
</style>
