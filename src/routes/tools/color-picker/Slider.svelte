<script>
  import { onMount } from "svelte";
  import { CS, DEFAULT } from "./colors";

  export let label = "Slider";
  export let field = null;
  export let min = 0;
  export let max = 100;

  export let color = DEFAULT[CS.HSL];

  export let display = (value) => value;
  export let parse = (input) => input;

  export let setProperty = (value) => {
    if (color) {
      color[field] = value;
    }
  };

  $: valuePerc = Math.round((color[field] / Math.abs(max - min)) * 100);

  /**
   * @type {import("./colors").SliderInit}
   */
  export let background;
  /**
   * @type {import("./colors").SliderInit}
   */
  export let backgroundFrom;
  /**
   * @type {import("./colors").SliderInit}
   */
  export let backgroundTo;

  let input;

  $: style = (() => {
    let result = "";

    function push(value) {
      if (result.length > 0) {
        result += "; ";
      }
      result += value;
    }

    if (background) {
      push(`--background: ${background(color)}`);
    }
    if (backgroundFrom) {
      push(`--background-from: ${backgroundFrom(color)}`);
    }
    if (backgroundTo) {
      push(`--background-to: ${backgroundTo(color)}`);
    }

    return result;
  })();

  let dragFrom = null;
  let dragArea;
  /**
   * @param {MouseEvent} e
   */
  function dragStart(e) {
    dragFrom = [e.pageX, e.pageY];
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", dragEnd);
  }
  /**
   * @param {MouseEvent} e
   */
  function drag(e) {
    if (dragFrom) {
      let rect = dragArea.getBoundingClientRect();
      let relativeX = e.pageX - rect.x;
      let x = Math.max(
        min,
        Math.min((relativeX / rect.width) * Math.abs(max - min) + min, max)
      );
      setProperty(parse(Math.round(x).toString()));
    } else {
      document.addEventListener("mousemove", drag);
      document.addEventListener("mouseup", dragEnd);
    }
  }
  /**
   * @param {MouseEvent} e
   */
  function dragEnd() {
    dragFrom = null;
    document.removeEventListener("mousemove", drag);
    document.removeEventListener("mouseup", dragEnd);
  }
  /**
   * @param {KeyEvent} e
   */
  function inputChange(e) {
    try {
      let value = parse(e.target.value);
      setProperty(value);
    } catch (e) {}
  }
</script>

<div>
  <p>{label}</p>
  <div class={field} on:mousedown={dragStart} bind:this={dragArea}>
    <div {style} class="background"></div>
    <div
      role="slider"
      tabindex="0"
      aria-valuenow={display(color[field])}
      style="--value-perc:{valuePerc}%"
    ></div>
  </div>
  <p
    type="text"
    class="value"
    bind:this={input}
    on:keydown={inputChange}
    on:keyup={inputChange}
    contenteditable="true"
  >
    {display(color[field])}
  </p>
</div>

<style lang="stylus">
div
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-rows: auto 1fr;
    align-items: center
    position: relative;

    p
        grid-area: 1 / 1 / 2 / 3;

    div:has([role="slider"])
        grid-area: 2 / 1 / 3 / 2;
        display: flex
        align-items: center
        border-radius: 100vw;
        height: 1.5rem;
        border: solid 0.1rem black;
        outline: solid 0.15rem white;
        margin: 0.5rem
        overflow: hidden

        background: conic-gradient(var(--bg-light) 90deg, var(--bg-accent) 90deg 180deg, var(--bg-light) 180deg 270deg, var(--bg-accent) 270deg)
        background-size: 0.5rem 0.5rem

        .background
          position: absolute
          content: "";
          width: 100%;
          height: 100%;
          background: var(--background, linear-gradient(to right, var(--background-from, transparent),var(--background-to, transparent)))

        [role="slider"]
            width: 1px;
            height: (@height - 0.1rem);
            background-color: black;
            outline: solid 1px white;
            left: var(--value-perc)

    p.value
        grid-area: 2 / 2 / 3 / 3;
        min-width: 6ch;
        width: fit-content;
        text-align: center;
        padding-bottom: 0.1rem
        border-bottom: solid 0.1rem var(--accent)
</style>
