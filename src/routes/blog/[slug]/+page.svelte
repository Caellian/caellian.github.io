<script>
  import { onMount } from "svelte";
  import { BASE_URL } from "$lib/store";
  import Icon from "$components/Icon.svelte";
  import Comments from "$components/Comments.svelte";
  import CopyButton from "$components/CopyButton.svelte";

  export let data;

  function formatDate(date) {
    let d = new Date(date);
    return d.toISOString().slice(0, 10);
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

  async function addCopy() {
    let marked = article.querySelectorAll(
      'div[data-copy]+pre:has(code[class*="language-"])'
    );
    for (const pre of marked) {
      pre.previousElementSibling.remove();
      let content = pre.querySelector('code[class*="language-"]').innerText;
      new CopyButton({
        target: pre,
        props: {
          content,
        },
      });
      // Wait for the DOM to update
      requestAnimationFrame(() => {
        let button = pre.querySelector("button.copy");
        button.onclick = () => {
          navigator.clipboard.writeText(content);
        };
      });
      // This is so stupid... not even onMount works
    }
  }

  function addLineNumbers() {
    let codes = article.querySelectorAll("pre>code");
    for (const code of codes) {
      let lines = code.innerText.split("\n");
      let line_count = lines.length;
      let max_width = line_count.toString().length;
      let line_numbers = "";
      for (let i = 1; i <= line_count; i++) {
        let padded = i.toString().padStart(max_width, "0");
        line_numbers += `<span class="line-number">${padded}</span>`;
      }
      let pre = code.parentElement;
      pre.innerHTML =
        `<span class="line-numbers">${line_numbers}</span>` + pre.innerHTML;
    }
  }

  onMount(() => {
    SHARE_CONTENT = `Check out Tin's post "${data.title}": ${BASE_URL}/blog/${data.slug}`;
    mastodon_instance =
      localStorage.getItem(MASTODON_INSTANCE_KEY) || undefined;

    addCopy();
    addLineNumbers();
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
  <title>{data.title} - tinsvagelj::net</title>
</svelte:head>

<article bind:this={article}>
  <h1 class="title">{data.title}</h1>
  {#if data.update}
    <p class="date">✏️ Updated: {formatDate(data.update)}</p>
  {/if}
  <p class="date">📌 Published: {formatDate(data.date)}</p>
  <hr />
  <svelte:component this={data.content} />
</article>

<aside>
  <p>Share</p>
  <div class="share-targets">
    <button on:click={shareMastodon}>
      <Icon size="1.5rem" name={"mastodon"}></Icon>
    </button>
  </div>
</aside>

<Comments slug={data.slug}></Comments>

<style lang="stylus">
article,
aside
  padding: 1rem
  border-radius: 0.2rem
  background-color: var(--bg-light)
  border: 2px solid var(--bg-accent)

  .title
    padding-bottom 0.2rem
  
  hr
    margin-top 0.5rem
    margin-bottom 1rem

.date
  font-size: 0.8rem
  color: var(--fg-muted)

aside
  display: flex
  align-items: center
  margin-top: 0.5rem

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
  position: relative
  gap: 0.5rem

  :global(button.copy)
    position: absolute
    top: 0.5rem
    right: 0.5rem

:global(span.line-numbers)
  display: flex
  flex-direction: column
  user-select: none
  text-align: right
  color: var(--fg-hint)
  border-right: 1px solid var(--fg-hint)
  padding-right: 0.5rem
  margin-left: -0.2rem
  margin-top: -1px
  opacity: 0.5

</style>
