<script lang="ts">
  import type { PageData } from "./$types";

  export let data: PageData;
</script>

{#if data.post}
  {#if data.post.previous}
    <a rel="prev" href="/blog/{data.post.previous}">
      Previous post: {data.previousTitle}
    </a>
  {/if}

  <h1>{data.post.title}</h1>
  <div>{@html data.content}</div>

  {#if data.post.next}
    <a rel="next" href="/blog/{data.post.next}">Next post: {data.nextTitle}</a>
  {/if}
{:else}
  <p>Unknown post</p>
{/if}
