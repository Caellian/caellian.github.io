<script>
  // Adapted from https://github.com/dpecos/mastodon-comments

  import { onMount } from "svelte";
  import { BASE_URL } from "$lib/store";
  import Comment from "./Comment.svelte";
  export let host = "mastodon.social";

  export let ownerName = "caellian";
  export let ownerId = "108755498239225694";

  export let slug;

  let state = "Loading...";

  let rootToot;
  let comment_list;

  let loadStarted = false;
  let comments = null;

  async function locateAuthorToot() {
    let postUrl = `${BASE_URL}/blog/${slug}`;

    let response = await fetch(
      `https://${host}/api/v1/accounts/${ownerId}/statuses?exclude_replies=true&exclude_reblogs=true&tagged=blog&tagged=post`
    );

    let data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      data = data
        .filter((it) => it["content"].includes(postUrl))
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      if (data.length == 0) {
        return null;
      }
      rootToot = data[0]["id"];
    }

    return rootToot;
  }

  async function loadComments() {
    if (loadStarted) return;
    loadStarted = true;

    let tootId = await locateAuthorToot();

    if (tootId == null) {
      state = "Owner hasn't started a discussion for this post on Mastodon.";
      return;
    }

    state = "Loading comments from the Fediverse...";

    let response = await fetch(
      `https://${host}/api/v1/statuses/${tootId}/context`
    );

    let data = await response.json();

    if (
      data["descendants"] &&
      Array.isArray(data["descendants"]) &&
      data["descendants"].length > 0
    ) {
      comments = data["descendants"].sort((a, b) =>
        a.created_at.localeCompare(b.created_at)
      );
    } else {
      state = "No comments found.";
    }
  }

  function observeVisibility() {
    const observer = new IntersectionObserver(
      function (entries) {
        if (loadStarted) return;
        entries.forEach((entry) => {
          if (entry.intersectionRatio > 0) {
            loadComments();
          }
        });
      },
      { root: null }
    );
    observer.observe(comment_list);
  }

  function addComent() {
    open(
      `https://${host}/@${ownerName}/${rootToot}`,
      "blank",
      "noopener noreferrer"
    );
  }

  onMount(() => {
    observeVisibility();
  });
</script>

<h2>Comments</h2>

<noscript>
  <div id="error">
    Fediverse comments don't work without JavaScript enabled.
  </div>
</noscript>

<div bind:this={comment_list} class="comment-section">
  {#if rootToot != null}
    <button class="leave-comment" on:click={addComent}>Leave a Comment</button>
  {/if}
  {#if comments != null}
    {#each comments as c}
      {#if c.in_reply_to_id == rootToot}
        <Comment {comments} current={c} />
      {/if}
    {/each}
  {:else}
    <p>{state}</p>
  {/if}
</div>

<style lang="stylus">
h2
  margin-top: 1rem

.comment-section
  margin: 0 auto
  --comment-indent: 1rem

button.leave-comment
  margin: auto
  margin-bottom: 1rem
</style>
