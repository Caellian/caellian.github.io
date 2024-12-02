<script>
  import TagList from "./TagList.svelte";

  /**
   * @type {import("$lib/posts").PostData[]}
   */
  export let posts;

  function formatDate(date) {
    let iso = date.toISOString();
    return iso.slice(0, 10);
  }
</script>

<div class="post-list island">
  {#each posts as post}
    <div class="post">
      <div class="date center">
        <span>{formatDate(post.dateModified || post.datePublished || new Date())}</span>
      </div>
      <div class="details">
        <a href="/blog/p/{post.slug}"><h3 class="title">{post.name}</h3></a>
        <div class="summary">{post.abstract}</div>
        <TagList keywords={post.keywords} />
      </div>
    </div>
  {/each}
</div>

<style lang="stylus">
.post-list .post
  display flex
  align-items stretch
  gap 0.5rem
  margin-left 1ch

  +.post
    margin-top 1rem
  
  .details
    display flex
    flex-direction column
    gap 0.5rem
    color: var(--fg)

    .title
      padding 0
      font-size 1.25rem

  .date
    padding-right 1rem
    border-right 2px solid var(--bg)
    font-family var(--fnt-mono)
    color: var(--fg)
</style>
