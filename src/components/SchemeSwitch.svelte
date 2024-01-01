<script>
  import { onMount } from "svelte";

  let current = "light";

  function toggle_scheme() {
    if (current == "light") {
      current = "dark";
    } else {
      current = "light";
    }
    localStorage.setItem("scheme-preference", current);

    document.querySelector("body").setAttribute("data-scheme", current);
  }

  onMount(() => {
    current =
      localStorage.getItem("scheme-preference") ||
      document.querySelector("body").getAttribute("data-scheme") ||
      "light";
  });
</script>

<button id="scheme-toggle" class={current} on:click={toggle_scheme}>
  <svg viewBox="0 0 24 24" class="sun">
    <circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"
    ></line><line x1="12" y1="21" x2="12" y2="23"></line><line
      x1="4.22"
      y1="4.22"
      x2="5.64"
      y2="5.64"
    ></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line
      x1="1"
      y1="12"
      x2="3"
      y2="12"
    ></line><line x1="21" y1="12" x2="23" y2="12"></line><line
      x1="4.22"
      y1="19.78"
      x2="5.64"
      y2="18.36"
    ></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
  <svg viewBox="0 0 24 24" class="moon">
    <path
      xmlns="http://www.w3.org/2000/svg"
      d="M14.768 3.96v.001l-.002-.005a9.08 9.08 0 0 0-.218-.779c-.13-.394.21-.8.602-.67.29.096.575.205.855.328l.01.005A10.002 10.002 0 0 1 12 22a10.002 10.002 0 0 1-9.162-5.985l-.004-.01a9.722 9.722 0 0 1-.329-.855c-.13-.392.277-.732.67-.602.257.084.517.157.78.218l.004.002A9 9 0 0 0 14.999 6a9.09 9.09 0 0 0-.231-2.04ZM16.5 6c0 5.799-4.701 10.5-10.5 10.5-.426 0-.847-.026-1.26-.075A8.5 8.5 0 1 0 16.425 4.74c.05.413.075.833.075 1.259Z"
    />
  </svg>
</button>

<style lang="stylus">
#scheme-toggle
    --icon-size 1.5rem
    --padding 0.5rem
    --border-size 2px

    overflow hidden
    height calc(var(--icon-size) + var(--padding) * 2 + var(--border-size))
    width calc(var(--icon-size) + var(--padding) * 2 + var(--border-size))
    margin auto
    padding 0

    svg
        width var(--icon-size)
        height var(--icon-size)
        margin var(--padding)
        
        transform translateY(0rem)
        transition transform transition-short ease-in-out

    .moon
        fill var(--fg)
        stroke none
    .sun
        fill none
        stroke var(--fg)
        stroke-width 2px

    &.light
        svg
            transform translateY(calc((var(--icon-size) + var(--padding) * 2 + var(--border-size) * 2) * -1))

</style>
