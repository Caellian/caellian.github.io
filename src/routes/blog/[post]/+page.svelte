<script>
	import { page } from '$app/stores';

  /** @type {import('./$types').PageData} */
  export let data;

  // we can access `data.posts` because it's returned from
  // the parent layout `load` function
  $: index = data.posts.findIndex(post => post.slug === $page.params.slug) || -1;
  $: next = data.posts[index - 1];
</script>

{#if index >= 0}
  <h1>{data.post.title}</h1>
  <div>{@html data.post.content}</div>

  {#if next}
    <p>Next post: <a href="/blog/{next.slug}">{next.title}</a></p>
  {/if}
{/if}
