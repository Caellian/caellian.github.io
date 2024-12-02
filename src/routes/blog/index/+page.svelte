<script>

/**
 * @type {{
 *   posts: import("$lib/posts").PostData[],
 *   topics: Set<string>,
 *   keywords: Set<string>,
 * }}
 */
export let data;

</script>

<h2>Posts</h2>
<ul>
    {#each data.posts as post}
        <li><a href="/blog/p/{post.slug}">/blog/p/{post.slug} ({post.name})</a></li>
    {/each}
</ul>

<h2>Topics</h2>
<ul>
    {#each data.topics as topic}
        <li><a href="/blog/topic/{topic}">{topic}</a></li>
    {/each}
</ul>

<h2>Tags</h2>
<ul>
    {#each data.keywords as keyword}
        <li><a href="/blog/tag/{keyword}">#{keyword}</a></li>
    {/each}
</ul>

<style>
ul li {
    list-style: initial;
    margin-left: 2rem;
}
</style>