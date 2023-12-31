<script>
  import { PUBLIC_BUILD_BLOG as include_links } from "$env/static/public";

  export let article;
</script>

<a rel={include_links ? "external" : undefined} href={"/blog/" + article.url}
  >{article.title}</a
>
