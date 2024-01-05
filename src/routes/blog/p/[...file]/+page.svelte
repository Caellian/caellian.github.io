<script>
  import { onMount } from "svelte";
  import { BASE_URL } from "$lib/store";
  import Icon from "$components/Icon.svelte";
  import Comments from "$components/Comments.svelte";
  import CopyButton from "$components/CopyButton.svelte";
  import TagList from "../../../../components/TagList.svelte";

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

  async function addBlockTitle() {
    let blocks = article.querySelectorAll('pre:has(code[class*="language-"])');

    for (const block of blocks) {
      let title = Array.from(block.classList).find((c) =>
        c.startsWith("language-")
      );
      if (title) {
        title = title.split("-")[1];
      } else {
        title = "code";
      }

      let before = block.previousElementSibling;

      // insert element before pre
      let title_element = document.createElement("div");
      title_element.classList.add("block-title");
      title_element.innerHTML = `<span class="title">${title}</span>`;
      block.insertAdjacentElement("beforebegin", title_element);

      let content = block.querySelector('code[class*="language-"]').innerText;
      requestAnimationFrame(() => {
        if (before.tagName === "DIV" && before?.hasAttribute("data-copy")) {
          let title_element = block.previousElementSibling;
          new CopyButton({
            target: title_element,
            props: {
              content,
            },
          });

          requestAnimationFrame(() => {
            let button = title_element.querySelector("button.copy");
            button.onclick = () => {
              navigator.clipboard.writeText(content);
            };
          });
        }
      });
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

    addBlockTitle();
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

<article bind:this={article} class="island">
  <h1 class="title">{data.title}</h1>
  {#if data.update}
    <p class="date">✏️ Updated: {formatDate(data.update)}</p>
  {/if}
  <p class="date">📌 Published: {formatDate(data.date)}</p>
  <TagList tags={data.tags} />
  <hr />
  <svelte:component this={data.content} />
</article>

<aside class="island">
  <p>Share</p>
  <div class="share-targets">
    <button on:click={shareMastodon}>
      <Icon size="1.5rem" name={"mastodon"}></Icon>
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
  gap: 0.5rem

:global(div.block-title)
  display flex
  justify-content space-between
  background-color: var(--bg)
  border-radius 0.2rem
  padding 0.2rem 0.2rem 0.7rem 0.5rem
  margin-bottom -1rem

  :global(button.copy)
    padding 0
    padding-right 0.25rem
    border none
    font-size 0.9rem
    

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

@import "../../../../style/tones.styl"
</style>
