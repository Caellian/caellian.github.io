<script>
  import { onMount } from "svelte";
  import { BASE_URL } from "$lib/store";
  import Icon from "$components/Icon.svelte";
  import Comments from "../../../components/Comments.svelte";

  export let data;

  function formatDate(date) {
    let d = new Date(date);
    return d.toISOString().slice(0, 10);
  }

  const MASTODON_INSTANCE_KEY = "user-mastodon-instance";
  let mastodon_instance;

  const SHARE_CONTENT = `Check out Tin's post "${data.title}": ${BASE_URL}/blog/${data.slug}`;

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
    mastodon_instance =
      localStorage.getItem(MASTODON_INSTANCE_KEY) || undefined;
  });
</script>

<article>
  <h1>{data.title}</h1>
  {#if data.update}
    <p class="date">✏️ Updated: {formatDate(data.update)}</p>
  {/if}
  <p class="date">📌 Published: {formatDate(data.date)}</p>
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

</style>
