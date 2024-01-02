<script>
  import { page } from "$app/stores";
  import { createEventDispatcher } from "svelte";

  const clickDispatch = createEventDispatcher();

  /**
   * @typedef {Object} NavLink
   * @prop {string} link
   * @prop {string} name
   *
   * @type {NavLink[]}
   */
  const links = [
    {
      link: "/",
      name: "About Me",
    },
    {
      link: "/projects",
      name: "Projects",
    },
    {
      link: "/blog",
      name: "Blog",
    },
    {
      link: "/contact",
      name: "Contact",
    },
  ];

  function onClick(target) {
    return () => {
      clickDispatch("click", { target });
    };
  }

  function checkMatch(page, link) {
    if (link === "/") return page === link;
    return page.startsWith(link);
  }
</script>

{#each links as l}
  <li class:current={checkMatch($page.url.pathname, l.link)}>
    <a href={l.link} on:click={onClick(l.link)}>{l.name}</a>
  </li>
{/each}
