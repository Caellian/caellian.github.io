<script>
  export let tags;
</script>

{#if tags.length > 0}
  <div class="tags">
    {#each tags as tag}
      <a href="/blog/tag/{tag}">{tag}</a>
    {/each}
  </div>
{/if}

<style lang="stylus">
.tags
  display flex
  gap 0.25rem

  a
    background-color var(--bg-accent)
    padding 0.25rem 0.5rem
    border-radius 0.5rem
    font-size 0.75rem
    color var(--fg-light)
    transition background-color transition-medium ease-in-out, color transition-medium ease-in-out

    &:before
      content "#"
    
    &:hover
      background-color var(--fg-hint)
      color var(--bg)
    &:active
      background-color var(--fg-muted)
</style>
