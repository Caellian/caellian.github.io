<script>
  export let tags;
</script>

{#if tags.length > 0}
  <div class="tags">
    {#each tags as tag}
      <a href="/blog/tag/{tag}" class="hash tag">{tag}</a>
    {/each}
  </div>
{/if}

<style lang="stylus">
.tags
  display flex
  gap 0.25rem
  flex-wrap wrap

  a.tag
    font-size 0.75rem
</style>
