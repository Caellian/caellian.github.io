<script>
  export let type = "div";
  export let className = undefined;
  export let props = {};

  let content;

  function uplift(node) {
    // content will only be defined after the first render, so all logic can be done in update
    return {
      update() {
        const el = document.createElement(`${type}`);
        el.className = className || "";
        for (const key in props) {
          content.setAttribute(key, props[key]);
        }

        el.replaceChildren(content);
        node.appendChild(el);
      },
    };
  }
</script>

<div use:uplift>
  <div bind:this={content}>
    <slot />
  </div>
</div>

<style lang="stylus">
div
    display contents
</style>
