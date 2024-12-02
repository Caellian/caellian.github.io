<script>
  export let keywords;
</script>

{#if keywords.length > 0}
  <div class="tags">
    {#each keywords as tag}
      <a href="/blog/tag/{tag}" class="hash tag button">{tag}</a>
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
