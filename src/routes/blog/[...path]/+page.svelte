<script lang="ts">
  import { page } from "$app/stores";
  import type { PageData } from "./$types";

  export let data: PageData;
</script>

{#if data.post}
  {#if data.post.previous}
    <p>
      Previous post: <a href="/blog/{data.post.previous}"
        >{data.previousTitle}</a
      >
    </p>
  {/if}

  <h1>{data.post.title}</h1>
  <div>{@html data.content}</div>

  {#if data.post.next}
    <p>Next post: <a href="/blog/{data.post.next}">{data.nextTitle}</a></p>
  {/if}
{:else}
  <p>Unknown post</p>
{/if}
