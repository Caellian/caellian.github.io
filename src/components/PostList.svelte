<script>
  import TagList from "./TagList.svelte";

  export let posts;

  function formatDate(date) {
    let d = new Date(date);
    return d.toISOString().slice(0, 10);
  }
</script>

<div class="post-list island">
  {#each posts as post}
    <a href="/blog/p/{post.slug}" class="post">
      <div class="date center">
        <span>{formatDate(post.update || post.date)}</span>
      </div>
      <div class="details">
        <h3 class="title">{post.title}</h3>
        <div class="summary">{post.summary}</div>
        <TagList tags={post.tags} />
      </div>
    </a>
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
