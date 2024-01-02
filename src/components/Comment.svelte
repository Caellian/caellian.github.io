<script>
  import { onMount } from "svelte";
  import Icon from "./Icon.svelte";

  export let comments;
  export let current;
  export let depth = 0;

  let replies = [];

  let accountName = current.account.display_name;
  let attachments = [];

  function escapeHtml(unsafe) {
    return (unsafe || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function user_account(account) {
    var result = `@${account.acct}`;
    if (account.acct.indexOf("@") === -1) {
      var domain = new URL(account.url);
      result += `@${domain.hostname}`;
    }
    return result;
  }

  function formatDate(date) {
    let d = new Date(date);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  }

  onMount(() => {
    current.account.emojis.forEach((emoji) => {
      accountName = accountName.replace(
        `:${emoji.shortcode}:`,
        `<img src="${this.escapeHtml(emoji.static_url)}" alt="Emoji ${
          emoji.shortcode
        }" height="20" width="20" />`
      );
    });

    attachments = current.media_attachments.map((attachment) => {
      if (attachment.type === "image") {
        return `<a href=${attachment.url} rel="nofollow"><img src="${
          attachment.preview_url
        }" alt="${escapeHtml(attachment.description)}" /></a>`;
      } else if (attachment.type === "video") {
        return `<video controls><source src="${attachment.url}" type="${attachment.mime_type}"></video>`;
      } else if (attachment.type === "gifv") {
        return `<video autoplay loop muted playsinline><source src="${attachment.url}" type="${attachment.mime_type}"></video>`;
      } else if (attachment.type === "audio") {
        return `<audio controls><source src="${attachment.url}" type="${attachment.mime_type}"></audio>`;
      } else {
        return `<a href="${attachment.url}" rel="nofollow">${attachment.type}</a>`;
      }
    });

    replies = comments.filter((comment) => {
      return comment.in_reply_to_id === current.id;
    });
  });
</script>

<div class="mastodon-comment" style="--depth:{depth}">
  <div class="author">
    <div class="avatar">
      <img
        src={escapeHtml(current.account.avatar_static)}
        height="50"
        width="50"
        alt=""
      />
    </div>
    <div class="details">
      <a class="name" href={current.account.url} rel="nofollow"
        >{@html accountName}</a
      >
      <a class="user" href={current.account.url} rel="nofollow"
        >{user_account(current.account)}</a
      >
    </div>
    <div class="spacer" />
    <p class="date" rel="nofollow">
      {formatDate(current.created_at)}
    </p>
  </div>
  <div class="content">{@html current.content}</div>
  <div class="attachments">
    {#each attachments as attachment}
      {@html attachment}
    {/each}
  </div>
  <div class="status">
    <div class={`replies ${current["replies_count"] > 0 ? "active" : ""}`}>
      <a href={current.url} rel="nofollow">
        <Icon name="reply" size="1.5rem"></Icon>
        {current["replies_count"]}
      </a>
    </div>
    <div class={`reblogs ${current["reblogs_count"] > 0 ? "active" : ""}`}>
      <a href={current.url} rel="nofollow">
        <Icon name="boost" size="1.5rem"></Icon>
        {current["reblogs_count"]}
      </a>
    </div>
    <div
      class={`favourites ${current["favourites_count"] > 0 ? "active" : ""}`}
    >
      <a href={current.url} rel="nofollow">
        <Icon name="star" size="1.5rem"></Icon>
        {current["favourites_count"]}
      </a>
    </div>
  </div>
</div>

{#if replies.length > 0}
  <div class="comment-replies">
    {#each replies as reply}
      <svelte:self {comments} current={reply} depth={depth + 1} />
    {/each}
  </div>
{/if}

<style lang="stylus">
.mastodon-comment
    padding: 0.5rem
    margin-left: calc(var(--comment-indent) * var(--depth))
    display: flex
    flex-direction: column

    .author
        display: flex
        align-items: center

        .avatar img
            margin: auto
            margin-right: 1rem
            min-width: 5px
            border-radius: 0.2rem
            border: 2px var(--bg-accent) solid

        .details
            display: flex
            flex-direction: column

            .name
                font-weight: bold
            .user
                color: var(--fg-hint)
                font-size: medium

        .date
            width: max-content
            color: var(--fg-hint)
            font-size: 0.8rem

    .content
        margin: 0.5rem 1rem 1rem 0.5rem

    .attachments
        margin: 0 1rem
        
        >*
            margin: 0 1rem
        img
            max-width: 100%

    .status
        display: flex
        align-items: center

        a
            display: flex
            align-items: center
            color: var(--bg-accent)
            --icon-color: var(--bg-accent)
            
        > div
            display: inline-block
            margin-right: 15px

        .replies.active a
            color: var(--blue)
            --icon-color: var(--blue)

        .reblogs.active a
            color: var(--green)
            --icon-color: var(--green)

        .favourites.active a
            color: var(--yellow)
            --icon-color: var(--yellow)

.comment-replies
    display: flex
    flex-direction: column
    gap: 1.5rem
    padding-top: 1.5rem
    border-top: 2px dashed var(--bg-accent)
    border-left: 2px solid var(--bg-accent)
</style>
