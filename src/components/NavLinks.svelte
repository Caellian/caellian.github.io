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

  function on_click(target) {
    return () => {
      clickDispatch("click", { target });
    };
  }
</script>

{#each links as l}
  <li class:current={$page.url.pathname === l.link}>
    <a href={l.link} on:click={on_click(l.link)}>{l.name}</a>
  </li>
{/each}
